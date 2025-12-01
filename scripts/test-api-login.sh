#!/bin/bash

echo "Testing API Login..."
echo "Email: admin@admin.com"
echo "Password: 123@Admin"
echo "Remember Me: true"
echo "---"
echo ""

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Cookie: " \
  -d '{
    "email": "admin@admin.com",
    "password": "123@Admin",
    "rememberMe": true
  }' \
  -v \
  -s \
  -w "\n\nHTTP Status: %{http_code}\n"

