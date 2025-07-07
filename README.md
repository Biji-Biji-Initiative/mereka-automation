# Mereka.io E2E Tests

This project contains end-to-end tests for Mereka.io using Playwright.

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Running Tests

- Run all tests:
```bash
npm test
```

- Run tests in headed mode (with browser visible):
```bash
npm run test:headed
```

- Run tests in debug mode:
```bash
npm run test:debug
```

## Test Structure

- `tests/login.spec.ts`: Contains tests for login functionality and profile access
- `playwright.config.ts`: Configuration file for Playwright 