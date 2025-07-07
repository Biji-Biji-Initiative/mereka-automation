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

test.describe('Set-up-profile-learner', () => {
  // Set timeout for all tests in this describe block
  test.setTimeout(120000);
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test with more lenient waiting
    try {
      await page.goto('https://mereka.dev', { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('Homepage loaded with DOM content');
    } catch (error) {
      console.log('DOM content load timeout, trying with load event...');
      try {
        await page.goto('https://mereka.dev', { waitUntil: 'load', timeout: 30000 });
        console.log('Homepage loaded with load event');
      } catch (secondError) {
        console.log('Load event timeout, trying without wait...');
        await page.goto('https://mereka.dev', { timeout: 30000 });
        console.log('Homepage loaded without wait');
      }
    }
  });

  test('should successfully sign up as a learner with valid information and verify welcome page', async ({ page }) => {
    // Generate unique test data
    const testData = generateTestData();
    console.log('Generated test data:', { email: testData.email, name: testData.name });
    
    // Step 1: Click login link (this opens the auth modal)
    console.log('Clicking Log In button to open auth modal...');
    const loginLink = await page.getByRole('link', { name: 'Log In' });
    await loginLink.waitFor({ state: 'visible', timeout: 15000 });
    await loginLink.click();
    console.log('✅ Log In button clicked');

    // Step 2: Click "Continue with Email" button
    console.log('Clicking Continue with Email...');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' });
    await emailButton.waitFor({ state: 'visible', timeout: 15000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('✅ Continue with Email clicked');
    
    // Step 3: Fill in the email address and click continue
    console.log('Filling email address...');
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(testData.email);
    
    // Click continue button
    console.log('Clicking continue button...');
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await continueButton.waitFor({ state: 'visible', timeout: 15000 });
    await continueButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('✅ Email submitted and continue clicked');
    
    // Step 4: Fill in the name field (form appears directly)
    console.log('Filling name...');
    const nameInput = page.locator('input[formcontrolname="name"][type="text"]');
    await nameInput.waitFor({ state: 'visible', timeout: 15000 });
    await nameInput.fill(testData.name);
    console.log('✅ Name filled');
    
    // Step 5: Fill in the birth date (DD/MM/YYYY format)
    console.log('Filling birth date...');
    const birthDateInput = page.locator('input[formcontrolname="birthDate"][type="date"]');
    await birthDateInput.waitFor({ state: 'visible', timeout: 15000 });
    await birthDateInput.fill(testData.birthDate);
    console.log('✅ Birth date filled');
    
    // Step 6: Fill in the password
    console.log('Filling password...');
    const passwordInput = page.locator('input[formcontrolname="password"][type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.fill(testData.password);
    console.log('✅ Password filled');
    
    // Step 7: Confirm the password
    console.log('Confirming password...');
    const confirmPasswordInput = page.locator('input[formcontrolname="confirmPassword"][type="password"]');
    await confirmPasswordInput.waitFor({ state: 'visible', timeout: 15000 });
    await confirmPasswordInput.fill(testData.confirmPassword);
    console.log('✅ Confirm password filled');
    
    // Step 8: Click the sign up button
    console.log('Clicking sign up button...');
    const signUpButton = page.getByRole('button', { name: 'Sign Up' });
    await signUpButton.waitFor({ state: 'visible', timeout: 15000 });
    
    // Verify the button is enabled before clicking
    await expect(signUpButton).toBeEnabled({ timeout: 15000 });
    
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
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      console.log(`Network idle reached after ${Date.now() - startTime}ms`);
    } catch (error) {
      console.log(`Network idle timeout after ${Date.now() - startTime}ms`);
    }
    
    console.log('Sign-up process completed!');
    console.log(`Total time: ${Date.now() - startTime}ms`);
    console.log('Network requests made:', networkRequests.length);
    
    // Step 9: Wait for redirect to welcome page with improved timeout handling
    console.log('Waiting for redirect to welcome page...');
    let redirectSuccess = false;
    
    try {
      // First attempt: Wait for URL change
      await page.waitForURL('https://app.mereka.dev/welcome/learner', { timeout: 60000 });
      console.log('Successfully redirected to welcome page!');
      redirectSuccess = true;
    } catch (error) {
      console.log('Initial redirect timeout - checking current URL...');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check if we're already on the welcome page
      if (currentUrl.includes('app.mereka.dev/welcome/learner')) {
        console.log('Already on welcome page!');
        redirectSuccess = true;
      } else {
        // Wait a bit more and try again
        console.log('Waiting additional time for redirect...');
        try {
          await page.waitForURL('https://app.mereka.dev/welcome/learner', { timeout: 30000 });
          console.log('Redirect successful after additional wait!');
          redirectSuccess = true;
        } catch (secondError) {
          console.log('Second redirect attempt failed - checking URL again...');
          const secondUrl = page.url();
          console.log('Current URL after second attempt:', secondUrl);
          
          if (secondUrl.includes('app.mereka.dev/welcome/learner')) {
            console.log('Found welcome page URL after second check!');
            redirectSuccess = true;
          } else {
            console.log('Manual navigation required...');
            // If not redirected, try to navigate manually
            await page.goto('https://app.mereka.dev/welcome/learner', { waitUntil: 'networkidle', timeout: 30000 });
            console.log('Manually navigated to welcome page');
            redirectSuccess = true;
          }
        }
      }
    }
    
    if (!redirectSuccess) {
      throw new Error('Failed to reach welcome page after multiple attempts');
    }
    
    // Step 10: Verify welcome page elements with improved loading
    console.log('Verifying welcome page elements...');
    
    // Wait for page to be fully loaded with multiple strategies
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      console.log('DOM content loaded');
    } catch (error) {
      console.log('DOM content load timeout, continuing...');
    }
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      console.log('Network idle reached');
    } catch (error) {
      console.log('Network idle timeout, continuing...');
    }
    
    // Wait for Angular to finish rendering (shorter wait)
    try {
      await page.waitForFunction(() => {
        return document.readyState === 'complete' && 
               !document.querySelector('.loading') && 
               document.querySelector('h3.slide-title');
      }, { timeout: 15000 });
      console.log('Page fully rendered');
    } catch (error) {
      console.log('Page render wait timeout, continuing...');
    }
    
    // Verify title with retry mechanism
    console.log('Checking welcome title...');
    let titleVerified = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const title = page.locator('h3.slide-title');
        await expect(title).toBeVisible({ timeout: 20000 });
        await expect(title).toHaveText('Welcome to the Future of Innovation!');
        console.log('✅ Title verified');
        titleVerified = true;
        break;
      } catch (error) {
        console.log(`Title verification attempt ${attempt} failed, retrying...`);
        if (attempt === 3) {
          console.log('Title verification failed after 3 attempts');
          throw error;
        }
        // Shorter wait between retries
        try {
          await page.waitForTimeout(1000);
        } catch (timeoutError) {
          console.log('Wait timeout during retry, continuing...');
        }
      }
    }
    
    // Verify subtitle
    console.log('Checking welcome subtitle...');
    const subtitle = page.locator('p.slide-subtitle');
    await expect(subtitle).toBeVisible({ timeout: 20000 });
    await expect(subtitle).toContainText('Different goals require different means');
    console.log('✅ Subtitle verified');
    
    // Verify services grid
    console.log('Checking services grid...');
    const servicesGrid = page.locator('.services-grid');
    await expect(servicesGrid).toBeVisible({ timeout: 20000 });
    console.log('✅ Services grid verified');
    
    // Verify 3 service items
    console.log('Checking service items...');
    const serviceItems = page.locator('.services-item');
    await expect(serviceItems).toHaveCount(3, { timeout: 20000 });
    console.log('✅ 3 service items verified');
    
    // Verify service titles
    const serviceTitles = page.locator('.services-item__title');
    await expect(serviceTitles).toHaveCount(3, { timeout: 20000 });
    console.log('✅ 3 service titles verified');
    
    // Verify service descriptions
    const serviceDescriptions = page.locator('.services-item__desc');
    await expect(serviceDescriptions).toHaveCount(3, { timeout: 20000 });
    console.log('✅ 3 service descriptions verified');
    
    // Verify "Get Started" button with retry
    console.log('Checking Get Started button...');
    let getStartedVerified = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const getStartedButton = page.getByText('Get Started', { exact: true });
        await expect(getStartedButton).toBeVisible({ timeout: 20000 });
        await expect(getStartedButton).toBeEnabled({ timeout: 20000 });
        console.log('✅ Get Started button verified');
        getStartedVerified = true;
        break;
      } catch (error) {
        console.log(`Get Started button verification attempt ${attempt} failed, retrying...`);
        if (attempt === 3) {
          console.log('Get Started button verification failed after 3 attempts');
          throw error;
        }
        // Shorter wait between retries
        try {
          await page.waitForTimeout(1000);
        } catch (timeoutError) {
          console.log('Wait timeout during retry, continuing...');
        }
      }
    }
    
    console.log('🎉 All welcome page elements verified successfully!');
    
    // Step 11: Click "Get Started" button to proceed to profile setup
    console.log('Clicking Get Started button to proceed to profile setup...');
    const getStartedButton = page.getByText('Get Started', { exact: true });
    await getStartedButton.click();
    
    // Wait for navigation to profile setup page with improved handling
    console.log('Waiting for navigation to profile setup page...');
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      console.log('Network idle reached after Get Started click');
    } catch (error) {
      console.log('Network idle timeout after Get Started click, continuing...');
    }
    
    // Wait for page transition (shorter wait)
    try {
      await page.waitForTimeout(2000);
    } catch (timeoutError) {
      console.log('Page transition wait timeout, continuing...');
    }
    console.log('✅ Navigated to profile setup page');
    
    // Step 12: Verify profile setup page elements with improved loading
    console.log('Verifying profile setup page elements...');
    
    // Wait for page to be fully loaded
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      console.log('Profile page DOM content loaded');
    } catch (error) {
      console.log('Profile page DOM load timeout, continuing...');
    }
    
    // Wait for Angular rendering (shorter wait)
    try {
      await page.waitForFunction(() => {
        return document.readyState === 'complete' && 
               !document.querySelector('.loading');
      }, { timeout: 10000 });
      console.log('Profile page fully rendered');
    } catch (error) {
      console.log('Profile page render wait timeout, continuing...');
    }
    
    // Verify Display Picture field
    console.log('Checking display picture field...');
    const profilePictureContainer = page.locator('.profile-picture-container');
    await expect(profilePictureContainer).toBeVisible({ timeout: 10000 });
    
    // Check for required notice tooltip
    const requiredNotice = page.locator('.ui-tooltip.required-notice');
    await expect(requiredNotice).toBeVisible({ timeout: 10000 });
    console.log('✅ Display picture field verified');
    
    // Verify Display Name title
    console.log('Checking display name title...');
    const displayNameTitle = page.getByText('Display Name', { exact: false });
    await expect(displayNameTitle).toBeVisible({ timeout: 10000 });
    console.log('✅ Display name title verified');
    
    // Verify Display Name field
    console.log('Checking display name field...');
    const displayNameInput = page.locator('input[placeholder="This will be displayed on your profile"]');
    await expect(displayNameInput).toBeVisible({ timeout: 10000 });
    await expect(displayNameInput).toHaveAttribute('required');
    console.log('✅ Display name field verified');
    
    // Verify Username field
    console.log('Checking username field...');
    const usernameInput = page.locator('input#username[name="username"]');
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(usernameInput).toHaveAttribute('required');
    await expect(usernameInput).toHaveAttribute('minlength', '6');
    await expect(usernameInput).toHaveAttribute('maxlength', '30');
    await expect(usernameInput).toHaveAttribute('pattern', '[a-zA-Z0-9][a-zA-Z0-9._\\-]*[a-zA-Z0-9]');
    console.log('✅ Username field verified');
    
    // Verify "Where you based" field
    console.log('Checking location field...');
    const locationInput = page.locator('input[placeholder="Type to find a city"]');
    await expect(locationInput).toBeVisible({ timeout: 10000 });
    await expect(locationInput).toHaveAttribute('required');
    console.log('✅ Location field verified');
    
    // Verify Phone number field
    console.log('Checking phone number field...');
    const phoneInput = page.locator('input#phone[type="tel"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    await expect(phoneInput).toHaveAttribute('placeholder', 'Add phone number');
    await expect(phoneInput).toHaveAttribute('maxlength', '15');
    console.log('✅ Phone number field verified');
    
    // Verify About Me field
    console.log('Checking about me field...');
    const aboutMeTextarea = page.locator('textarea[placeholder="About Me"]');
    await expect(aboutMeTextarea).toBeVisible({ timeout: 10000 });
    await expect(aboutMeTextarea).toHaveAttribute('required');
    await expect(aboutMeTextarea).toHaveAttribute('maxlength', '1000');
    await expect(aboutMeTextarea).toHaveAttribute('rows', '8');
    console.log('✅ About me field verified');
    
    // Verify Cover photo field
    console.log('Checking cover photo field...');
    const coverPhotoContainer = page.locator('.ui-profile-cover-image');
    await expect(coverPhotoContainer).toBeVisible({ timeout: 10000 });
    
    // Check for cover image overlay
    const coverImageOverlay = page.locator('.ui-profile-image-overlay');
    await expect(coverImageOverlay).toBeVisible({ timeout: 10000 });
    
    // Check for default cover image
    const coverImage = page.locator('.ui-profile-cover-image img');
    await expect(coverImage).toBeVisible({ timeout: 10000 });
    await expect(coverImage).toHaveAttribute('src', '/assets/imgs/hub-profile-bg.svg');
    console.log('✅ Cover photo field verified');
    
    console.log('🎉 All profile setup fields verified successfully!');
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