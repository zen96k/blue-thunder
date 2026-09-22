#! /usr/bin/env bash

set -euxo pipefail

mkdir -p .claude
mkdir -p .codex

mkdir -p ./home/vscode/.claude
mkdir -p ./home/vscode/.codex

if [ ! -f .devcontainer/devcontainer.env ]; then
  cp .devcontainer/devcontainer.env.example .devcontainer/devcontainer.env
fi
