FROM node:22.12.0-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG ci_build
ARG VITE_BLOCKS_API_URL
ARG VITE_API_BASE_URL
ARG VITE_DATA_GATEWAY_URL
ARG VITE_GRAPHQL_ENDPOINT
ARG VITE_X_BLOCKS_KEY
ARG X_BLOCKS_KEY
ARG SELISE_X_BLOCKS_KEY
ARG VITE_SELISE_BLOCKS_KEY
ARG SELISE_BLOCKS_KEY
ARG VITE_SELISE_PROJECT_KEY
ARG SELISE_PROJECT_KEY
ARG PROJECT_KEY
ARG BLOCKS_KEY
ARG VITE_CAPTCHA_SITE_KEY
ARG VITE_CAPTCHA_TYPE
ARG VITE_PROJECT_SLUG
ARG PROJECT_SLUG
ARG VITE_SELISE_APP_DOMAIN
ARG SELISE_APP_DOMAIN
ARG APP_DOMAIN

ENV VITE_BLOCKS_API_URL=${VITE_BLOCKS_API_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_DATA_GATEWAY_URL=${VITE_DATA_GATEWAY_URL}
ENV VITE_GRAPHQL_ENDPOINT=${VITE_GRAPHQL_ENDPOINT}
ENV VITE_X_BLOCKS_KEY=${VITE_X_BLOCKS_KEY}
ENV X_BLOCKS_KEY=${X_BLOCKS_KEY}
ENV SELISE_X_BLOCKS_KEY=${SELISE_X_BLOCKS_KEY}
ENV VITE_SELISE_BLOCKS_KEY=${VITE_SELISE_BLOCKS_KEY}
ENV SELISE_BLOCKS_KEY=${SELISE_BLOCKS_KEY}
ENV VITE_SELISE_PROJECT_KEY=${VITE_SELISE_PROJECT_KEY}
ENV SELISE_PROJECT_KEY=${SELISE_PROJECT_KEY}
ENV PROJECT_KEY=${PROJECT_KEY}
ENV BLOCKS_KEY=${BLOCKS_KEY}
ENV VITE_CAPTCHA_SITE_KEY=${VITE_CAPTCHA_SITE_KEY}
ENV VITE_CAPTCHA_TYPE=${VITE_CAPTCHA_TYPE}
ENV VITE_PROJECT_SLUG=${VITE_PROJECT_SLUG}
ENV PROJECT_SLUG=${PROJECT_SLUG}
ENV VITE_SELISE_APP_DOMAIN=${VITE_SELISE_APP_DOMAIN}
ENV SELISE_APP_DOMAIN=${SELISE_APP_DOMAIN}
ENV APP_DOMAIN=${APP_DOMAIN}

RUN mkdir -p /app/log

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build:${ci_build}

FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN cat > /docker-entrypoint.d/10-vibebuilder-runtime-config.sh <<'EOF'
#!/bin/sh
set -eu

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

write_var() {
  name="$1"
  value="${2:-}"
  [ -n "$value" ] || return 0
  printf '  "%s": "%s",\n' "$name" "$(json_escape "$value")" >> /usr/share/nginx/html/runtime-config.js
}

raw_key="${VITE_X_BLOCKS_KEY:-${X_BLOCKS_KEY:-${SELISE_X_BLOCKS_KEY:-${VITE_SELISE_BLOCKS_KEY:-${SELISE_BLOCKS_KEY:-${VITE_SELISE_PROJECT_KEY:-${SELISE_PROJECT_KEY:-${PROJECT_KEY:-${BLOCKS_KEY:-}}}}}}}}}"
blocks_key="$(printf '%s' "$raw_key" | sed 's/-X-Blocks-Key$//')"
api_base="${VITE_API_BASE_URL:-${VITE_BLOCKS_API_URL:-/blocks-api}}"

cat > /usr/share/nginx/html/runtime-config.js <<'JS'
window.__VIBEBUILDER_CONFIG__ = {
JS
write_var "VITE_X_BLOCKS_KEY" "$blocks_key"
write_var "VITE_API_BASE_URL" "$api_base"
write_var "VITE_BLOCKS_API_URL" "${VITE_BLOCKS_API_URL:-$api_base}"
write_var "VITE_DATA_GATEWAY_URL" "${VITE_DATA_GATEWAY_URL:-}"
write_var "VITE_GRAPHQL_ENDPOINT" "${VITE_GRAPHQL_ENDPOINT:-}"
write_var "VITE_PROJECT_SLUG" "${VITE_PROJECT_SLUG:-${PROJECT_SLUG:-pnuasg}}"
write_var "VITE_SELISE_APP_DOMAIN" "${VITE_SELISE_APP_DOMAIN:-${SELISE_APP_DOMAIN:-${APP_DOMAIN:-https://pnuasg-dzdlq.seliseblocks.com}}}"
cat >> /usr/share/nginx/html/runtime-config.js <<'JS'
};
JS
EOF

RUN chmod +x /docker-entrypoint.d/10-vibebuilder-runtime-config.sh
