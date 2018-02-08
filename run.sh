#!/bin/bash

# ENV Setting
# GIT_REPO=
# GIT_BRANCH=master
# GIT_PULL=true

APP_HOME=/usr/local/src
GIT="git --work-tree=$APP_HOME --git-dir=$APP_HOME/.git"

if [ ! -f /root/.ssh/id_rsa ]
then
  echo "Generating new ssh-key\n"
  ssh-keygen -q -t rsa -b 2048 -N '' -f /root/.ssh/id_rsa
fi

if [ -z $GIT_PULL ]
then
    GIT_PULL=true
fi
echo Set GIT_PULL = $GIT_PULL

if [ -z $GIT_BRANCH ]
then
    GIT_BRANCH=master
fi
echo Set GIT_BRANCH = $GIT_BRANCH

if [ ! -z $GIT_REPO ]
then
    echo Set GIT_REPO = $GIT_REPO
    if [ "$GIT_PULL" == "true" ] && [ ! -d "$APP_HOME" ]
    then
        $GIT clone -b $GIT_BRANCH $GIT_REPO $APP_HOME
    elif [ "$GIT_PULL" == "true" ] && [ -d "$APP_HOME" ] && [ ! -d "$APP_HOME/.git" ] # GIT_PULL is true and APP_HOME directory is exists but no git config
    then
        $GIT init
        $GIT remote add origin $GIT_REPO
        $GIT pull origin $GIT_BRANCH
    elif [ "$GIT_PULL" == "true" ] && [ -d "$APP_HOME" ] && [ -d "$APP_HOME/.git" ] # GIT_PULL is true and APP_HOME directory is exists and git config
    then
        $GIT pull origin $GIT_BRANCH
    fi
else
    echo "No GIT Repository config"

    if [ ! -d "$APP_HOME" ]
    then
        echo No $APP_HOME directory
        exit 1;
    else
        echo Use src from $APP_HOME for running
    fi        
fi

cd $APP_HOME
npm i --prod
npm run build 
npm start