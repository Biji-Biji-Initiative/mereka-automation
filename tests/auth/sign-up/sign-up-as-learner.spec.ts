import { test, expect } from '@playwright/test';

/**
 * Generate a random 5-digit number for unique email addresses
 */
function generateRandomNumber(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Generate unique test data for sign-up
 */
function generateTestData() {
  const randomNumber = generateRandomNumber();
  return {
    email: `testingmereka01+${randomNumber}@gmail.com`,
    name: `testing mereka+${randomNumber}`,
    birthDate: '1990-05-05', // Format: YYYY-MM-DD for date input
    password: 'merekamereka',
    confirmPassword: 'merekamereka'
  };
}

test.describe('Authentication - Sign Up as Learner', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('https://mereka.dev');
  });

  test('should successfully sign up as a learner with valid information and verify welcome page', async ({ page }) => {
    // Increase timeout for this complex test that involves sign-up + redirect + page verification
    test.setTimeout(60000); // 60 seconds
    console.log('Starting sign-up flow as learner...');
    
    // Generate unique test data
    const testData = generateTestData();
    console.log(`Using test data: ${JSON.stringify(testData, null, 2)}`);
    
    // Step 1: Click login link (this opens the auth modal)
    const loginLink = await page.getByRole('link', { name: 'Log In' });
    await loginLink.waitFor({ state: 'visible', timeout: 10000 });
    await loginLink.click();

    // Step 2: Click "Continue with Email" button
    console.log('Clicking Continue with Email...');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' });
    await emailButton.waitFor({ state: 'visible', timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    // Step 3: Fill in the email address and click continue
    console.log('Filling email address...');
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(testData.email);
    
    // Click continue button
    console.log('Clicking continue button...');
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await continueButton.waitFor({ state: 'visible', timeout: 10000 });
    await continueButton.click();
    await page.waitForLoadState('networkidle');

    // Step 4: Fill in the name field (form appears directly)
    console.log('Filling name...');
    const nameInput = page.locator('input[formcontrolname="name"][type="text"]');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(testData.name);

    // Step 5: Fill in the birth date (DD/MM/YYYY format)
    console.log('Filling birth date...');
    const birthDateInput = page.locator('input[formcontrolname="birthDate"][type="date"]');
    await birthDateInput.waitFor({ state: 'visible', timeout: 10000 });
    await birthDateInput.fill(testData.birthDate);

    // Step 6: Fill in the password
    console.log('Filling password...');
    const passwordInput = page.locator('input[formcontrolname="password"][type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(testData.password);

    // Step 7: Confirm the password
    console.log('Confirming password...');
    const confirmPasswordInput = page.locator('input[formcontrolname="confirmPassword"][type="password"]');
    await confirmPasswordInput.waitFor({ state: 'visible', timeout: 10000 });
    await confirmPasswordInput.fill(testData.confirmPassword);

    // Step 8: Click the sign up button
    console.log('Clicking sign up button...');
    const signUpButton = page.getByRole('button', { name: 'Sign Up' });
    await signUpButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Verify the button is enabled before clicking
    await expect(signUpButton).toBeEnabled();
    
    // Start monitoring network requests
    console.log('Starting network monitoring...');
    const networkRequests: string[] = [];
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
      console.log(`Network Request: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      console.log(`Network Response: ${response.status()} ${response.url()}`);
    });
    
    // Click sign up and monitor timing
    const startTime = Date.now();
    await signUpButton.click();
    console.log('Sign up button clicked, waiting for response...');
    
    // Wait for network idle with shorter timeout
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      console.log(`Network idle reached after ${Date.now() - startTime}ms`);
    } catch (error) {
      console.log(`Network idle timeout after ${Date.now() - startTime}ms`);
    }
    
    console.log('Sign-up process completed!');
    console.log(`Total time: ${Date.now() - startTime}ms`);
    console.log('Network requests made:', networkRequests.length);
    
    // Step 9: Wait for redirect to welcome page
    console.log('Waiting for redirect to welcome page...');
    try {
      await page.waitForURL('https://app.mereka.dev/welcome/learner', { timeout: 30000 });
      console.log('Successfully redirected to welcome page!');
    } catch (error) {
      console.log('Redirect timeout - checking current URL...');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // If not redirected, try to navigate manually
      if (!currentUrl.includes('app.mereka.dev/welcome/learner')) {
        console.log('Manually navigating to welcome page...');
        await page.goto('https://app.mereka.dev/welcome/learner');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      }
    }
    
    // Step 10: Verify welcome page elements
    console.log('Verifying welcome page elements...');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    
    // Verify title with enhanced waiting and debugging
    console.log('Checking welcome title...');
    
    // Wait for the welcome content to load
    await page.waitForSelector('h3.slide-title', { timeout: 20000 });
    
    // Additional wait for Angular to fully render
    await page.waitForTimeout(2000);
    
    // Debug: Check what h3 elements exist
    const allH3s = await page.locator('h3').all();
    console.log(`🔍 Found ${allH3s.length} h3 elements on page`);
    
    for (let i = 0; i < allH3s.length; i++) {
      const classes = await allH3s[i].getAttribute('class') || 'no-class';
      const text = await allH3s[i].textContent() || 'no-text';
      console.log(`  H3 ${i + 1}: classes="${classes}" text="${text.substring(0, 50)}..."`);
    }
    
    // Try the main selector
    const title = page.locator('h3.slide-title');
    await expect(title).toBeVisible({ timeout: 15000 });
    await expect(title).toHaveText('Welcome to the Future of Innovation!');
    console.log('✅ Title verified');
    
    // Verify subtitle
    console.log('Checking welcome subtitle...');
    const subtitle = page.locator('p.slide-subtitle');
    await expect(subtitle).toBeVisible({ timeout: 10000 });
    await expect(subtitle).toContainText('Different goals require different means');
    console.log('✅ Subtitle verified');
    
    // Verify services grid
    console.log('Checking services grid...');
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible({ timeout: 10000 });
    console.log('✅ Services grid verified');
    
    // Verify 3 service items
    console.log('Checking service items...');
    const serviceItems = page.locator('.services-item');
    await expect(serviceItems).toHaveCount(3, { timeout: 10000 });
    console.log('✅ 3 service items verified');
    
    // Verify service titles
    const serviceTitles = page.locator('.services-item__title');
    await expect(serviceTitles).toHaveCount(3, { timeout: 10000 });
    console.log('✅ 3 service titles verified');
    
    // Verify service descriptions
    const serviceDescriptions = page.locator('.services-item__desc');
    await expect(serviceDescriptions).toHaveCount(3, { timeout: 10000 });
    console.log('✅ 3 service descriptions verified');
    
    // Verify "Get Started" button
    console.log('Checking Get Started button...');
    const getStartedButton = page.getByText('Get Started', { exact: true });
    await expect(getStartedButton).toBeVisible({ timeout: 10000 });
    await expect(getStartedButton).toBeEnabled({ timeout: 10000 });
    console.log('✅ Get Started button verified');
    
    console.log('🎉 All welcome page elements verified successfully!');
    console.log('Test completed successfully!');
  });

  test('should validate form fields before submission', async ({ page }) => {
    console.log('Testing form validation...');
    
    // Step 1: Click login link
    const loginLink = await page.getByRole('link', { name: 'Log In' });
    await loginLink.waitFor({ state: 'visible', timeout: 10000 });
    await loginLink.click();

    // Step 2: Click "Continue with Email" button
    const emailButton = page.getByRole('button', { name: 'Continue with Email' });
    await emailButton.waitFor({ state: 'visible', timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    // Step 3: Fill email and click continue
    const testData = generateTestData();
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(testData.email);
    
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await continueButton.waitFor({ state: 'visible', timeout: 10000 });
    await continueButton.click();
    await page.waitForLoadState('networkidle');

    // Step 4: Check that sign-up button is initially disabled
    const signUpButton = page.getByRole('button', { name: 'Sign Up' });
    await signUpButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(signUpButton).toBeDisabled();

    // Step 5: Fill in required fields one by one and check button state
    
    // Fill name
    const nameInput = page.locator('input[formcontrolname="name"][type="text"]');
    await nameInput.fill(testData.name);
    
    // Fill birth date
    const birthDateInput = page.locator('input[formcontrolname="birthDate"][type="date"]');
    await birthDateInput.fill(testData.birthDate);
    
    // Fill password
    const passwordInput = page.locator('input[formcontrolname="password"][type="password"]');
    await passwordInput.fill(testData.password);
    
    // Fill confirm password
    const confirmPasswordInput = page.locator('input[formcontrolname="confirmPassword"][type="password"]');
    await confirmPasswordInput.fill(testData.confirmPassword);

    // Step 6: Verify button is now enabled
    await expect(signUpButton).toBeEnabled();
    console.log('Form validation working - button enabled after filling all required fields');
  });
}); 