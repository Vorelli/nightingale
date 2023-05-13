FROM node:16-alpine AS base

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./

FROM base AS build
RUN npm install -g pnpm
RUN pnpm fetch
RUN pnpm i -r --offline

COPY . .
RUN pnpm build
RUN pnpm build:back

FROM node:16-alpine AS release
RUN apk add  --no-cache ffmpeg
WORKDIR /app
RUN mkdir /app/public
RUN mkdir /app/public/streaming
COPY --from=build /app/package*.json /app/pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm fetch --prod
RUN pnpm i -r --offline --prod
RUN pnpm migrate_db

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

EXPOSE 3000
EXPOSE 4000

CMD ["pnpm", "start"]