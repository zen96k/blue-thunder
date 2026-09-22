#! /usr/bin/env bash

set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIRNAME=$(cd $(dirname ${0}) && pwd)
PROJECT_DIRNAME=$(cd ${SCRIPT_DIRNAME}/../.. && pwd)

cd ${PROJECT_DIRNAME}

mise use -g node
npm install -g @anthropic-ai/claude-code
npm install -g @openai/codex
