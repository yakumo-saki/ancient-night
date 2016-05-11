#!/usr/bin/env bash

cd ~/$CIRCLE_PROJECT_REPONAME/src/main 
tsconfig -u 
tsc

cd ~/$CIRCLE_PROJECT_REPONAME/src/renderer
tsconfig -u 
tsc

cd ~/$CIRCLE_PROJECT_REPONAME/ 
npm run package_circleci
