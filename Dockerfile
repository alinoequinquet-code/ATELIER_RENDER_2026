FROM python:3.12-slim

LABEL org.opencontainers.image.source="https://github.com/alinoequinquet-code/ATELIER_RENDER_2026" \
      org.opencontainers.image.description="API Banc2Touche (Flask + PostgreSQL)"

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

WORKDIR /app

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ .
RUN useradd --create-home b2t && chown -R b2t /app
USER b2t

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 2 --timeout 60 --access-logfile - app:app"]
