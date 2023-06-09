FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./

FROM base AS build
RUN npm install -g pnpm
RUN pnpm fetch
RUN pnpm i -r --offline

COPY . .
RUN pnpm build
RUN pnpm build:back
RUN pnpm migrate_db
RUN pnpm prune --prod

FROM node:18-alpine AS release
RUN apk add ffmpeg
RUN npm install -g pnpm
WORKDIR /app
RUN mkdir /app/public
RUN mkdir /app/public/streaming

COPY package*.json pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/migrations-folder ./migrations-folder

EXPOSE 3000
EXPOSE 4000

CMD ["pnpm", "start"]
