#!/bin/bash

# Mereka Automation Test Runner
# Usage: ./run-tests.sh [options]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
HEADED=false
BROWSER="chromium"
SPECIFIC_TEST=""

# Function to display usage
show_usage() {
    echo -e "${BLUE}Mereka Automation Test Runner${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --headed          Run tests in headed mode (show browser)"
    echo "  -b, --browser         Specify browser (chromium, firefox, webkit)"
    echo "  -t, --test            Run specific test file"
    echo "  -a, --all             Run all tests"
    echo "  -j, --job             Run job-related tests"
    echo "  -c, --collection      Run job collection tests"
    echo "  -l, --list            List all available test files"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all                    # Run all tests"
    echo "  $0 --headed --all           # Run all tests in headed mode"
    echo "  $0 --test auth/login        # Run specific test"
    echo "  $0 --job --headed           # Run job tests in headed mode"
    echo "  $0 --collection             # Run job collection tests"
}

# Function to list all test files
list_tests() {
    echo -e "${BLUE}Available test files:${NC}"
    echo ""
    
    if [ -d "mereka-automation" ]; then
        find mereka-automation -name "*.spec.ts" | while read -r file; do
            relative_path="${file#mereka-automation/}"
            echo -e "  ${GREEN}${relative_path}${NC}"
        done
    else
        echo -e "${RED}mereka-automation folder not found!${NC}"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    local test_path="$1"
    local command="npx playwright test"
    
    if [ "$HEADED" = true ]; then
        command="$command --headed"
    fi
    
    if [ -n "$BROWSER" ] && [ "$BROWSER" != "chromium" ]; then
        command="$command --project=$BROWSER"
    fi
    
    if [ -n "$test_path" ]; then
        command="$command mereka-automation/$test_path.spec.ts"
    else
        command="$command mereka-automation/"
    fi
    
    echo -e "${BLUE}Running: $command${NC}"
    echo ""
    
    eval "$command"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--headed)
            HEADED=true
            shift
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -t|--test)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        -a|--all)
            run_tests ""
            exit 0
            ;;
        -j|--job)
            run_tests "job"
            exit 0
            ;;
        -c|--collection)
            run_tests "job/job-collection"
            exit 0
            ;;
        -l|--list)
            list_tests
            exit 0
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# If specific test is provided, run it
if [ -n "$SPECIFIC_TEST" ]; then
    run_tests "$SPECIFIC_TEST"
    exit 0
fi

# Default: show usage if no arguments provided
show_usage 