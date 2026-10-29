FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
ENV STANDALONE=1 NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

FROM node:22-alpine AS run
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app ./
EXPOSE 3000
# Terapkan migrasi lalu jalankan server
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start"]
