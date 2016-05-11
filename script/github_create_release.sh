#!/usr/bin/env bash

API_BASE=https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME
API_URL=$API_BASE/releases/tags
if test $CIRCLE_BRANCH = "develop"; then
   VER=preview
   PRE=true
   API_URL=$API_URL/preview
else
   VER=`cat ~/$CIRCLE_PROJECT_REPONAME/package.json | jq '.version'`
   PRE=false
   API_URL=$API_URL/$VER
fi

# release を取得する
echo $API_URL
JSON=`curl -H "Authorization: token $GITHUB_ACCESS_TOKEN" $API_URL`
OLD_ID=`echo $JSON | jq '.id'`
echo OLD_ID = $OLD_ID
if test "$OLD_ID" != "null"; then
   # 存在するreleaseを消す
    DEL_URL=`echo ${API_BASE}/releases/${OLD_ID}`
    echo DEL_URL = $DEL_URL
    curl -X DELETE -H "Authorization: token $GITHUB_ACCESS_TOKEN" $DEL_URL
fi

# releaseを作成
JSON_FILE=/tmp/create.json
echo { > $JSON_FILE
echo   \"tag_name\": \"${VER}\", >> $JSON_FILE
echo   \"prerelease\": $PRE, >> $JSON_FILE
echo   \"name\": \"${VER}\" >> $JSON_FILE
echo } >> $JSON_FILE

curl -X POST -d @/tmp/create.json -H "Authorization: token $GITHUB_ACCESS_TOKEN" $API_BASE/releases
