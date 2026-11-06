#!/usr/bin/env bash
# Prepares the local Garage from docker-compose.yaml: applies a single-node layout and creates the
# `larpit` bucket and key. Safe to rerun. Prints the S3_* lines for .env:
#
#   docker compose up -d && scripts/garage-init.sh
set -euo pipefail

garage() {
  docker compose exec -T garage /garage "$@"
}

until garage status >/dev/null 2>&1; do sleep 1; done

if garage layout show | grep -q 'NO ROLE ASSIGNED\|No nodes currently have a role'; then
  node_id=$(garage status | awk '/^[0-9a-f]{16} /{print $1; exit}')
  garage layout assign -z dc1 -c 10G "$node_id" >/dev/null
  garage layout apply --version 1 >/dev/null
fi

ensure_bucket_and_key() {
  local name=$1
  garage bucket info "$name" >/dev/null 2>&1 || garage bucket create "$name" >/dev/null
  garage key info "$name" >/dev/null 2>&1 || garage key create "$name" >/dev/null
  garage bucket allow --read --write --owner "$name" --key "$name" >/dev/null
}

ensure_bucket_and_key larpit

info=$(garage key info --show-secret larpit)
echo "S3_ENDPOINT=http://localhost:3900"
echo "S3_BUCKET=larpit"
echo "S3_ACCESS_KEY_ID=$(awk '/^Key ID:/{print $3}' <<<"$info")"
echo "S3_SECRET_ACCESS_KEY=$(awk '/^Secret key:/{print $3}' <<<"$info")"
