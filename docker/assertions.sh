#!/bin/bash
passes=0
fails=0
total=0

function expectEquals {
  ((total++))
  local RED='\033[0;31m'
  local GREEN='\033[0;32m'
  local NC='\033[0m' # No Color
  local desc=$1
  local actual=$2
  local expected=$3
  if [ "${actual}" != "${expected}" ]; then
    echo -e "${desc} - ${RED}FAIL${NC}"
    echo "expected:"
    echo "${actual}"
    echo "to equal:"
    echo "${expected}"
    ((fails++))
  else
    echo -e "${desc} - ${GREEN}PASS${NC}"
    ((passes++))
  fi
}

function expectJsonAttr {
  local actual=$(jq -r $3 <<< $2)
  expectEquals "$1" "${actual}" "$4"
}

function reportAssertions {
  echo -e "\nTotal: $total, Passes: $passes, Failures: $fails\n"
}