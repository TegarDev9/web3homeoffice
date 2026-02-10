#!/usr/bin/env bash
set -euxo pipefail

# Non-operational placeholder for an RPC-like service scaffold.

mkdir -p /opt/web3ho/rpc
cat <<'EOF' >/opt/web3ho/rpc/docker-compose.yml
services:
  rpc-placeholder:
    image: ghcr.io/nginxinc/nginx-unprivileged:stable-alpine
    ports:
      - "8545:8080"
    command: ["nginx", "-g", "daemon off;"]
EOF

cat <<'EOF' >/opt/web3ho/rpc/README.txt
This is a placeholder workload only.
Replace with your own legal and compliant node/client stack.
EOF

docker compose -f /opt/web3ho/rpc/docker-compose.yml up -d


