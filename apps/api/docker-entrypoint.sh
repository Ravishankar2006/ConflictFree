#!/bin/sh
# Container startup for the API: get the Prisma client, schema and baseline data in
# place, then hand off to CMD.
#
# Safe on every `docker compose up`:
#   - generate and `migrate deploy` are idempotent
#   - the seed only runs against an empty database, so a restart never wipes edits
set -e

PRISMA="./node_modules/.bin/prisma"

# The image runs `npm install` before the schema is copied in, so @prisma/client's
# own postinstall generate finds no schema. Generate here instead, or importing
# PrismaClient throws at startup.
echo "[startup] generating Prisma client"
"$PRISMA" generate

echo "[startup] applying migrations"
"$PRISMA" migrate deploy

if node scripts/needs-seed.js; then
  echo "[startup] database is empty - seeding"
  node src/config/seed.js \
    || echo "[startup] WARNING: seed failed; the API will start but no accounts will exist"
else
  echo "[startup] database already populated - skipping seed"
fi

echo "[startup] starting API"
exec "$@"
