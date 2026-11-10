"""Tests de l'API Banc2Touche.

Par défaut sur SQLite ; avec TEST_DATABASE_URL=postgresql://... ils tournent sur PostgreSQL
(c'est ce que fait le workflow GitHub Actions avec un service PostgreSQL).
"""
import os
import sys
from datetime import timedelta

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
ADMIN, ADMIN_PW = "responsable", "mot-de-passe-du-test"
COACH_PW = "coach-secret-1"


@pytest.fixture()
def appmod(tmp_path, monkeypatch):
    url = os.getenv("TEST_DATABASE_URL") or f"sqlite:///{tmp_path}/test.db"
    monkeypatch.setenv("DATABASE_URL", url)
    monkeypatch.setenv("ADMIN_USERNAME", ADMIN)
    monkeypatch.setenv("ADMIN_PASSWORD", ADMIN_PW)
    monkeypatch.setenv("ENV", "test")
    import app as module
    monkeypatch.setattr(module, "KEEP", 3)
    return module


@pytest.fixture()
def client(appmod):
    application = appmod.create_app()
    engine = application.config["ENGINE"]
    with engine.begin() as c:
        for table in (appmod.backups, appmod.sessions, appmod.login_throttle, appmod.users):
            c.execute(table.delete())
    appmod.ensure_admin(engine)
    return application.test_client()


def login(client, username=ADMIN, password=ADMIN_PW):
    return client.post("/api/auth/login", json={"username": username, "password": password, "device": "iPad de test"})


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin(client):
    return bearer(login(client).json["token"])


def new_coach(client, admin, username="nino", name="Nino", password=COACH_PW):
    r = client.post("/api/users", headers=admin, json={"username": username, "name": name, "password": password})
    assert r.status_code == 201, r.json
    return r.json["item"]


def bundle(n_players=2, n_matches=1, by="iPad de test"):
    return {"app": "banc2touche", "version": 2, "exportedBy": by,
            "team": {"kind": "team", "players": [{"id": f"p{i}", "nom": "TEST", "prenom": f"J{i}"} for i in range(n_players)]},
            "matches": [{"kind": "match", "id": f"m{i}", "events": []} for i in range(n_matches)],
            "deletedMatches": {}}


def test_routes_publiques(client):
    assert client.get("/").json["app"] == "Banc2Touche API"
    assert client.get("/health").json == {"status": "ok", "db": "ok"}
    assert client.get("/info").json["app"] == "Banc2Touche API"
    assert client.get("/env").json == {"env": "test"}


# ---------- Connexion ----------

def test_connexion_du_responsable(client):
    r = login(client, "  Responsable ")  # ni la casse ni les espaces ne comptent dans l'identifiant
    assert r.status_code == 200
    assert r.json["user"] == {"id": r.json["user"]["id"], "username": ADMIN, "name": "Responsable", "role": "admin"}
    me = client.get("/api/auth/me", headers=bearer(r.json["token"]))
    assert me.json["user"]["role"] == "admin"


def test_connexion_refusee(client):
    assert login(client, password="faux").status_code == 401
    assert login(client, "inconnu").status_code == 401
    assert login(client, "inconnu").json == login(client, password="faux").json  # rien ne dit si le compte existe
    assert client.post("/api/auth/login", json={"username": ADMIN}).status_code == 400
    assert client.post("/api/auth/login", data="pas du json").status_code == 400


def test_session_obligatoire(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/backups").status_code == 401
    assert client.get("/api/backups", headers=bearer("faux")).status_code == 401
    assert client.post("/api/backups", json={"data": bundle()}).status_code == 401
    assert client.get("/api/users").status_code == 401


def test_deconnexion(client, admin):
    assert client.post("/api/auth/logout", headers=admin).json == {"ok": True}
    assert client.get("/api/auth/me", headers=admin).status_code == 401


def test_session_expiree(client, admin, appmod):
    with client.application.config["ENGINE"].begin() as c:
        c.execute(appmod.sessions.update().values(expires_at=appmod.now() - timedelta(minutes=1)))
    assert client.get("/api/auth/me", headers=admin).status_code == 401


def test_trop_d_essais(client):
    for _ in range(5):
        assert login(client, password="faux").status_code == 401
    r = login(client)  # même avec le bon mot de passe, il faut patienter
    assert r.status_code == 429 and "Réessaie" in r.json["error"]


def test_mots_de_passe_jamais_en_clair(client, admin, appmod):
    new_coach(client, admin)
    with client.application.config["ENGINE"].connect() as c:
        hashes = c.execute(appmod.select(appmod.users.c.password_hash)).scalars().all()
        tokens = c.execute(appmod.select(appmod.sessions.c.token_hash)).scalars().all()
    assert len(hashes) == 2 and all(ADMIN_PW not in h and COACH_PW not in h for h in hashes)
    assert tokens and admin["Authorization"][7:] not in tokens


# ---------- Comptes : le responsable seulement ----------

def test_gestion_des_comptes(client, admin):
    coach = new_coach(client, admin)
    assert (coach["username"], coach["name"], coach["role"], coach["active"]) == ("nino", "Nino", "coach", True)
    assert "password" not in coach and "password_hash" not in coach
    tok = bearer(login(client, "nino", COACH_PW).json["token"])

    lst = client.get("/api/users", headers=admin).json["items"]
    assert [(u["username"], u["role"], u["sessions"]) for u in lst] == [(ADMIN, "admin", 1), ("nino", "coach", 1)]

    # nouveau mot de passe : ses appareils sont déconnectés, l'ancien mot de passe ne marche plus
    r = client.patch(f"/api/users/{coach['id']}", headers=admin, json={"password": "nouveau-secret-2", "name": "Nino B."})
    assert r.status_code == 200 and r.json["item"]["name"] == "Nino B." and r.json["item"]["sessions"] == 0
    assert client.get("/api/auth/me", headers=tok).status_code == 401
    assert login(client, "nino", COACH_PW).status_code == 401
    tok = bearer(login(client, "nino", "nouveau-secret-2").json["token"])

    # compte désactivé : déconnecté tout de suite, connexion refusée
    assert client.patch(f"/api/users/{coach['id']}", headers=admin, json={"active": False}).json["item"]["active"] is False
    assert client.get("/api/backups", headers=tok).status_code == 401
    assert login(client, "nino", "nouveau-secret-2").status_code == 401
    client.patch(f"/api/users/{coach['id']}", headers=admin, json={"active": True, "username": "Nino.B"})
    assert login(client, "nino.b", "nouveau-secret-2").status_code == 200

    assert client.delete(f"/api/users/{coach['id']}", headers=admin).json == {"ok": True}
    assert login(client, "nino.b", "nouveau-secret-2").status_code == 401
    assert client.delete(f"/api/users/{coach['id']}", headers=admin).status_code == 404


def test_comptes_refuses(client, admin):
    new_coach(client, admin)
    assert client.post("/api/users", headers=admin, json={"username": "nino", "password": COACH_PW}).status_code == 409
    assert client.post("/api/users", headers=admin, json={"username": "n", "password": COACH_PW}).status_code == 400
    assert client.post("/api/users", headers=admin, json={"username": "léa", "password": COACH_PW}).status_code == 400
    assert client.post("/api/users", headers=admin, json={"username": "lea", "password": "court"}).status_code == 400
    other = new_coach(client, admin, "lea", "Léa")
    assert client.patch(f"/api/users/{other['id']}", headers=admin, json={"username": "nino"}).status_code == 409
    assert client.patch(f"/api/users/{other['id']}", headers=admin, json={}).status_code == 400


def test_un_seul_responsable(client, admin):
    """Personne d'autre ne gère les comptes, et le compte du responsable ne peut pas être retiré."""
    coach = new_coach(client, admin)
    tok = bearer(login(client, "nino", COACH_PW).json["token"])
    assert client.get("/api/users", headers=tok).status_code == 403
    assert client.post("/api/users", headers=tok, json={"username": "pirate", "password": COACH_PW}).status_code == 403
    assert client.patch(f"/api/users/{coach['id']}", headers=tok, json={"password": "volé-volé-1"}).status_code == 403
    assert client.delete(f"/api/users/{coach['id']}", headers=tok).status_code == 403

    # impossible de créer ou de devenir un second responsable
    r = client.post("/api/users", headers=admin, json={"username": "chef", "password": COACH_PW, "role": "admin"})
    assert r.json["item"]["role"] == "coach"
    client.patch(f"/api/users/{coach['id']}", headers=admin, json={"role": "admin", "name": "Nino"})
    assert [u["role"] for u in client.get("/api/users", headers=admin).json["items"]] == ["admin", "coach", "coach"]

    me = client.get("/api/auth/me", headers=admin).json["user"]
    assert client.delete(f"/api/users/{me['id']}", headers=admin).status_code == 400
    assert client.patch(f"/api/users/{me['id']}", headers=admin, json={"active": False}).status_code == 400
    assert client.patch(f"/api/users/{me['id']}", headers=admin, json={"name": "Alinoé"}).json["item"]["name"] == "Alinoé"


def test_changer_son_mot_de_passe(client, admin):
    new_coach(client, admin)
    a = bearer(login(client, "nino", COACH_PW).json["token"])
    b = bearer(login(client, "nino", COACH_PW).json["token"])
    assert client.post("/api/auth/password", headers=a, json={"current": "faux", "new": "nouveau-secret-2"}).status_code == 400
    assert client.post("/api/auth/password", headers=a, json={"current": COACH_PW, "new": "court"}).status_code == 400
    assert client.post("/api/auth/password", headers=a, json={"current": COACH_PW, "new": "nouveau-secret-2"}).json == {"ok": True}
    assert client.get("/api/auth/me", headers=a).status_code == 200  # cet appareil reste connecté
    assert client.get("/api/auth/me", headers=b).status_code == 401  # les autres doivent se reconnecter
    assert login(client, "nino", "nouveau-secret-2").status_code == 200


def test_secret_du_responsable(client, admin, appmod, monkeypatch):
    engine = client.application.config["ENGINE"]
    # le mot de passe choisi dans l'appli survit à un redémarrage du serveur
    client.post("/api/auth/password", headers=admin, json={"current": ADMIN_PW, "new": "choisi-dans-l-appli"})
    appmod.ensure_admin(engine)
    assert login(client, password="choisi-dans-l-appli").status_code == 200
    assert client.get("/api/auth/me", headers=admin).status_code == 200

    # changer le secret ADMIN_PASSWORD remet ce mot de passe et ferme les sessions (mot de passe oublié)
    monkeypatch.setenv("ADMIN_PASSWORD", "secret-de-secours")
    monkeypatch.setenv("ADMIN_USERNAME", "Alinoe")
    appmod.ensure_admin(engine)
    assert client.get("/api/auth/me", headers=admin).status_code == 401
    assert login(client, password="choisi-dans-l-appli").status_code == 401
    r = login(client, "alinoe", "secret-de-secours")
    assert r.status_code == 200 and r.json["user"]["role"] == "admin"
    assert len(client.get("/api/users", headers=bearer(r.json["token"])).json["items"]) == 1


def test_sans_responsable_configure(appmod, monkeypatch):
    monkeypatch.setenv("ADMIN_PASSWORD", "")
    application = appmod.create_app()
    with application.config["ENGINE"].begin() as c:
        for table in (appmod.sessions, appmod.login_throttle, appmod.users):
            c.execute(table.delete())
    assert login(application.test_client()).status_code == 503


# ---------- Sauvegardes ----------

def test_aller_retour(client, admin):
    new_coach(client, admin)
    coach = bearer(login(client, "nino", COACH_PW).json["token"])
    assert client.get("/api/backups/latest", headers=coach).json == {"item": None}
    r = client.post("/api/backups", headers=coach, json={"device": "iPad A", "data": bundle(3, 2)})
    assert r.status_code == 201
    item = r.json["item"]
    assert (item["device"], item["players"], item["matches"]) == ("iPad A · nino", 3, 2)
    latest = client.get("/api/backups/latest", headers=admin).json["item"]
    assert latest["id"] == item["id"] and latest["data"]["team"]["players"][0]["prenom"] == "J0"
    one = client.get(f"/api/backups/{item['id']}", headers=coach).json["item"]
    assert one["data"] == latest["data"]
    assert client.get("/api/backups/999999", headers=coach).status_code == 404


def test_refuse_autre_chose(client, admin):
    assert client.post("/api/backups", headers=admin, json={"data": {"app": "autre"}}).status_code == 400
    assert client.post("/api/backups", headers=admin, data="pas du json").status_code == 400


def test_garde_les_dernieres(client, admin):
    for i in range(5):
        client.post("/api/backups", headers=admin, json={"device": f"d{i}", "data": bundle()})
    lst = client.get("/api/backups", headers=admin).json
    assert lst["total"] == 3
    assert [x["device"] for x in lst["items"]] == [f"d{i} · {ADMIN}" for i in (4, 3, 2)]


def test_cors(client):
    r = client.options("/api/users/1", headers={"Origin": "https://b2t.onrender.com",
                                                "Access-Control-Request-Method": "PATCH"})
    assert r.status_code == 200
    assert r.headers["Access-Control-Allow-Origin"] == "*"
    assert "Authorization" in r.headers["Access-Control-Allow-Headers"]
    assert "PATCH" in r.headers["Access-Control-Allow-Methods"] and "DELETE" in r.headers["Access-Control-Allow-Methods"]
