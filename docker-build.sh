#!/bin/bash
# Exit immediately if any command fails
set -e

sudo docker-compose build
sudo docker-compose up -d
sudo docker logs -f nest-app
