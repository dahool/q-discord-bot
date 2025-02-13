#!/bin/sh
pm2 start process.json
caddy run --config /etc/caddy/Caddyfile
