#!/usr/bin/env bash

# param1: filename ( file must be at $CIRCLE_ARTIFACTS )
# param2: filename on github.
echo params $1 $2

## 共通部
API_BASE=https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME
API_URL=$API_BASE/releases/tags

VER=`cat ~/$CIRCLE_PROJECT_REPONAME/package.json | jq '.version'`
PRE=false

if test $CIRCLE_BRANCH = "develop"; then
   VER=`echo ${VER} | sed s/\"//g`
   VER=`echo ${VER}_beta`
   VER="$VER"
   PRE=true
fi

API_URL=$API_URL/$VER
## /共通部

# release を取得する
echo API URL = $API_URL
JSON=`curl -H "Authorization: token $GITHUB_ACCESS_TOKEN" $API_URL`

UPLOAD_URL=`echo $JSON | jq '.upload_url'`
UPLOAD_URL=`echo $UPLOAD_URL | sed -e 's/{?name,label}/?name=/g' | sed -e 's/"//g'`

echo UPLOAD URL = $UPLOAD_URL
if test $UPLOAD_URL = "null"; then
    echo $JSON
fi

UPLOAD_FILE=$CIRCLE_ARTIFACTS/$1
echo UPLOADING $UPLOAD_FILE / DisplayName $2
curl -v --data-binary @$UPLOAD_FILE -H "Content-Type: application/zip" -H "Authorization: token $GITHUB_ACCESS_TOKEN" $UPLOAD_URL$2
