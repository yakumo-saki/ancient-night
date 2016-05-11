#!/usr/bin/env bash

# param1: filename ( file must be at $CIRCLE_ARTIFACTS )
REPO_BASE=https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME
REPO_URL=$REPO_BASE/releases/tags
if test $CIRCLE_BRANCH = "develop"; then
   REPO_URL=$REPO_URL/preview
else
   REPO_URL=`echo $REPO_URL/`cat ~/$CIRCLE_PROJECT_REPONAME/package.json | jq '.version'``
fi

echo $REPO_URL
JSON=`curl -H "Authorization: token $GITHUB_ACCESS_TOKEN" $REPO_URL`

FILE_IDS=(`echo $JSON | jq ".assets[].id" | tr '\n' ' '`)
i=0
for e in ${FILE_IDS[@]}; do
    DEL_URL=`echo ${REPO_BASE}/releases/assets/${e}`
    echo "FILE_IDS[$i] = ${e} $DEL_URL"
    curl -X DELETE -H "Authorization: token $GITHUB_ACCESS_TOKEN" $DEL_URL 
    let i++
done
