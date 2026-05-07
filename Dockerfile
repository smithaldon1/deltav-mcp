FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY mock-deltav-edge/package.json ./mock-deltav-edge/package.json
COPY mock-deltav-edge/ui/package.json ./mock-deltav-edge/ui/package.json
COPY mock-opcua-server/package.json ./mock-opcua-server/package.json
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json* ./
COPY mock-deltav-edge/package.json ./mock-deltav-edge/package.json
COPY mock-deltav-edge/ui/package.json ./mock-deltav-edge/ui/package.json
COPY mock-opcua-server/package.json ./mock-opcua-server/package.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY config ./config
COPY .env.example ./.

RUN addgroup -S deltav && adduser -S deltav -G deltav \
  && mkdir -p /app/logs /app/generated-packages \
  && chown -R deltav:deltav /app

USER deltav

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.DELTAV_HTTP_PORT || '3000') + '/healthz').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
