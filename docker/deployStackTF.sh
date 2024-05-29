#!/bin/bash

cp ../terraform/* ../dist/.
cd ../dist

tflocal init
tflocal validate
tflocal plan
tflocal apply -auto-approve