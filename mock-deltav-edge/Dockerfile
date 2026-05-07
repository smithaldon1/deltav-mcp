FROM node:22-alpine AS build

WORKDIR /app
COPY package.json tsconfig.json ./
COPY ui/package.json ./ui/package.json
RUN npm install
RUN npm --prefix ./ui install
COPY src ./src
COPY ui ./ui
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/data ./src/data
COPY --from=build /app/ui/dist ./ui/dist
RUN addgroup -S mockedge && adduser -S mockedge -G mockedge && chown -R mockedge:mockedge /app
USER mockedge
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "dist/server.js"]
