#!/usr/bin/env bash
docker-compose -f docker-compose-dev.yaml build --no-cache
docker-compose -f docker-compose-dev.yaml up -d --force-recreate 
