FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# Migrate + seed + start. On boot only — see docs/05-operations/DEPLOYMENT.md
# for why real production releases run migrations as a separate step instead.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/index.js"]
