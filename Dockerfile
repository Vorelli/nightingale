## SERVER
FROM node:18-alpine AS buildServer

WORKDIR /app
COPY package*.json tsconfig.json ./
COPY server /app/server
RUN npm ci
RUN npm run build:back
RUN npm run migrate_db
RUN npm prune --prod

## CLIENT
FROM node:18-alpine AS buildClient

COPY client /app/client
COPY public /app/public
WORKDIR /app/client
RUN npm ci
RUN npm run build
RUN npm prune --prod

## ALL
FROM node:18-alpine AS release
RUN apk add ffmpeg
WORKDIR /app

RUN mkdir server
COPY package*.json ./
RUN mkdir -p /app/public/streaming
COPY --from=buildServer /app/server/node_modules ./server/node_modules
COPY --from=buildServer /app/server/dist ./server/dist
COPY --from=buildClient /app/public ./public

EXPOSE 3000
EXPOSE 4000

#CMD ["bin/bash"]
CMD ["npm", "start"]
