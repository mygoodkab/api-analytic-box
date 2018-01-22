#!/usr/bin/env bash
docker-compose build --no-cache
docker-compose up -d --force-recreate --scale vam_webconfig-api=16
