#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

function initialiseAssertions {
  export assertions_passes=0
  export assertions_fails=0
  export assertions_total=0
  export assertions_suites=0
}

function expectEquals {
  ((assertions_total++))
  local desc=$1
  local actual=$2
  local expected=$3
  if [ "${actual}" != "${expected}" ]; then
    echo -e "\t${desc} - ${RED}FAIL${NC}"
    echo -e "\t\texpected:"
    echo -e "\t\t\t${actual}"
    echo -e "\t\tto equal:"
    echo -e "\t\t\t${expected}"
    ((assertions_fails++))
  else
    echo -e "\t${desc} - ${GREEN}PASS${NC}"
    ((assertions_passes++))
  fi
}

function expectJsonAttr {
  local actual=$(jq -r $3 <<< $2 2>/dev/null)
  expectEquals "$1" "${actual}" "$4"
}

function reportAssertions {
  echo -e "\nSuites: $assertions_suites, Total: $assertions_total, Passes: $assertions_passes, Failures: $assertions_fails\n"
}

function describe {
  ((assertions_suites++))
  echo -e "\nTest suite: $1"
}