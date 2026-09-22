#! /usr/bin/env bash

set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIRNAME=$(cd $(dirname ${0}) && pwd)
PROJECT_DIRNAME=$(cd ${SCRIPT_DIRNAME}/../.. && pwd)

cd ${PROJECT_DIRNAME}

until docker info; do
  echo "Waiting for Docker daemon to start..."
  sleep 1
done

# docker compose up -d --force-recreate --remove-orphans
docker system prune -af --volumes
