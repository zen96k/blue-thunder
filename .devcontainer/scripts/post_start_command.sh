#! /usr/bin/env bash

set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIRNAME=$(cd $(dirname ${0}) && pwd)
PROJECT_DIRNAME=$(cd ${SCRIPT_DIRNAME}/../.. && pwd)

cd ${PROJECT_DIRNAME}

git config user.name "${GIT_USER_NAME}"
git config user.email "${GIT_USER_EMAIL}"
git config fetch.prune true
