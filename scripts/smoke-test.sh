#!/bin/bash

# CLI Smoke Test Script
# Quick validation that the CLI executable works correctly

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# CLI paths
CLI_JS="./cli-dist/cli.js"
CLI_BINARY="./release/loop-app"

# Determine which CLI to test
if [ -f "$CLI_BINARY" ] && [ -x "$CLI_BINARY" ]; then
  CLI_COMMAND="$CLI_BINARY"
  echo -e "${GREEN}Testing binary executable: $CLI_BINARY${NC}"
elif [ -f "$CLI_JS" ]; then
  CLI_COMMAND="node $CLI_JS"
  echo -e "${YELLOW}Testing Node.js CLI: $CLI_JS${NC}"
else
  echo -e "${RED}Error: No CLI found. Run 'npm run build:cli' first.${NC}"
  exit 1
fi

# Helper function to run a test
run_test() {
  local test_name="$1"
  local expected_exit_code="$2"
  shift 2
  local cli_args=("$@")

  TESTS_RUN=$((TESTS_RUN + 1))
  echo -n "Test $TESTS_RUN: $test_name ... "

  # Run CLI with timeout
  set +e
  if timeout 5s $CLI_COMMAND "${cli_args[@]}" > /tmp/smoke_test_stdout.txt 2> /tmp/smoke_test_stderr.txt; then
    actual_exit_code=0
  else
    actual_exit_code=$?
    # Timeout returns 124
    if [ $actual_exit_code -eq 124 ]; then
      echo -e "${RED}TIMEOUT${NC}"
      TESTS_FAILED=$((TESTS_FAILED + 1))
      return 1
    fi
  fi
  set -e

  if [ $actual_exit_code -eq $expected_exit_code ]; then
    echo -e "${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}FAIL${NC} (expected exit code $expected_exit_code, got $actual_exit_code)"
    echo "STDOUT:"
    cat /tmp/smoke_test_stdout.txt
    echo "STDERR:"
    cat /tmp/smoke_test_stderr.txt
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Helper to check output contains string
check_output_contains() {
  local test_name="$1"
  local expected_string="$2"
  shift 2
  local cli_args=("$@")

  TESTS_RUN=$((TESTS_RUN + 1))
  echo -n "Test $TESTS_RUN: $test_name ... "

  set +e
  timeout 5s $CLI_COMMAND "${cli_args[@]}" > /tmp/smoke_test_stdout.txt 2> /tmp/smoke_test_stderr.txt
  set -e

  if grep -qF -- "$expected_string" /tmp/smoke_test_stdout.txt || grep -qF -- "$expected_string" /tmp/smoke_test_stderr.txt; then
    echo -e "${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}FAIL${NC} (expected output to contain '$expected_string')"
    echo "STDOUT:"
    cat /tmp/smoke_test_stdout.txt
    echo "STDERR:"
    cat /tmp/smoke_test_stderr.txt
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

echo ""
echo "================================"
echo "   CLI SMOKE TESTS"
echo "================================"
echo ""

# Test 1: Help flag
run_test "Display help with --help" 0 --help

# Test 2: Help flag short form
run_test "Display help with -h" 0 -h

# Test 3: Version flag
run_test "Display version with --version" 0 --version

# Test 4: Version flag short form
run_test "Display version with -v" 0 -v

# Test 5: No arguments (should fail)
run_test "Fail with no arguments" 1

# Test 6: Unknown flag (should fail)
run_test "Fail with unknown flag" 1 --unknown

# Test 7: Invalid loop count (too low)
run_test "Fail with loop count 0" 1 --loops 0 test

# Test 8: Invalid loop count (too high)
run_test "Fail with loop count 11" 1 --loops 11 test

# Test 9: Invalid loop count (non-numeric)
run_test "Fail with non-numeric loop count" 1 --loops abc test

# Test 10: Loops without value
run_test "Fail with --loops but no value" 1 --loops

# Test 11: Check help output contains usage
check_output_contains "Help contains 'Usage'" "Usage:" --help

# Test 12: Check help contains options
check_output_contains "Help contains '--loops'" "--loops" --help

# Test 13: Check version output format
check_output_contains "Version shows 'loop-app CLI v'" "loop-app CLI v" --version

# Test 14: Check error message for no prompt
check_output_contains "Error message for no prompt" "Error: A prompt is required"

# Test 15: Check error message for unknown option
check_output_contains "Error message for unknown option" "Error: Unknown option" --invalid

# Cleanup
rm -f /tmp/smoke_test_stdout.txt /tmp/smoke_test_stderr.txt

# Summary
echo ""
echo "================================"
echo "   SMOKE TEST SUMMARY"
echo "================================"
echo -e "Tests run:    $TESTS_RUN"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"
else
  echo -e "Tests failed: $TESTS_FAILED"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some smoke tests failed!${NC}"
  exit 1
fi
