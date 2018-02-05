#!/usr/bin/env bash
docker-compose -f docker-compose-release.yaml build --no-cache
docker-compose -f docker-compose-release.yaml up -d --force-recreate 
