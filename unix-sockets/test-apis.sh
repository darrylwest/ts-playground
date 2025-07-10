#!/usr/bin/env bash
# dpw@larkspur.localdomain
# 2025-07-10 15:24:43
#

set -eu

for api in ping date time iso
do
    printf "$api: "
    curl --unix-socket ./dist/app.sock http://localhost/$api
    printf "\n"
done
