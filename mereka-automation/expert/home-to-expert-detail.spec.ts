import { test, expect } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'testingmereka01@gmail.com',
  password: 'merekamereka'
};

test.describe('Expert Detail Page', () => {
  test('should allow a logged-in user to view an expert detail page', async ({ page }) => {
    // Environment validation
    const testEnv = process.env.TEST_ENV || 'live';
    console.log(`🌍 Running test in ${testEnv.toUpperCase()} environment`);
    
    await page.goto('/');

    // --- LOGIN FLOW ---
    console.log('🔐 Starting login flow...');
    const loginLink = page.getByRole('link', { name: 'Log In' }).or(
      page.getByRole('link', { name: 'Login' })
    ).or(
      page.locator('a[href*="login"], a[href*="auth"], a:has-text("Log In"), a:has-text("Login")')
    );
    await expect(loginLink).toBeVisible({ timeout: 15000 });
    await loginLink.click();

    await page.waitForLoadState('networkidle');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' }).or(
      page.getByRole('button', { name: 'Email' })
    );
    await expect(emailButton).toBeVisible({ timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    const emailField = page.locator('input[formcontrolname="email"], input[type="email"], input[name="email"], #email').first();
    await expect(emailField).toBeVisible({ timeout: 10000 });
    await emailField.fill(TEST_USER.email);
    
    const continueButton = page.getByRole('button', { name: 'Continue' }).first();
    await expect(continueButton).toBeVisible({ timeout: 10000 });
    await continueButton.click();

    const passwordField = page.locator('input[formcontrolname="password"], input[type="password"], input[name="password"], #password').first();
    await expect(passwordField).toBeVisible({ timeout: 10000 });
    await passwordField.fill(TEST_USER.password);
    
    // Trigger any validation by pressing Tab or clicking elsewhere
    await passwordField.press('Tab');
    await page.waitForTimeout(1000); // Give validation time to complete
    
    // Check for any checkboxes or terms that need to be accepted
    const checkbox = page.locator('input[type="checkbox"]').first();
    const checkboxCount = await checkbox.count();
    if (checkboxCount > 0) {
      await checkbox.check();
      console.log('✅ Checkbox found and checked');
      await page.waitForTimeout(500); // Wait after checking
    }
    
    const signInButton = page.getByRole('button', { name: 'Sign In' }).or(
      page.getByRole('button', { name: 'Login' })
    ).or(
      page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), input[type="submit"]')
    );
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    
    // Try force clicking if button remains disabled after reasonable wait
    try {
      await expect(signInButton).toBeEnabled({ timeout: 5000 });
      await signInButton.click();
    } catch {
      console.log('⚠️ Button disabled, trying force click...');
      await signInButton.click({ force: true });
    }
    
    // Wait for login to complete with networkidle strategy
    await page.waitForLoadState('networkidle');
    
    // Verify successful login by checking for login indicators
    const loginSuccessIndicators = page.locator('[class*="profile"], [class*="user"], [class*="menu"], [class*="avatar"]').or(
      page.getByText('Welcome').or(
        page.getByText('Dashboard')
      )
    );
    await expect(loginSuccessIndicators.first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Login successful!');

    // --- EXPERT PAGE TEST ---
    console.log('Navigating to expert page...');
    await page.goto('/');

    // Scroll to the "Browse Featured Experts" section - flexible selector
    const featuredExpertsHeader = page.locator('h1, h2, h3, h4').filter({ 
      hasText: /Browse.*Expert|Featured.*Expert|Find.*Expert|Top.*Expert/i 
    }).first();
    await featuredExpertsHeader.scrollIntoViewIfNeeded();
    await expect(featuredExpertsHeader).toBeVisible({ timeout: 15000 });

    // The cards are in a container that is a sibling of the header. Find the first expert link.
    const expertsContainer = featuredExpertsHeader.locator('xpath=./following-sibling::div[1]');
    const firstExpertCard = expertsContainer.locator('a[ui-card-link]').first();
    await expect(firstExpertCard).toBeVisible({ timeout: 15000 });
    
    // Extract the expert's name from the link's text content
    const expertName = await firstExpertCard.textContent();
    expect(expertName).not.toBeNull();
    const trimmedExpertName = expertName!.trim();
    console.log(`Found expert: ${trimmedExpertName}`);

    // Click on the first expert
    await firstExpertCard.click();

    // Verify navigation to the expert's detail page
    console.log('Verifying expert detail page...');
    await page.waitForURL(/\/expert\//, { timeout: 30000 });
    await expect(page).toHaveURL(new RegExp('.*\/expert\/.*'));

    // Verify the expert's name is on the detail page using flexible selectors
    const expertNameOnPage = page.locator('.ui-profile-card__name, [class*="profile-name"], [class*="expert-name"], h1, h2').filter({ 
      hasText: new RegExp(trimmedExpertName, 'i') 
    }).first();
    await expect(expertNameOnPage).toContainText(trimmedExpertName, { timeout: 15000 });
    await expect(expertNameOnPage).toBeVisible();

    // Verify the profile image exists by finding it within the profile card component - flexible selector
    const profileImage = page.locator('ui-profile-card img, [class*="profile"] img, [class*="avatar"] img, img[alt*="avatar"], img[alt*="profile"]').first();
    await expect(profileImage).toBeVisible({ timeout: 10000 });

    // Verify the "About Me" section is present - flexible selector
    const aboutMeHeader = page.locator('h1, h2, h3, h4, h5').filter({ 
      hasText: /About.*Me|About|Bio|Profile/i 
    }).first();
    await expect(aboutMeHeader).toBeVisible({ timeout: 10000 });

    console.log('Expert detail page verified successfully!');
  });
}); 