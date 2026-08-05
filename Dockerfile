FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY backend ./backend
COPY kiu-realtime-bridge ./kiu-realtime-bridge
COPY tools ./tools
COPY infra ./infra
COPY assets ./assets
COPY *.html ./
COPY manifest.webmanifest service-worker.js ./

RUN mkdir -p /app/kiu-realtime-bridge/uploads /tmp/kiu-platform \
    && chown -R node:node /app /tmp/kiu-platform

USER node

EXPOSE 47833

CMD ["sh", "-c", "node tools/migrate-postgres.js && exec node backend/platform/server.js"]
