#!/bin/sh

# 1️⃣ Wait for the DB to be ready
./wait-for-db.sh

# 2️⃣ Generate Prisma client
echo "⚙️ Running prisma generate..."
npx prisma generate

# 3️⃣ Apply pending migrations (creates all tables)
echo "⚙️ Applying pending migrations..."
npx prisma migrate deploy

# 4️⃣ Apply custom SQL alterations (db-alterations.sql)
echo "📦 Applying custom SQL alterations..."
psql $DATABASE_URL -f docker-scripts/db-alterations.sql

# 5️⃣ Run seed script (create admin, default entries, etc.)
echo "📦 Running seed script..."
npm run seed

# 6️⃣ Start NestJS
echo "🚀 Starting NestJS..."
node dist/main
