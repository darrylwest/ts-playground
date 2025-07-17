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

key=`txkey`
printf "api/get/:key: "
curl --unix-socket ./dist/app.sock "http://localhost/api/get/$key"
printf "\n"

printf "parse: "
curl --unix-socket ./dist/app.sock "http://localhost/parse/2025-07-10T10:15:30"
printf "\n"

