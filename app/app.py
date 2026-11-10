"""API Banc2Touche : comptes, et sauvegardes de l'effectif et des matchs dans PostgreSQL.

Routes publiques : /, /health, /info, /env
Connexion :
  POST /api/auth/login       {"username", "password", "device"} → jeton de session
  GET  /api/auth/me          le compte connecté
  POST /api/auth/logout      ferme la session
  POST /api/auth/password    {"current", "new"} change son propre mot de passe
Comptes, réservé au responsable (le seul compte « admin », défini par ADMIN_USERNAME et ADMIN_PASSWORD) :
  GET    /api/users          liste des comptes
  POST   /api/users          crée un compte {"username", "name", "password"}
  PATCH  /api/users/<id>     modifie {"username", "name", "password", "active"}
  DELETE /api/users/<id>     supprime un compte
  GET    /api/admin/export   fichier de transfert : comptes, sessions et dernières sauvegardes
  POST   /api/admin/import   remet ce fichier dans la base (pour changer de base de données)
Sauvegardes, pour tout compte connecté (en-tête « Authorization: Bearer <jeton> ») :
  GET  /api/backups          liste des dernières sauvegardes (sans le contenu)
  GET  /api/backups/latest   dernière sauvegarde complète
  GET  /api/backups/<id>     une sauvegarde complète
  POST /api/backups          enregistre une sauvegarde {"device": "...", "data": {...}}
"""
import hashlib
import json
import os
import re
import secrets
import sys
import time
from datetime import datetime, timedelta, timezone

from flask import Flask, abort, g, jsonify, request
from sqlalchemy import (Boolean, Column, DateTime, Integer, MetaData, String, Table, Text,
                        create_engine, delete, func, insert, select, text, update)
from sqlalchemy.exc import IntegrityError, ProgrammingError
from werkzeug.security import check_password_hash, generate_password_hash

APP_VERSION = os.getenv("APP_VERSION", "dev")
EXPORT_KIND = "banc2touche-serveur"
EXPORT_BACKUPS = 5  # les iPad gardent la version complète : les dernières sauvegardes suffisent
IMPORT_MAX = 32 * 1024 * 1024
KEEP = int(os.getenv("BACKUPS_KEEP", "50"))
SESSION_DAYS = int(os.getenv("SESSION_DAYS", "90"))  # une session inutilisée pendant ce délai expire
MAX_FAILS = 5  # essais ratés de suite avant de faire patienter
USERNAME_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{2,39}$")
PASSWORD_MIN, PASSWORD_MAX = 8, 200
# Sert à faire le même calcul quand l'identifiant n'existe pas : le temps de réponse ne dit rien
DUMMY_HASH = generate_password_hash(secrets.token_urlsafe(16))

metadata = MetaData()
backups = Table(
    "backups", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("device", String(80), nullable=False, default=""),
    Column("players", Integer, nullable=False, default=0),
    Column("matches", Integer, nullable=False, default=0),
    Column("data", Text, nullable=False),
)
users = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String(40), nullable=False, unique=True),
    Column("name", String(80), nullable=False, default=""),
    Column("password_hash", String(255), nullable=False),  # jamais le mot de passe lui-même
    Column("role", String(10), nullable=False, default="coach"),  # « admin » (le responsable) ou « coach »
    Column("active", Boolean, nullable=False, default=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("last_login_at", DateTime(timezone=True)),
    # Responsable : empreinte du mot de passe de secours (ADMIN_PASSWORD) appliqué en dernier
    Column("seed_hash", String(255)),
)
sessions = Table(
    "sessions", metadata,
    Column("token_hash", String(64), primary_key=True),  # empreinte du jeton, pas le jeton
    Column("user_id", Integer, nullable=False, index=True),
    Column("device", String(80), nullable=False, default=""),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("last_seen_at", DateTime(timezone=True), nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
)
login_throttle = Table(
    "login_throttle", metadata,
    Column("username", String(40), primary_key=True),
    Column("fails", Integer, nullable=False, default=0),
    Column("locked_until", DateTime(timezone=True)),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)


def database_url():
    url = os.getenv("DATABASE_URL", "sqlite:///banc2touche.db")
    # Render donne « postgres:// » ou « postgresql:// » : SQLAlchemy veut le pilote psycopg 3
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def now():
    return datetime.now(timezone.utc)


def aware(dt):
    """SQLite rend des dates sans fuseau : elles sont toutes en UTC."""
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def iso(dt):
    return aware(dt).astimezone(timezone.utc).isoformat() if dt else None


def clean_username(value):
    return str(value or "").strip().lower()


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def ensure_admin(engine):
    """Le compte du responsable vient des variables ADMIN_USERNAME et ADMIN_PASSWORD (secrets GitHub).

    Il est créé au premier démarrage. Ensuite, changer ADMIN_PASSWORD remet ce mot de passe sur le
    compte et ferme ses sessions : c'est la porte de secours si le mot de passe est oublié.
    Tant que le secret ne change pas, le mot de passe choisi dans l'appli est conservé.
    """
    username = clean_username(os.getenv("ADMIN_USERNAME"))
    password = os.getenv("ADMIN_PASSWORD", "")
    if not username or not password:
        print("Banc2Touche : ADMIN_USERNAME ou ADMIN_PASSWORD manquant, compte responsable non configuré", file=sys.stderr)
        return False
    if not USERNAME_RE.match(username) or not PASSWORD_MIN <= len(password) <= PASSWORD_MAX:
        print("Banc2Touche : ADMIN_USERNAME (3 à 40 lettres ou chiffres) ou ADMIN_PASSWORD (8 caractères minimum) refusé",
              file=sys.stderr)
        return False
    try:
        with engine.begin() as c:
            admin = c.execute(select(users).where(users.c.role == "admin").order_by(users.c.id)).first()
            same_name = c.execute(select(users).where(users.c.username == username)).first()
            if admin is None:
                h = generate_password_hash(password)
                if same_name:  # un compte porte déjà cet identifiant : il devient le compte du responsable
                    c.execute(update(users).where(users.c.id == same_name.id).values(
                        role="admin", active=True, password_hash=h, seed_hash=h))
                    c.execute(delete(sessions).where(sessions.c.user_id == same_name.id))
                else:
                    c.execute(insert(users).values(username=username, name="Responsable", password_hash=h, seed_hash=h,
                                                   role="admin", active=True, created_at=now()))
                return True
            values = {}
            if admin.username != username:
                if same_name:
                    print(f"Banc2Touche : l'identifiant « {username} » est déjà pris, le responsable garde « {admin.username} »",
                          file=sys.stderr)
                else:
                    values["username"] = username
            if not admin.active:
                values["active"] = True
            if not admin.seed_hash or not check_password_hash(admin.seed_hash, password):
                h = generate_password_hash(password)
                values.update(password_hash=h, seed_hash=h)
                c.execute(delete(sessions).where(sessions.c.user_id == admin.id))
            if values:
                c.execute(update(users).where(users.c.id == admin.id).values(**values))
    except IntegrityError:
        pass  # un autre processus du serveur vient de créer le compte
    return True


def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
    app.json.ensure_ascii = False
    app.json.sort_keys = False  # rendre les fiches telles quelles : l'appli compare les fiches champ par champ
    engine = create_engine(database_url(), pool_pre_ping=True)
    try:
        metadata.create_all(engine)
    except (IntegrityError, ProgrammingError):
        # premier démarrage : l'autre processus du serveur crée les tables au même moment
        time.sleep(1)
        metadata.create_all(engine)
    ensure_admin(engine)
    app.config["ENGINE"] = engine

    # ---------- CORS : le front est sur un autre domaine (Static Site Render, GitHub Pages) ----------
    allowed = [o.strip().rstrip("/") for o in os.getenv("FRONTEND_ORIGIN", "*").split(",") if o.strip()]

    @app.after_request
    def cors(resp):
        origin = (request.headers.get("Origin") or "").rstrip("/")
        if "*" in allowed:
            resp.headers["Access-Control-Allow-Origin"] = "*"
        elif origin in allowed:
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Vary"] = "Origin"
        resp.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        resp.headers["Access-Control-Max-Age"] = "3600"
        if request.path.startswith("/api/"):
            resp.headers["Cache-Control"] = "no-store"
        return resp

    @app.before_request
    def preflight():
        if request.method == "OPTIONS":
            return app.make_default_options_response()

    @app.before_request
    def bigger_import():
        if request.path == "/api/admin/import":
            request.max_content_length = IMPORT_MAX

    @app.errorhandler(400)
    @app.errorhandler(401)
    @app.errorhandler(403)
    @app.errorhandler(404)
    @app.errorhandler(405)
    @app.errorhandler(409)
    @app.errorhandler(413)
    @app.errorhandler(429)
    @app.errorhandler(503)
    def http_error(e):
        return jsonify(error=e.description if isinstance(e.description, str) else str(e)), e.code

    # ---------- Accès : un compte par personne, créé par le responsable ----------
    def public_user(row):
        return {"id": row.id, "username": row.username, "name": row.name, "role": row.role}

    def require_user(admin=False):
        sent = request.headers.get("Authorization", "")
        token = sent[7:].strip() if sent.startswith("Bearer ") else ""
        if not token:
            abort(401, "Connexion requise")
        th = token_hash(token)
        t = now()
        with engine.begin() as c:
            row = c.execute(
                select(users, sessions.c.last_seen_at, sessions.c.expires_at)
                .join(sessions, sessions.c.user_id == users.c.id)
                .where(sessions.c.token_hash == th)).first()
            if not row or aware(row.expires_at) <= t or not row.active:
                abort(401, "Session fermée : reconnecte-toi")
            if t - aware(row.last_seen_at) > timedelta(hours=1):  # une écriture par heure au plus
                c.execute(update(sessions).where(sessions.c.token_hash == th)
                          .values(last_seen_at=t, expires_at=t + timedelta(days=SESSION_DAYS)))
        if admin and row.role != "admin":
            abort(403, "Réservé au responsable")
        g.user, g.token_hash = row, th
        return row

    def body_json():
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            abort(400, "Demande mal formée")
        return body

    def check_username(value):
        username = clean_username(value)
        if not USERNAME_RE.match(username):
            abort(400, "Identifiant : 3 à 40 caractères, lettres sans accent, chiffres, point ou tiret")
        return username

    def check_password(value):
        if not isinstance(value, str) or not PASSWORD_MIN <= len(value) <= PASSWORD_MAX:
            abort(400, f"Mot de passe : {PASSWORD_MIN} caractères au minimum")
        return value

    # ---------- Routes publiques ----------
    @app.route("/")
    def home():
        return jsonify(app="Banc2Touche API", version=APP_VERSION,
                       routes=["/health", "/info", "/env", "/api/auth/login", "/api/users", "/api/backups"])

    @app.route("/health")
    def health():
        # Toujours 200 : Render s'en sert pour savoir si le service tourne ; l'état de la base est indiqué à part
        try:
            with engine.connect() as c:
                c.execute(text("SELECT 1"))
            return jsonify(status="ok", db="ok")
        except Exception:
            return jsonify(status="degraded", db="error")

    @app.route("/info")
    def info():
        return jsonify(app="Banc2Touche API", student=os.getenv("STUDENT", "Alinoé Quinquet"), version=APP_VERSION)

    @app.route("/env")
    def env():
        return jsonify(env=os.getenv("ENV"))

    # ---------- Connexion ----------
    @app.post("/api/auth/login")
    def login():
        body = body_json()
        username = clean_username(body.get("username"))[:40]
        password = body.get("password")
        if not username or not isinstance(password, str) or not password:
            abort(400, "Identifiant et mot de passe obligatoires")
        t = now()
        with engine.begin() as c:
            if not c.execute(select(func.count()).select_from(users)).scalar_one():
                abort(503, "Aucun compte sur le serveur : le compte du responsable n'est pas configuré")
            wait = c.execute(select(login_throttle).where(login_throttle.c.username == username)).first()
            if wait and wait.locked_until and aware(wait.locked_until) > t:
                left = int((aware(wait.locked_until) - t).total_seconds())
                abort(429, f"Trop d'essais. Réessaie dans {left // 60 + 1} min.")
            row = c.execute(select(users).where(users.c.username == username)).first()
            good = check_password_hash(row.password_hash if row else DUMMY_HASH, password[:PASSWORD_MAX])
            if not (row and good and row.active):
                # même réponse que le compte existe ou non ; l'attente s'allonge après plusieurs essais ratés
                try:
                    with c.begin_nested():
                        c.execute(insert(login_throttle).values(username=username, fails=0, updated_at=t))
                except IntegrityError:
                    pass  # déjà des essais ratés pour cet identifiant
                mine = login_throttle.c.username == username
                c.execute(update(login_throttle).where(mine).values(fails=login_throttle.c.fails + 1, updated_at=t))
                fails = c.execute(select(login_throttle.c.fails).where(mine)).scalar_one()
                if fails >= MAX_FAILS:  # 30 s, 1 min, 2 min… jusqu'à 15 min
                    pause = min(900, 30 * 2 ** min(fails - MAX_FAILS, 5))
                    c.execute(update(login_throttle).where(mine).values(locked_until=t + timedelta(seconds=pause)))
                c.execute(delete(login_throttle).where(login_throttle.c.updated_at < t - timedelta(days=1)))
                failed = True
            else:
                failed = False
                token = secrets.token_urlsafe(32)
                c.execute(delete(login_throttle).where(login_throttle.c.username == username))
                c.execute(delete(sessions).where(sessions.c.expires_at < t))
                c.execute(insert(sessions).values(
                    token_hash=token_hash(token), user_id=row.id, device=str(body.get("device") or "")[:80],
                    created_at=t, last_seen_at=t, expires_at=t + timedelta(days=SESSION_DAYS)))
                c.execute(update(users).where(users.c.id == row.id).values(last_login_at=t))
        if failed:
            time.sleep(0.5)  # freine les essais au hasard
            abort(401, "Identifiant ou mot de passe incorrect")
        return jsonify(token=token, user=public_user(row))

    @app.get("/api/auth/me")
    def me():
        return jsonify(user=public_user(require_user()))

    @app.post("/api/auth/logout")
    def logout():
        require_user()
        with engine.begin() as c:
            c.execute(delete(sessions).where(sessions.c.token_hash == g.token_hash))
        return jsonify(ok=True)

    @app.post("/api/auth/password")
    def change_password():
        user = require_user()
        body = body_json()
        if not check_password_hash(user.password_hash, str(body.get("current") or "")[:PASSWORD_MAX]):
            time.sleep(0.5)
            abort(400, "Mot de passe actuel incorrect")
        new = check_password(body.get("new"))
        with engine.begin() as c:
            c.execute(update(users).where(users.c.id == user.id).values(password_hash=generate_password_hash(new)))
            # les autres appareils de ce compte devront se reconnecter
            c.execute(delete(sessions).where(sessions.c.user_id == user.id, sessions.c.token_hash != g.token_hash))
        return jsonify(ok=True)

    # ---------- Comptes : le responsable seulement ----------
    def account(row, live=0):
        return {"id": row.id, "username": row.username, "name": row.name, "role": row.role, "active": bool(row.active),
                "created_at": iso(row.created_at), "last_login_at": iso(row.last_login_at), "sessions": live}

    @app.get("/api/users")
    def list_users():
        require_user(admin=True)
        with engine.connect() as c:
            rows = c.execute(select(users).order_by(users.c.role, users.c.username)).all()
            live = dict(c.execute(select(sessions.c.user_id, func.count()).where(sessions.c.expires_at > now())
                                  .group_by(sessions.c.user_id)).all())
        return jsonify(items=[account(r, live.get(r.id, 0)) for r in rows])

    @app.post("/api/users")
    def create_user():
        require_user(admin=True)
        body = body_json()
        values = {"username": check_username(body.get("username")), "name": str(body.get("name") or "").strip()[:80],
                  "password_hash": generate_password_hash(check_password(body.get("password"))),
                  "role": "coach", "active": True, "created_at": now()}  # jamais un second responsable
        try:
            with engine.begin() as c:
                uid = c.execute(insert(users).values(**values).returning(users.c.id)).scalar_one()
                row = c.execute(select(users).where(users.c.id == uid)).first()
        except IntegrityError:
            abort(409, "Cet identifiant est déjà pris")
        return jsonify(item=account(row)), 201

    @app.patch("/api/users/<int:uid>")
    def update_user(uid):
        require_user(admin=True)
        body = body_json()
        with engine.connect() as c:
            row = c.execute(select(users).where(users.c.id == uid)).first()
        if not row:
            abort(404, "Compte introuvable")
        values = {}
        if "name" in body:
            values["name"] = str(body.get("name") or "").strip()[:80]
        if row.role == "admin":
            # identifiant et mot de passe du responsable : secrets GitHub ou « Changer mon mot de passe »
            if any(k in body for k in ("username", "password", "active")):
                abort(400, "Le compte du responsable ne se modifie pas ici")
        else:
            if "username" in body:
                values["username"] = check_username(body.get("username"))
            if "password" in body:
                values["password_hash"] = generate_password_hash(check_password(body.get("password")))
            if "active" in body:
                values["active"] = bool(body.get("active"))
        if not values:
            abort(400, "Rien à modifier")
        try:
            with engine.begin() as c:
                c.execute(update(users).where(users.c.id == uid).values(**values))
                if "password_hash" in values or values.get("active") is False:
                    c.execute(delete(sessions).where(sessions.c.user_id == uid))  # déconnecte ses appareils
                    c.execute(delete(login_throttle).where(login_throttle.c.username == row.username))
                row = c.execute(select(users).where(users.c.id == uid)).first()
                live = c.execute(select(func.count()).select_from(sessions)
                                 .where(sessions.c.user_id == uid, sessions.c.expires_at > now())).scalar_one()
        except IntegrityError:
            abort(409, "Cet identifiant est déjà pris")
        return jsonify(item=account(row, live))

    @app.delete("/api/users/<int:uid>")
    def delete_user(uid):
        require_user(admin=True)
        with engine.begin() as c:
            row = c.execute(select(users).where(users.c.id == uid)).first()
            if not row:
                abort(404, "Compte introuvable")
            if row.role == "admin":
                abort(400, "Le compte du responsable ne peut pas être supprimé")
            c.execute(delete(sessions).where(sessions.c.user_id == uid))
            c.execute(delete(users).where(users.c.id == uid))
        return jsonify(ok=True)

    # ---------- Sauvegardes ----------
    def summary(row):
        return {"id": row.id, "created_at": iso(row.created_at),
                "device": row.device, "players": row.players, "matches": row.matches}

    def full(row):
        out = summary(row)
        out["data"] = json.loads(row.data)
        return out

    cols = [backups.c.id, backups.c.created_at, backups.c.device, backups.c.players, backups.c.matches]
    newest = (backups.c.created_at.desc(), backups.c.id.desc())  # une sauvegarde importée garde sa date

    @app.get("/api/backups")
    def list_backups():
        require_user()
        try:
            limit = max(1, min(int(request.args.get("limit", 20)), 100))
        except ValueError:
            limit = 20
        with engine.connect() as c:
            rows = c.execute(select(*cols).order_by(*newest).limit(limit)).all()
            total = c.execute(select(func.count()).select_from(backups)).scalar_one()
        return jsonify(items=[summary(r) for r in rows], total=total)

    @app.get("/api/backups/latest")
    def latest_backup():
        require_user()
        with engine.connect() as c:
            row = c.execute(select(backups).order_by(*newest).limit(1)).first()
        if not row:
            return jsonify(item=None)
        return jsonify(item=full(row))

    @app.get("/api/backups/<int:bid>")
    def get_backup(bid):
        require_user()
        with engine.connect() as c:
            row = c.execute(select(backups).where(backups.c.id == bid)).first()
        if not row:
            abort(404, "Sauvegarde introuvable")
        return jsonify(item=full(row))

    @app.post("/api/backups")
    def save_backup():
        user = require_user()
        body = request.get_json(silent=True) or {}
        data = body.get("data")
        if not isinstance(data, dict) or data.get("app") != "banc2touche":
            abort(400, "Ce n'est pas une sauvegarde Banc2Touche")
        team = data.get("team") or {}
        matches = data.get("matches") or []
        if not isinstance(matches, list) or (team and not isinstance(team.get("players"), list)):
            abort(400, "Sauvegarde mal formée")
        # on garde qui a envoyé : « iPad de Nino · nino »
        device = f"{str(body.get('device') or data.get('exportedBy') or 'Appareil sans nom')[:60]} · {user.username}"[:80]
        row = {"created_at": now(), "device": device,
               "players": len(team.get("players") or []) if team else 0,
               "matches": len(matches), "data": json.dumps(data, ensure_ascii=False)}
        with engine.begin() as c:
            bid = c.execute(insert(backups).values(**row).returning(backups.c.id)).scalar_one()
            # on garde les KEEP dernières versions
            old = c.execute(select(backups.c.id).order_by(*newest).offset(KEEP)).scalars().all()
            if old:
                c.execute(backups.delete().where(backups.c.id.in_(old)))
        row["id"] = bid
        return jsonify(item={"id": bid, "created_at": row["created_at"].isoformat(), "device": device,
                             "players": row["players"], "matches": row["matches"]}), 201

    # ---------- Changer de base de données : export puis import, le responsable seulement ----------
    @app.get("/api/admin/export")
    def export_all():
        require_user(admin=True)
        t = now()
        with engine.connect() as c:
            rows = c.execute(select(users).order_by(users.c.id)).all()
            names = {r.id: r.username for r in rows}
            live = c.execute(select(sessions).where(sessions.c.expires_at > t)).all()
            saved = c.execute(select(backups).order_by(*newest).limit(EXPORT_BACKUPS)).all()
        out = {
            "kind": EXPORT_KIND, "version": 1, "exported_at": iso(t),
            # empreintes des mots de passe et des jetons seulement : rien n'est en clair
            "users": [{"username": r.username, "name": r.name, "password_hash": r.password_hash, "role": r.role,
                       "active": bool(r.active), "created_at": iso(r.created_at),
                       "last_login_at": iso(r.last_login_at)} for r in rows],
            # les appareils restent connectés après le changement de base
            "sessions": [{"token_hash": x.token_hash, "username": names[x.user_id], "device": x.device,
                          "created_at": iso(x.created_at), "last_seen_at": iso(x.last_seen_at),
                          "expires_at": iso(x.expires_at)} for x in live if x.user_id in names],
            "backups": [{"created_at": iso(b.created_at), "device": b.device, "players": b.players,
                         "matches": b.matches, "data": json.loads(b.data)} for b in reversed(saved)],
        }
        resp = jsonify(out)
        resp.headers["Content-Disposition"] = f'attachment; filename="banc2touche-serveur-{t:%Y-%m-%d}.json"'
        return resp

    def parse_date(value, fallback=None):
        try:
            return aware(datetime.fromisoformat(str(value)))
        except (TypeError, ValueError):
            return fallback

    @app.post("/api/admin/import")
    def import_all():
        me = require_user(admin=True)
        body = body_json()
        if body.get("kind") != EXPORT_KIND or body.get("version") != 1:
            abort(400, "Ce n'est pas un fichier de transfert du serveur Banc2Touche")
        items = [body.get(k) for k in ("users", "sessions", "backups")]
        if not all(isinstance(x, list) and all(isinstance(y, dict) for y in x) for x in items):
            abort(400, "Fichier de transfert mal formé")
        in_users, in_sessions, in_backups = items
        t = now()
        done = {"users_added": 0, "users_updated": 0, "sessions": 0, "backups": 0}
        with engine.begin() as c:
            ids = {}
            for u in in_users:
                h = u.get("password_hash")
                if not isinstance(h, str) or not h or len(h) > 255:
                    abort(400, "Fichier de transfert mal formé : mot de passe manquant")
                if u.get("role") == "admin":
                    # le responsable de cette base reste celui des secrets : il reprend son nom et son mot de passe
                    c.execute(update(users).where(users.c.id == me.id).values(
                        name=str(u.get("name") or "")[:80], password_hash=h))
                    ids[clean_username(u.get("username"))] = me.id
                    continue
                username = clean_username(u.get("username"))
                if not USERNAME_RE.match(username):
                    abort(400, f"Fichier de transfert mal formé : identifiant « {username[:40]} »")
                values = {"name": str(u.get("name") or "")[:80], "password_hash": h, "active": bool(u.get("active", True)),
                          "last_login_at": parse_date(u.get("last_login_at"))}
                old = c.execute(select(users).where(users.c.username == username)).first()
                if old and old.role == "admin":
                    continue  # identifiant pris par le responsable de cette base
                if old:
                    c.execute(update(users).where(users.c.id == old.id).values(**values))
                    ids[username] = old.id
                    done["users_updated"] += 1
                else:
                    ids[username] = c.execute(insert(users).values(
                        username=username, role="coach", created_at=parse_date(u.get("created_at"), t), **values)
                        .returning(users.c.id)).scalar_one()
                    done["users_added"] += 1
            known = set(c.execute(select(sessions.c.token_hash)).scalars().all())
            for x in in_sessions:
                th, uid = str(x.get("token_hash") or ""), ids.get(clean_username(x.get("username")))
                expires = parse_date(x.get("expires_at"))
                if not uid or not re.fullmatch(r"[0-9a-f]{64}", th) or th in known or not expires or expires <= t:
                    continue
                c.execute(insert(sessions).values(
                    token_hash=th, user_id=uid, device=str(x.get("device") or "")[:80],
                    created_at=parse_date(x.get("created_at"), t), last_seen_at=parse_date(x.get("last_seen_at"), t),
                    expires_at=expires))
                known.add(th)
                done["sessions"] += 1
            seen = {(iso(r.created_at), r.device) for r in c.execute(select(backups.c.created_at, backups.c.device)).all()}
            added = []
            for b in sorted(in_backups, key=lambda b: str(b.get("created_at") or "")):
                data, created = b.get("data"), parse_date(b.get("created_at"))
                if not isinstance(data, dict) or data.get("app") != "banc2touche" or not created:
                    continue
                device = str(b.get("device") or "")[:80]
                if (iso(created), device) in seen:
                    continue
                added.append(c.execute(insert(backups).values(
                    created_at=created, device=device, players=int(b.get("players") or 0),
                    matches=int(b.get("matches") or 0), data=json.dumps(data, ensure_ascii=False))
                    .returning(backups.c.id)).scalar_one())
                seen.add((iso(created), device))
            old = set(c.execute(select(backups.c.id).order_by(*newest).offset(KEEP)).scalars().all())
            if old:
                c.execute(backups.delete().where(backups.c.id.in_(old)))
            done["backups"] = len([i for i in added if i not in old])  # trop anciennes : tout de suite retirées
        return jsonify(ok=True, **done)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
