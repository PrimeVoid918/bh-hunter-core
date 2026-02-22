#!/bin/bash

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: .env file not found."
    exit 1
fi

TARGET_URL="${DATABASE_URL/:5432\//:3101\/}"

echo "Connecting to database on port 3101..."

psql "$TARGET_URL"