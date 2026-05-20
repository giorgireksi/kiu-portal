FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN apk add --no-cache su-exec \
    && npm ci --omit=dev

COPY backend ./backend
COPY kiu-realtime-bridge ./kiu-realtime-bridge
COPY tools ./tools
COPY infra ./infra
COPY assets ./assets
COPY images ./images
COPY *.html ./
COPY manifest.webmanifest service-worker.js ./

RUN mkdir -p /app/kiu-realtime-bridge/uploads /tmp/kiu-platform \
    && chown -R node:node /app /tmp/kiu-platform

EXPOSE 47833

CMD ["sh", "-c", "mkdir -p /app/kiu-realtime-bridge/uploads /tmp/kiu-platform && chown -R node:node /app/kiu-realtime-bridge/uploads /tmp/kiu-platform && exec su-exec node sh -c 'node backend/platform/server.js'"]
