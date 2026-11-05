"""API Banc2Touche : sauvegardes de l'effectif et des matchs dans PostgreSQL.

Routes publiques : /, /health, /info, /env
Routes protégées (en-tête « Authorization: Bearer <code d'accès> ») :
  GET  /api/backups          liste des dernières sauvegardes (sans le contenu)
  GET  /api/backups/latest   dernière sauvegarde complète
  GET  /api/backups/<id>     une sauvegarde complète
  POST /api/backups          enregistre une sauvegarde {"device": "...", "data": {...}}
"""
import hmac
import json
import os
import time
from datetime import datetime, timezone

from flask import Flask, abort, jsonify, request
from sqlalchemy import (Column, DateTime, Integer, MetaData, String, Table, Text,
                        create_engine, func, insert, select, text)

APP_VERSION = os.getenv("APP_VERSION", "dev")
KEEP = int(os.getenv("BACKUPS_KEEP", "50"))

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


def database_url():
    url = os.getenv("DATABASE_URL", "sqlite:///banc2touche.db")
    # Render donne « postgres:// » ou « postgresql:// » : SQLAlchemy veut le pilote psycopg 3
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
    app.json.ensure_ascii = False
    app.json.sort_keys = False  # rendre les fiches telles quelles : l'appli compare les fiches champ par champ
    engine = create_engine(database_url(), pool_pre_ping=True)
    metadata.create_all(engine)
    app.config["ENGINE"] = engine

    # ---------- CORS : le front React est sur un autre domaine (Static Site Render) ----------
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
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Max-Age"] = "3600"
        return resp

    @app.before_request
    def preflight():
        if request.method == "OPTIONS":
            return app.make_default_options_response()

    # ---------- Accès : un code d'équipe, jamais stocké dans le dépôt ----------
    def require_code():
        code = os.getenv("ACCESS_CODE", "")
        if not code:
            abort(503, "Code d'accès non configuré sur le serveur")
        sent = request.headers.get("Authorization", "")
        sent = sent[7:] if sent.startswith("Bearer ") else ""
        if not hmac.compare_digest(sent.encode(), code.encode()):
            time.sleep(0.5)  # freine les essais au hasard
            abort(401, "Code d'accès incorrect")

    @app.errorhandler(400)
    @app.errorhandler(401)
    @app.errorhandler(404)
    @app.errorhandler(413)
    @app.errorhandler(503)
    def http_error(e):
        return jsonify(error=e.description if isinstance(e.description, str) else str(e)), e.code

    # ---------- Routes publiques ----------
    @app.route("/")
    def home():
        return jsonify(app="Banc2Touche API", version=APP_VERSION,
                       routes=["/health", "/info", "/env", "/api/backups"])

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

    # ---------- Sauvegardes ----------
    def summary(row):
        return {"id": row.id, "created_at": row.created_at.astimezone(timezone.utc).isoformat()
                if row.created_at.tzinfo else row.created_at.replace(tzinfo=timezone.utc).isoformat(),
                "device": row.device, "players": row.players, "matches": row.matches}

    def full(row):
        out = summary(row)
        out["data"] = json.loads(row.data)
        return out

    cols = [backups.c.id, backups.c.created_at, backups.c.device, backups.c.players, backups.c.matches]

    @app.get("/api/backups")
    def list_backups():
        require_code()
        limit = max(1, min(int(request.args.get("limit", 20)), 100))
        with engine.connect() as c:
            rows = c.execute(select(*cols).order_by(backups.c.id.desc()).limit(limit)).all()
            total = c.execute(select(func.count()).select_from(backups)).scalar_one()
        return jsonify(items=[summary(r) for r in rows], total=total)

    @app.get("/api/backups/latest")
    def latest_backup():
        require_code()
        with engine.connect() as c:
            row = c.execute(select(backups).order_by(backups.c.id.desc()).limit(1)).first()
        if not row:
            return jsonify(item=None)
        return jsonify(item=full(row))

    @app.get("/api/backups/<int:bid>")
    def get_backup(bid):
        require_code()
        with engine.connect() as c:
            row = c.execute(select(backups).where(backups.c.id == bid)).first()
        if not row:
            abort(404, "Sauvegarde introuvable")
        return jsonify(item=full(row))

    @app.post("/api/backups")
    def save_backup():
        require_code()
        body = request.get_json(silent=True) or {}
        data = body.get("data")
        if not isinstance(data, dict) or data.get("app") != "banc2touche":
            abort(400, "Ce n'est pas une sauvegarde Banc2Touche")
        team = data.get("team") or {}
        matches = data.get("matches") or []
        if not isinstance(matches, list) or (team and not isinstance(team.get("players"), list)):
            abort(400, "Sauvegarde mal formée")
        device = str(body.get("device") or data.get("exportedBy") or "")[:80]
        row = {"created_at": datetime.now(timezone.utc), "device": device,
               "players": len(team.get("players") or []) if team else 0,
               "matches": len(matches), "data": json.dumps(data, ensure_ascii=False)}
        with engine.begin() as c:
            bid = c.execute(insert(backups).values(**row).returning(backups.c.id)).scalar_one()
            # on garde les KEEP dernières versions
            old = c.execute(select(backups.c.id).order_by(backups.c.id.desc()).offset(KEEP)).scalars().all()
            if old:
                c.execute(backups.delete().where(backups.c.id.in_(old)))
        row["id"] = bid
        return jsonify(item={"id": bid, "created_at": row["created_at"].isoformat(), "device": device,
                             "players": row["players"], "matches": row["matches"]}), 201

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
