import { test, expect } from '@playwright/test';

/**
 * Expertise Collection Tests
 * 
 * IMPORTANT: These tests require proper environment setup to run correctly.
 * 
 * How to run these tests:
 * 1. Use the PowerShell script: ./test-live.ps1
 * 2. Or set environment variable manually: $env:TEST_ENV = "dev"; npx playwright test expertise/expertise-collection/expertise-collection.spec.ts --headed
 * 
 * Test Requirements:
 * - User must be logged in first
 * - Tests navigation to expertise collection page
 * - Validates expertise cards display correctly
 * - Verifies all required elements are present
 */

// Test data - using same credentials as login tests
const TEST_USER = {
  email: 'testingmereka01@gmail.com',
  password: 'merekamereka'
};

test.describe('Expertise Collection Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  /**
   * Test: Complete Expertise Collection Flow
   * 
   * This test validates the complete expertise collection functionality:
   * 1. User logs in successfully
   * 2. Navigates to book expertise section on home page
   * 3. Clicks "View all Expertise" button
   * 4. Verifies redirection to expertise collection page
   * 5. Validates main heading and category sections
   * 6. Verifies expertise cards contain all required elements
   * 
   * Key elements tested:
   * - Login flow integration
   * - Navigation to expertise collection
   * - Main heading: "Explore Services offered by our Experts"
   * - Category sections (e.g., "Career & Business")
   * - Expertise cards: image, title, price, description, duration
   */
  test('should successfully navigate to expertise collection and verify all elements', async ({ page }) => {
    console.log('🚀 Starting complete expertise collection flow...');
    
    // ===============================
    // STEP 1: LOGIN FLOW
    // ===============================
    console.log('🔐 Starting login flow...');
    
    // Click login link - flexible selector
    const loginLink = page.getByRole('link', { name: 'Log In' }).or(
      page.getByRole('link', { name: 'Login' })
    ).or(
      page.locator('a[href*="login"], a[href*="auth"], a:has-text("Log In"), a:has-text("Login")')
    );
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();

    // Select email login method
    console.log('📧 Selecting email login method...');
    await page.waitForLoadState('networkidle');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' }).or(
      page.getByRole('button', { name: 'Email' })
    );
    await expect(emailButton).toBeVisible({ timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    // Enter email
    console.log('✉️ Entering email...');
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_USER.email);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Enter password
    console.log('🔑 Entering password...');
    const passwordInput = page.locator('input[formcontrolname="password"][type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify successful login by waiting for navigation back to home page
    console.log('🔄 Waiting for login completion...');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for either the URL to return to home or find login indicators
    try {
      // Option 1: Wait for URL to be back at home page (not login/auth pages)
      await page.waitForURL(/^(?!.*\/(login|auth|silent-login)).*$/, { timeout: 20000 });
      console.log('✅ Login successful - redirected from auth pages!');
    } catch (urlError) {
      // Option 2: Look for login success indicators if URL doesn't change
      const loginSuccessIndicators = page.locator('[class*="profile"], [class*="user"], [class*="menu"], [class*="avatar"]').or(
        page.getByText('Welcome').or(page.getByText('Dashboard'))
      );
      await expect(loginSuccessIndicators.first()).toBeVisible({ timeout: 10000 });
      console.log('✅ Login successful - login indicators found!');
    }

    // ===============================
    // STEP 2: NAVIGATE TO EXPERTISE SECTION
    // ===============================
    console.log('🎯 Navigating to book expertise section...');
    
    // Find expertise section heading
    const expertiseHeading = page.locator('h2.section-heading').filter({ 
      hasText: /book their.*Expertise/i 
    });
    await expertiseHeading.scrollIntoViewIfNeeded();
    await expect(expertiseHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Expertise section found on home page');

    // Wait for expertise cards to load
    const expertiseCards = page.locator('[ui-card-expertise]');
    await expect(expertiseCards.first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Expertise cards loaded on home page');

    // ===============================
    // STEP 3: CLICK VIEW ALL EXPERTISE
    // ===============================
    console.log('🔍 Clicking "View all Expertise" button...');
    
    const viewAllExpertiseButton = page.getByRole('link', { name: 'View all Expertise' });
    await expect(viewAllExpertiseButton).toBeVisible({ timeout: 10000 });
    await viewAllExpertiseButton.click();

    // ===============================
    // STEP 4: VERIFY REDIRECTION
    // ===============================
    console.log('🌐 Verifying redirection to expertise collection page...');
    
    // Wait for navigation using URL change instead of networkidle
    await page.waitForURL(/.*\/expertise/, { timeout: 15000 });
    // Wait for DOM content to be ready
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Successfully redirected to expertise collection page');

    // ===============================
    // STEP 5: VERIFY MAIN HEADING
    // ===============================
    console.log('📋 Verifying main heading...');
    
    const mainHeading = page.locator('h1').filter({ 
      hasText: /Explore Services offered by our Experts/i 
    });
    await expect(mainHeading).toBeVisible({ timeout: 10000 });
    await expect(mainHeading).toHaveText('Explore Services offered by our Experts');
    console.log('✅ Main heading verified: "Explore Services offered by our Experts"');

    // ===============================
    // STEP 6: VERIFY CATEGORY SECTIONS
    // ===============================
    console.log('📂 Verifying category sections...');
    
    // Look for category headings (h2 elements)
    const categoryHeadings = page.locator('h2');
    await expect(categoryHeadings.first()).toBeVisible({ timeout: 10000 });
    
    // Verify at least one category section appears (like "Career & Business")
    const categoryCount = await categoryHeadings.count();
    console.log(`✅ Found ${categoryCount} category sections`);
    
    if (categoryCount > 0) {
      const firstCategoryText = await categoryHeadings.first().textContent();
      console.log(`✅ First category section: "${firstCategoryText}"`);
    }

    // ===============================
    // STEP 7: VERIFY EXPERTISE CARDS
    // ===============================
    console.log('🃏 Verifying expertise cards...');
    
    // Wait for expertise cards to load
    const expertiseCardsCollection = page.locator('[ui-card-expertise]');
    await expect(expertiseCardsCollection.first()).toBeVisible({ timeout: 15000 });
    
    const cardCount = await expertiseCardsCollection.count();
    let filteredCardCount = 0; // Initialize for later use in summary
    console.log(`✅ Found ${cardCount} expertise cards`);
    
    if (cardCount === 0) {
      throw new Error('❌ CRITICAL: No expertise cards found on collection page!');
    }

    // Test first expertise card in detail
    const firstCard = expertiseCardsCollection.first();
    await firstCard.scrollIntoViewIfNeeded();

    // ===============================
    // STEP 8: VERIFY CARD ELEMENTS
    // ===============================
    console.log('🔍 Verifying card elements...');
    
    // Verify image appears
    console.log('🖼️ Checking card image...');
    const cardImage = firstCard.locator('img.ui-image');
    await expect(cardImage).toBeVisible({ timeout: 10000 });
    
    // Verify image src is loaded
    const imageSrc = await cardImage.getAttribute('src');
    if (!imageSrc || imageSrc.trim() === '') {
      throw new Error('❌ Card image src is empty!');
    }
    console.log('✅ Card image verified');

    // Verify title section shows up
    console.log('📝 Checking card title...');
    const cardTitle = firstCard.locator('h3.ui-card-title a');
    await expect(cardTitle).toBeVisible({ timeout: 10000 });
    
    const titleText = await cardTitle.textContent();
    if (!titleText || titleText.trim() === '') {
      throw new Error('❌ Card title is empty!');
    }
    console.log(`✅ Card title verified: "${titleText}"`);

    // Verify price appears on card
    console.log('💰 Checking card price...');
    const cardPrice = firstCard.locator('.ui-card-price');
    await expect(cardPrice).toBeVisible({ timeout: 10000 });
    
    const priceAmount = firstCard.locator('.ui-card-price__amount');
    await expect(priceAmount).toBeVisible({ timeout: 10000 });
    
    const priceText = await priceAmount.textContent();
    if (!priceText || priceText.trim() === '') {
      throw new Error('❌ Card price is empty!');
    }
    console.log(`✅ Card price verified: "${priceText}"`);

    // Verify card description appears
    console.log('📄 Checking card description...');
    const cardDescription = firstCard.locator('p.ui-card-desc');
    await expect(cardDescription).toBeVisible({ timeout: 10000 });
    
    const descriptionText = await cardDescription.textContent();
    if (!descriptionText || descriptionText.trim() === '') {
      throw new Error('❌ Card description is empty!');
    }
    console.log(`✅ Card description verified: "${descriptionText.substring(0, 50)}..."`);

    // Verify duration appears
    console.log('⏱️ Checking card duration...');
    const durationElement = firstCard.locator('.ui-card-meta').first();
    await expect(durationElement).toBeVisible({ timeout: 10000 });
    
    // Check for duration text (could be "30 mins", "1 hour", etc.)
    const durationText = await durationElement.textContent();
    if (!durationText || durationText.trim() === '') {
      throw new Error('❌ Card duration is empty!');
    }
    console.log(`✅ Card duration verified: "${durationText}"`);

    // ===============================
    // STEP 9: TEST CATEGORY FILTER
    // ===============================
    console.log('🏷️ Testing category filter functionality...');
    
    // Click the second tab (Coach category)
    console.log('🎯 Clicking the second category tab (Coach)...');
    const secondCategoryTab = page.locator('#category-tab-coach');
    await expect(secondCategoryTab).toBeVisible({ timeout: 10000 });
    await secondCategoryTab.click();
    
    // Wait for filter to apply
    console.log('⏳ Waiting for category filter to apply...');
    await page.waitForTimeout(2000); // Give time for filtering
    
    // Verify that the second tab is now active
    console.log('✅ Verifying active tab state...');
    await expect(secondCategoryTab).toHaveClass(/category-tab-item-active/);
    console.log('✅ Coach category tab is now active');
    
    // Check if cards still show up after filtering
    console.log('🃏 Verifying expertise cards after category filter...');
    const filteredCards = page.locator('[ui-card-expertise]');
    
    // Wait for cards to load (they might reload/filter)
    await expect(filteredCards.first()).toBeVisible({ timeout: 10000 });
    
    filteredCardCount = await filteredCards.count();
    console.log(`✅ Found ${filteredCardCount} expertise cards in Coach category`);
    
    if (filteredCardCount === 0) {
      console.log('ℹ️ No cards found in Coach category - this might be expected if no coach expertise exists');
    } else {
      // Verify first filtered card still has required elements
      const firstFilteredCard = filteredCards.first();
      await firstFilteredCard.scrollIntoViewIfNeeded();
      
      console.log('🔍 Verifying filtered card elements...');
      await expect(firstFilteredCard.locator('img.ui-image')).toBeVisible({ timeout: 5000 });
      await expect(firstFilteredCard.locator('h3.ui-card-title a')).toBeVisible({ timeout: 5000 });
      await expect(firstFilteredCard.locator('.ui-card-price')).toBeVisible({ timeout: 5000 });
      await expect(firstFilteredCard.locator('p.ui-card-desc')).toBeVisible({ timeout: 5000 });
      await expect(firstFilteredCard.locator('.ui-card-meta').first()).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Filtered card elements verified successfully');
    }
    
    console.log('🎉 Category filter test completed successfully!');

    // ===============================
    // STEP 10: FINAL VERIFICATION
    // ===============================
    console.log('🎉 Final verification...');
    
    // Verify multiple cards if available (use current filtered card count)
    const currentCards = page.locator('[ui-card-expertise]');
    const currentCardCount = await currentCards.count();
    
    if (currentCardCount > 1) {
      console.log('🔄 Verifying additional cards...');
      
      for (let i = 1; i < Math.min(currentCardCount, 3); i++) {
        const card = currentCards.nth(i);
        await card.scrollIntoViewIfNeeded();
        
        // Basic verification for additional cards
        await expect(card.locator('img.ui-image')).toBeVisible({ timeout: 5000 });
        await expect(card.locator('h3.ui-card-title a')).toBeVisible({ timeout: 5000 });
        await expect(card.locator('.ui-card-price')).toBeVisible({ timeout: 5000 });
        
        console.log(`✅ Card ${i + 1} verified`);
      }
    }

    console.log('🎊 All expertise collection elements verified successfully!');
    console.log('📊 Test Summary:');
    console.log(`   - Login: ✅ Successful`);
    console.log(`   - Navigation: ✅ Redirected to /expertise`);
    console.log(`   - Main heading: ✅ Verified`);
    console.log(`   - Category sections: ✅ ${categoryCount} found`);
    console.log(`   - Expertise cards: ✅ ${cardCount} found`);
    console.log(`   - Card elements: ✅ All verified (image, title, price, description, duration)`);
    console.log(`   - Category filter: ✅ Coach tab tested and verified`);
    console.log(`   - Filtered cards: ✅ ${filteredCardCount} found after filtering`);
    console.log('🎯 Test completed successfully!');
  });
}); 