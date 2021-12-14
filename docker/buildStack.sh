#!/bin/bash

function waitForContainerToStart() {
  until docker logs localstack | grep -q -m 1 "^Ready.$"; do
    printf '.'
    sleep 1
  done
  echo
}

cp -r ../cloudformation/* ../dist

echo Start container
docker-compose up -d

waitForContainerToStart

echo "Localstack started."

./deployStack.sh

./testSqs.sh
./testLambda.sh

echo "Stopping Localstack."
docker-compose down
