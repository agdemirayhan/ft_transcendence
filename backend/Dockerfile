FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY certs ./certs

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
