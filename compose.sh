#!/usr/bin/env bash
set -e

# Automatically link Docker Desktop's compose plugin if not already linked
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE_PLUGIN="/Applications/Docker.app/Contents/Resources/cli-plugins/docker-compose"
  if [ -f "$COMPOSE_PLUGIN" ]; then
    echo "Linking Docker Compose plugin from Docker Desktop..."
    mkdir -p "$HOME/.docker/cli-plugins"
    ln -sf "$COMPOSE_PLUGIN" "$HOME/.docker/cli-plugins/docker-compose"
    echo "Docker Compose linked successfully."
  fi
fi

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker daemon is not running."
  echo "Please start Docker Desktop (/Applications/Docker.app) and try again."
  exit 1
fi

# Run docker compose
if [ $# -eq 0 ]; then
  echo "Starting all services (postgres, backend, frontend) with docker compose..."
  exec docker compose up --build
else
  exec docker compose "$@"
fi
