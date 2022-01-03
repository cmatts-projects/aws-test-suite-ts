#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

function initialiseAssertions {
  export assertions_passes=0
  export assertions_fails=0
  export assertions_total=0
  export assertions_scenarios=0
}

function expectEquals {
  ((assertions_total++))
  local desc=$1
  local actual=$2
  local expected=$3
  if [ ! -z "${expected}" ] && [ "${actual}" != "${expected}" ]; then
    echo -e "\t${RED}${desc} - FAIL${NC}"
    echo -e "\t\texpected:"
    echo -e "\t\t\t${actual}"
    echo -e "\t\tto equal:"
    echo -e "\t\t\t${expected}"
    ((assertions_fails++))
  else
    echo -e "\t${GREEN}${desc} - PASS${NC}"
    ((assertions_passes++))
  fi
}

function expectJsonAttr {
  local desc=$1
  local actual=$2
  local expected=$3
  if [ ! -z "$4" ]; then
    actual=$(jq -r "$4" <<< $2 2>/dev/null)
  fi

  expectEquals "${desc}" "${actual}" "${expected}"
}

function reportAssertions {
  echo -e "\nScenarios: $assertions_scenarios, Total: $assertions_total, Passes: $assertions_passes, Failures: $assertions_fails\n"
}

function Scenario {
  ((assertions_scenarios++))
  echo -e "\nScenario: $1"
}

# Given/When/Then Parameters
# 1 - description
# 2 - actual result
# 3 - expected result
# 4 - json path to extract result
function Given {
  expectJsonAttr "Given $1" "$2" "$3" "$4"
}

function When {
  expectJsonAttr "When $1" "$2" "$3" "$4"
}

function Then {
  expectJsonAttr "Then $1" "$2" "$3" "$4"
}

function And {
  expectJsonAttr "And $1" "$2" "$3" "$4"
}