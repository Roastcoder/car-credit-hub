#!/bin/bash

# Backend API Test Script
BACKEND_URL="https://backend.meharadvisory.cloud/api"

echo "Testing Backend API Endpoints..."
echo "================================"

# Test basic health/status
echo "1. Testing basic API connection..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BACKEND_URL/"

# Test loans endpoint (should require auth)
echo "2. Testing loans endpoint (should return 401 without auth)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BACKEND_URL/loans"

# Test specific loan endpoint (should require auth)
echo "3. Testing specific loan endpoint (should return 401 without auth)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BACKEND_URL/loans/1"

# Test status endpoint (should require auth)
echo "4. Testing status endpoint (should return 401 without auth)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BACKEND_URL/loans/1/status"

echo "================================"
echo "Expected results:"
echo "- 200/404 for basic API"
echo "- 401 for authenticated endpoints"
echo "- If you get 404 for status endpoint, the route isn't deployed"