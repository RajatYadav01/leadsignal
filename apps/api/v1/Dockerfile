FROM python:3.14-slim

# Copy the official uv binary directly from its distribution image (fastest method)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Compiles Python bytecode (.pyc) automatically for faster container startup
    UV_COMPILE_BYTECODE=1 \
    # Prevents uv from looking for or updating global systems or virtualenvs tracking
    UV_SYSTEM_PYTHON=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Leverage Docker cache by mounting the uv cache directory locally
COPY apps/api/requirements.txt .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -r requirements.txt

COPY apps/api .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000