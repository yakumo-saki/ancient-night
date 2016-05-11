#!/usr/bin/env bash

cd ~/$CIRCLE_PROJECT_REPONAME/src/main 
tsconfig -u 
tsc

cd ~/$CIRCLE_PROJECT_REPONAME/src/renderer
tsconfig -u 
tsc

cd ~/$CIRCLE_PROJECT_REPONAME/ 
npm run package_circleci

zip -r $CIRCLE_ARTIFACTS/$CIRCLE_PROJECT_REPONAME_osx.zip ../build/ancient-night-darwin-x64/
zip -r $CIRCLE_ARTIFACTS/$CIRCLE_PROJECT_REPONAME_win.zip ../build/ancient-night-win32-x64/
