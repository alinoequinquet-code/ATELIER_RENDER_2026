"""Tests de l'API Banc2Touche.

Par défaut sur SQLite ; avec TEST_DATABASE_URL=postgresql://... ils tournent sur PostgreSQL
(c'est ce que fait le workflow GitHub Actions avec un service PostgreSQL).
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
CODE = "code-de-test"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    url = os.getenv("TEST_DATABASE_URL") or f"sqlite:///{tmp_path}/test.db"
    monkeypatch.setenv("DATABASE_URL", url)
    monkeypatch.setenv("ACCESS_CODE", CODE)
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("BACKUPS_KEEP", "3")
    import app as appmod
    monkeypatch.setattr(appmod, "KEEP", 3)
    application = appmod.create_app()
    with application.config["ENGINE"].begin() as c:
        c.execute(appmod.backups.delete())
    return application.test_client()


AUTH = {"Authorization": f"Bearer {CODE}"}


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


def test_code_obligatoire(client):
    assert client.get("/api/backups").status_code == 401
    assert client.get("/api/backups", headers={"Authorization": "Bearer faux"}).status_code == 401
    assert client.post("/api/backups", json={"data": bundle()}).status_code == 401


def test_sans_code_configure(client, monkeypatch):
    monkeypatch.setenv("ACCESS_CODE", "")
    r = client.get("/api/backups", headers=AUTH)
    assert r.status_code == 503


def test_aller_retour(client):
    assert client.get("/api/backups/latest", headers=AUTH).json == {"item": None}
    r = client.post("/api/backups", headers=AUTH, json={"device": "iPad A", "data": bundle(3, 2)})
    assert r.status_code == 201
    item = r.json["item"]
    assert (item["device"], item["players"], item["matches"]) == ("iPad A", 3, 2)
    latest = client.get("/api/backups/latest", headers=AUTH).json["item"]
    assert latest["id"] == item["id"] and latest["data"]["team"]["players"][0]["prenom"] == "J0"
    one = client.get(f"/api/backups/{item['id']}", headers=AUTH).json["item"]
    assert one["data"] == latest["data"]
    assert client.get("/api/backups/999999", headers=AUTH).status_code == 404


def test_refuse_autre_chose(client):
    assert client.post("/api/backups", headers=AUTH, json={"data": {"app": "autre"}}).status_code == 400
    assert client.post("/api/backups", headers=AUTH, data="pas du json").status_code == 400


def test_garde_les_dernieres(client):
    for i in range(5):
        client.post("/api/backups", headers=AUTH, json={"device": f"d{i}", "data": bundle()})
    lst = client.get("/api/backups", headers=AUTH).json
    assert lst["total"] == 3
    assert [x["device"] for x in lst["items"]] == ["d4", "d3", "d2"]


def test_cors(client):
    r = client.options("/api/backups", headers={"Origin": "https://b2t.onrender.com",
                                                "Access-Control-Request-Method": "POST"})
    assert r.status_code == 200
    assert r.headers["Access-Control-Allow-Origin"] == "*"
    assert "Authorization" in r.headers["Access-Control-Allow-Headers"]
