import { test, expect } from '@playwright/test';

/**
 * Helper to log all matching elements' text for debugging
 * @param page Playwright page
 * @param selector CSS selector
 * @param label Label for logging
 */
async function logElementsText(page, selector, label) {
  const texts = await page.locator(selector).allTextContents();
  console.log(`Found ${label}:`, texts);
}

// Test data
const TEST_USER = {
  email: 'testingmereka01@gmail.com',
  password: 'merekamereka'
};

test.describe('Home to Experience Redirection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should successfully navigate to experiences section after login', async ({ page }) => {
    console.log('Starting login flow with valid credentials...');
    
    // Step 1: Click login link
    const loginLink = await page.getByRole('link', { name: 'Log In' });
    await loginLink.waitFor({ state: 'visible', timeout: 10000 });
    await loginLink.click();

    // Step 2: Select email login method
    console.log('Selecting email login method...');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' });
    await emailButton.waitFor({ state: 'visible', timeout: 10000 });
    await emailButton.click();

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
    
    // Wait for and click Sign In button
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    await signInButton.waitFor({ state: 'visible', timeout: 10000 });
    await signInButton.click();

    // Step 5: Verify successful login and navigate to Experiences section
    console.log('Login successful!');
    const experiencesSection = page.locator('span.heading-accent:has-text("Experiences")');
    await experiencesSection.waitFor({ state: 'visible', timeout: 10000 });
    await experiencesSection.scrollIntoViewIfNeeded();
    await expect(experiencesSection).toBeVisible();

    // Step 6: Click on one of the experience cards
    console.log('Looking for experience cards...');
    const experienceCard = page.locator('div[ui-card-experience].ui-card-experience.ui-card').first();
    await experienceCard.waitFor({ state: 'visible', timeout: 10000 });
    await experienceCard.scrollIntoViewIfNeeded();
    await experienceCard.click();

    // Step 7: Verify navigation to experience detail page
    console.log('Navigating to experience detail page...');
    await page.waitForURL('**/experience/**', { timeout: 15000 });
    await expect(page.url()).toContain('/experience/');
  });
}); 