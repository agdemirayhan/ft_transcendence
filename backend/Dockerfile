FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl
RUN mkdir -p certs && openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout certs/key.pem \
    -out certs/cert.pem \
    -days 365 \
    -subj "/CN=backend" \
    -addext "subjectAltName=DNS:backend,DNS:localhost,IP:127.0.0.1"

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
