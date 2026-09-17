FROM node:24.16.0-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS tools
COPY . .
ENV APP_URL=https://shop.lixuanjian.com SHOP_DEMO_MODE=true NEXT_TELEMETRY_DISABLED=1

FROM tools AS builder
RUN npm run lint && npm run typecheck && npm test && npm run build -- --webpack

FROM node:24.16.0-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /app/.next/standalone ./
RUN mkdir -p .next/cache && chown -R node:node .next/cache
USER node
EXPOSE 3000
CMD ["node", "server.js"]
