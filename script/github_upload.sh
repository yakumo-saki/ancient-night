#!/usr/bin/env bash

# param1: filename ( file must be at $CIRCLE_ARTIFACTS )
# param2: filename on github.
API_BASE=https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME
API_URL=$API_BASE/releases/tags
if test $CIRCLE_BRANCH = "develop"; then
   API_URL=$API_URL/preview
else
   VER=`cat ~/$CIRCLE_PROJECT_REPONAME/package.json | jq '.version'`
   API_URL=$API_URL/$VER
fi

# release を取得する
echo $API_URL
JSON=`curl -H "Authorization: token $GITHUB_ACCESS_TOKEN" $API_URL`

UPLOAD_URL=`echo $JSON | jq '.upload_url'`
UPLOAD_URL=`echo $UPLOAD_URL | sed -e 's/{?name,label}/?name=/g' | sed -e 's/"//g'`

UPLOAD_FILE=$CIRCLE_ARTIFACTS/$1
curl --data-binary @$UPLOAD_FILE -H "Content-Type: application/zip" -H "Authorization: token $GITHUB_ACCESS_TOKEN" $UPLOAD_URL$2
