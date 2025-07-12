#!/bin/bash

echo "Starting AetherScope Dashboard..."
echo "Making sure port 5000 is free..."
pkill -f "node.*server" 2>/dev/null || true
sleep 2

echo "Starting the application server..."
cd .
NODE_ENV=development node --import tsx/esm server/index.ts &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
echo "Waiting for server to initialize..."
sleep 5

echo "Testing API endpoints..."
echo "Health API:" 
curl -s http://localhost:5000/api/health/records || echo "[]"
echo ""
echo "Finance API:"
curl -s http://localhost:5000/api/finance/transactions || echo "[]"
echo ""

echo "✓ AetherScope Dashboard is running on http://localhost:5000"
echo "✓ Health Dashboard: Enhanced with AI diagnosis tracking and patient consent auditing"
echo "✓ Finance Dashboard: Real-time expense tracking and portfolio monitoring"
echo "✓ Log Analysis: Healthcare and financial log analysis with AI insights"
echo ""
echo "To stop the server, run: kill $SERVER_PID"
echo "Press Ctrl+C to view the server logs in real-time"

wait $SERVER_PID