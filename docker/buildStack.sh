#!/bin/bash
source ./assertions.sh

initialiseAssertions

function waitForContainerToStart() {
  until docker logs localstack | grep -q -m 1 "^Ready.$"; do
    printf '.'
    sleep 1
  done
  echo
}

cp -r resources ../dist/.

docker-compose up -d

waitForContainerToStart

. ./testDeployment.sh
. ./testSqs.sh
. ./testLambda.sh
. ./testDynamoDb.sh

reportAssertions

echo "Stopping Localstack."
docker-compose down
