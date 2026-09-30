#!/usr/bin/env bash
# Install Redis on the CadetMate VPS and bind it to localhost.
# The Next process reads REDIS_URL=redis://127.0.0.1:6379
set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This script expects Debian/Ubuntu (apt-get)." >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y redis-server

CONF=/etc/redis/redis.conf
sudo sed -i 's/^bind .*/bind 127.0.0.1 ::1/' "$CONF"
sudo sed -i 's/^protected-mode .*/protected-mode yes/' "$CONF"
sudo sed -i 's/^supervised .*/supervised systemd/' "$CONF"

sudo systemctl enable redis-server
sudo systemctl restart redis-server
redis-cli ping
