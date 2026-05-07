FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN addgroup -S opcua && adduser -S opcua -G opcua \
  && chown -R opcua:opcua /app

USER opcua

EXPOSE 4840

CMD ["node", "dist/server.js"]
