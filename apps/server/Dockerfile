FROM oven/bun:1.3.6-alpine AS pruner
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune server --docker

FROM oven/bun:1.3.6-alpine AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock/ ./bun.lock
RUN bun install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN cd apps/server && bun run compile

FROM alpine:3.19
WORKDIR /app
RUN apk add --no-cache libstdc++ libgcc curl
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/apps/server/server ./server

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["./server"]