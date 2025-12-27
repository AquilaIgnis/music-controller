# Build frontend
FROM node:18-alpine AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Build backend
FROM python:3.13-alpine

RUN apk add --no-cache --virtual .build-deps build-base libffi-dev openssl-dev python3-dev
RUN apk add --no-cache nginx
RUN pip install uv

WORKDIR /app

COPY uv.lock pyproject.toml ./
RUN uv sync --frozen --no-cache && apk del .build-deps

# Copy backend files
COPY api/ api/
COPY musicController/ musicController/
COPY spotify/ spotify/
COPY manage.py ./
COPY db.sqlite3 ./

# Copy built frontend from first stage
COPY --from=frontend /app/dist /usr/share/nginx/html

# Create nginx config (overwrite the default)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 8000

# Start both services
CMD nginx && uv run uvicorn musicController.asgi:application --host 0.0.0.0 --port 8000
