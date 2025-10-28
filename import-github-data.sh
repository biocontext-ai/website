#!/bin/bash

# GitHub Data Update Script
# This script calls both GitHub stars and README update endpoints

set -e

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Require CRON_SECRET
if [ -z "$CRON_SECRET" ]; then
    echo "Error: CRON_SECRET not found in .env"
    exit 1
fi

BASE_URL="http://localhost:3000"

echo "🚀 Starting GitHub data update (stars and README)..."

for endpoint in "/api/registry/stars" "/api/registry/readme"; do
    echo "\n→ POST $BASE_URL$endpoint"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $CRON_SECRET" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    if [ "$http_code" = "200" ]; then
        echo "✅ Success"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo "❌ Failed ($http_code)"
        echo "$body"
        exit 1
    fi
done

echo "\n🎉 GitHub data import complete."
