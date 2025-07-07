import { test, expect } from '@playwright/test';

/**
 * Authentication Login Tests
 * 
 * IMPORTANT: These tests require proper environment setup to run correctly.
 * 
 * How to run these tests:
 * 1. Use the PowerShell script: ./test-live.ps1
 * 2. Or set environment variable manually: $env:TEST_ENV = "live"; npx playwright test auth/login.spec.ts --headed
 * 3. Or run from root directory: $env:TEST_ENV = "live"; npx playwright test auth/login.spec.ts --headed
 * 
 * The environment variable TEST_ENV is required because:
 * - It sets the baseURL to https://www.mereka.io in playwright.config.ts
 * - Without it, tests fail with "Cannot navigate to invalid URL" error
 * 
 * Available environments: dev, staging, live (default: live)
 */

// Test data
const TEST_USER = {
  email: 'testingmereka01@gmail.com',
  password: 'merekamereka'
};

const INVALID_USER = {
  email: 'invalid@example.com',
  password: 'wrongpassword'
};

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    console.log('Starting login flow with valid credentials...');
    
    // Step 1: Click login link - flexible selector
    const loginLink = page.getByRole('link', { name: 'Log In' }).or(
      page.getByRole('link', { name: 'Login' })
    ).or(
      page.locator('a[href*="login"], a[href*="auth"], a:has-text("Log In"), a:has-text("Login")')
    );
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();

    // Step 2: Select email login method - flexible selector
    console.log('Selecting email login method...');
    await page.waitForLoadState('networkidle');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' }).or(
      page.getByRole('button', { name: 'Email' })
    );
    await expect(emailButton).toBeVisible({ timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    // Step 3: Enter email
    console.log('Entering email...');
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_USER.email);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: Enter password
    console.log('Entering password...');
    const passwordInput = page.locator('input[formcontrolname="password"][type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Step 5: Verify successful login - check for login indicators
    await page.waitForLoadState('networkidle');
    
    // Check for successful login indicators (profile menu, dashboard, etc.)
    const loginSuccessIndicators = page.locator('[class*="profile"], [class*="user"], [class*="menu"], [class*="avatar"]').or(
      page.getByText('Welcome').or(
        page.getByText('Dashboard')
      )
    );
    await expect(loginSuccessIndicators.first()).toBeVisible({ timeout: 15000 });
    console.log('Login successful!');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    console.log('Starting login flow with invalid credentials...');
    
    // Step 1: Click login link - flexible selector (same as working test)
    const loginLink = page.getByRole('link', { name: 'Log In' }).or(
      page.getByRole('link', { name: 'Login' })
    ).or(
      page.locator('a[href*="login"], a[href*="auth"], a:has-text("Log In"), a:has-text("Login")')
    );
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();

    // Step 2: Select email login method - flexible selector (same as working test)
    console.log('Selecting email login method...');
    await page.waitForLoadState('networkidle');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' }).or(
      page.getByRole('button', { name: 'Email' })
    );
    await expect(emailButton).toBeVisible({ timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    // Step 3: Enter valid email (same as working test)
    console.log('Entering email...');
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_USER.email);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: Enter wrong password
    console.log('Entering wrong password...');
    const passwordInput = page.locator('input[formcontrolname="password"][type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('11111111'); // Wrong password
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Step 5: Verify error message appears
    await page.waitForLoadState('networkidle');
    console.log('Checking for error message...');
    const errorMessage = page.locator('span.error.error--warning');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toHaveText('Wrong password. Try again');

    // Step 6: Verify input form shows error state
    console.log('Checking for form input error state...');
    const passwordInputWrapper = page.locator('.form-wrapper__input.form-wrapper__input--error');
    await expect(passwordInputWrapper).toBeVisible({ timeout: 10000 });
    
    console.log('Invalid credentials test completed successfully!');
  });

  test('should validate email format', async ({ page }) => {
    console.log('Starting email format validation test...');
    
    // Step 1: Click login link - flexible selector (same as working test)
    const loginLink = page.getByRole('link', { name: 'Log In' }).or(
      page.getByRole('link', { name: 'Login' })
    ).or(
      page.locator('a[href*="login"], a[href*="auth"], a:has-text("Log In"), a:has-text("Login")')
    );
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();

    // Step 2: Select email login method - flexible selector (same as working test)
    console.log('Selecting email login method...');
    await page.waitForLoadState('networkidle');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' }).or(
      page.getByRole('button', { name: 'Email' })
    );
    await expect(emailButton).toBeVisible({ timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    // Step 3: Enter invalid email format
    console.log('Entering invalid email format...');
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('fadlantestinginvalidemail');

    // Step 4: Verify email input shows error state
    console.log('Checking for email input error state...');
    await expect(emailInput).toHaveClass(/form-wrapper__input--error/);
    await expect(emailInput).toHaveClass(/ng-invalid/);

    // Step 5: Verify error message appears
    console.log('Checking for email error message...');
    const errorMessage = page.locator('span.error');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toHaveText('Email is invalid');

    // Step 6: Verify Continue button is disabled
    console.log('Checking Continue button is disabled...');
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await expect(continueButton).toBeDisabled();
    
    console.log('Email format validation test completed successfully!');
  });

  /**
   * Test: Forgot Password Flow
   * 
   * This test validates the complete forgot password functionality:
   * 1. Navigates through login flow to password input page
   * 2. Clicks the "Forgot password" button
   * 3. Verifies redirection to forgot password page
   * 4. Inputs email and submits reset request
   * 5. Validates success message: "The Link is sent successfully"
   * 
   * Key elements tested:
   * - button.forgot-button (Forgot password button)
   * - h5.head__heading (Page header validation)
   * - input[formcontrolname="email"][type="email"]#email (Email input)
   * - button[ui-button-fill-large][type="submit"] (Send Reset Link button)
   */
  test('should allow password reset flow', async ({ page }) => {
    console.log('Starting password reset flow...');
    
    // Step 1: Click login link - flexible selector (same as working test)
    const loginLink = page.getByRole('link', { name: 'Log In' }).or(
      page.getByRole('link', { name: 'Login' })
    ).or(
      page.locator('a[href*="login"], a[href*="auth"], a:has-text("Log In"), a:has-text("Login")')
    );
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();

    // Step 2: Select email login method - flexible selector (same as working test)
    console.log('Selecting email login method...');
    await page.waitForLoadState('networkidle');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' }).or(
      page.getByRole('button', { name: 'Email' })
    );
    await expect(emailButton).toBeVisible({ timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    // Step 3: Enter email (same as working test)
    console.log('Entering email...');
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_USER.email);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: Click forgot password button
    console.log('Clicking forgot password button...');
    const forgotPasswordButton = page.locator('button.forgot-button');
    await expect(forgotPasswordButton).toBeVisible({ timeout: 10000 });
    await forgotPasswordButton.click();

    // Step 5: Verify redirection to forgot password page
    console.log('Verifying forgot password page...');
    await page.waitForLoadState('networkidle');
    const forgotPasswordHeader = page.locator('h5.head__heading');
    await expect(forgotPasswordHeader).toBeVisible({ timeout: 10000 });
    await expect(forgotPasswordHeader).toHaveText('Forgot your password?');

    // Step 6: Input the same email in the forgot password form
    console.log('Entering email in forgot password form...');
    const resetEmailInput = page.locator('input[formcontrolname="email"][type="email"]#email');
    await resetEmailInput.waitFor({ state: 'visible', timeout: 10000 });
    await resetEmailInput.fill(TEST_USER.email);

    // Step 7: Click Send Reset Link button
    console.log('Clicking Send Reset Link button...');
    const sendResetLinkButton = page.locator('button[ui-button-fill-large][type="submit"]');
    await expect(sendResetLinkButton).toBeVisible({ timeout: 10000 });
    await expect(sendResetLinkButton).toContainText('Send reset link');
    await sendResetLinkButton.click();

    // Step 8: Wait 1 second for loading
    console.log('Waiting for loading...');
    await page.waitForTimeout(1000);

    // Step 9: Verify success message
    console.log('Verifying success message...');
    const successMessage = page.getByText('The Link is sent successfully');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    console.log('Password reset flow completed successfully!');
  });
}); 