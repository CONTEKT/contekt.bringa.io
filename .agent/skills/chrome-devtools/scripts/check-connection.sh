#!/bin/bash

# Check if Chrome is running with remote debugging on port 9222
if curl -s http://127.0.0.1:9222/json/version > /dev/null; then
  echo "✅ Chrome remote debugging is active on port 9222."
  exit 0
else
  echo "❌ Chrome remote debugging is NOT active on port 9222."
  echo "Tip: Start Chrome with --remote-debugging-port=9222"
  exit 1
fi
