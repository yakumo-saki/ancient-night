#!/usr/bin/env bash

# param1: filename ( file must be at $CIRCLE_ARTIFACTS )
REPO_URL = https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/releases/tags/
if test $CIRCLE_BRANCH = "develop" then
   REPO_URL = $REPO_URL/preview
else
   REPO_URL = `echo $REPO_URL/`cat ~/$CIRCLE_PROJECT_REPONAME/package.json | jq '.version'``
fi; 

UPLOAD_URL=`curl -H "Authorization: token $GITHUB_ACCESS_TOKEN" https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/releases/tags/preview | jq '.upload_url'`
UPLOAD_URL=`echo $UPLOAD_URL | sed -e 's/{?name,label}/?name=/g' | sed -e 's/"//g'`

UPLOAD_FILE=$CIRCLE_ARTIFACTS/$1
curl --data-binary @$UPLOAD_FILE -H "Content-Type: application/zip" -H "Authorization: token $GITHUB_ACCESS_TOKEN" $UPLOAD_URL$1
