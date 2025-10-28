#!/usr/bin/env bash

# Registry Update Script
# This script performs a POST request to update the MCP server registry

set -euo pipefail

# Always use localhost for dev import
BASE_URL="http://localhost:3000"
API_ENDPOINT="$BASE_URL/api/registry/update"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_status $BLUE "🚀 Starting registry update..."
print_status $YELLOW "📡 Endpoint: ${API_ENDPOINT}"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  print_status $RED "Error: .env file not found"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  print_status $RED "Error: CRON_SECRET not found in .env"
  exit 1
fi

print_status $YELLOW "→ POST $API_ENDPOINT"
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  "$API_ENDPOINT")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)
if [ "$http_code" = "200" ]; then
  print_status $GREEN "✅ Success"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  print_status $RED "❌ Failed ($http_code)"
  echo "$body"
  exit 1
fi

print_status $GREEN "\n🎉 Registry import complete."
