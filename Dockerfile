FROM node:16 AS base

WORKDIR /app
COPY package*.json ./

FROM base AS build
RUN npm ci

COPY . .
RUN npm run build
RUN npm run build:back

FROM node:16 AS release
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

EXPOSE 3000
EXPOSE 4000

CMD ["npm", "start"]