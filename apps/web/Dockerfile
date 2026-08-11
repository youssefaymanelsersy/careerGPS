FROM oven/bun:1.3.6-alpine AS pruner
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune web --docker

FROM oven/bun:1.3.6-alpine AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock/ ./bun.lock
RUN bun install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

ARG VITE_SERVER_URL="http://localhost:3000"
ARG VITE_VAPID_PUBLIC_KEY="placeholder-vapid-key-for-ci-build-only"
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

RUN bun run build --filter=web

FROM nginx:alpine

RUN addgroup -S app && adduser -S app -G app && \
    touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid /var/cache/nginx /etc/nginx

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/build/client /usr/share/nginx/html
COPY apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    chown -R app:app /usr/share/nginx/html

USER app
EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
