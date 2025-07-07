# E2E Tests for Mereka.io

This directory contains end-to-end tests for Mereka.io using Playwright.

## Directory Structure

```
tests/
├── auth/                     # Authentication related tests
│   ├── login.spec.ts        # Login functionality tests
│   └── signup.spec.ts       # (Future) Signup functionality tests
├── profile/                  # Profile related tests
│   └── view-profile.spec.ts # (Future) Profile viewing tests
└── README.md                # This file
```

## Test Organization

Each test file follows these conventions:

1. **Naming**:
   - Files: `feature-name.spec.ts`
   - Test suites: Descriptive group name (e.g., "Authentication - Login")
   - Test cases: Should describe the scenario (e.g., "should successfully login with valid credentials")

2. **Structure**:
   - Test data at the top of the file
   - `beforeEach` hooks for common setup
   - Test cases organized by functionality
   - Clear step-by-step comments

3. **Best Practices**:
   - One feature per file
   - Clear, descriptive test names
   - Isolated tests (no dependencies between tests)
   - Proper error handling
   - Consistent logging

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run in headed mode (visible browser)
npx playwright test tests/auth/login.spec.ts --headed
```

## Test Results

Test results, including videos and screenshots, are saved in:
- Videos: `test-results/[test-name]/video.webm`
- Screenshots: `test-results/[test-name]/screenshots/`
- Traces: `test-results/[test-name]/trace.zip` 