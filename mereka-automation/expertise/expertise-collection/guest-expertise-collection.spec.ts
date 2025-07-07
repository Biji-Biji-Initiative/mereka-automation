import { test, expect } from '@playwright/test';

/**
 * Guest Expertise Collection Tests
 * 
 * IMPORTANT: These tests require proper environment setup to run correctly.
 * 
 * How to run these tests:
 * 1. Use the PowerShell script: ./test-live.ps1
 * 2. Or set environment variable manually: $env:TEST_ENV = "dev"; npx playwright test expertise/expertise-collection/guest-expertise-collection.spec.ts --headed
 * 
 * Test Requirements:
 * - No login required (guest access)
 * - Tests direct navigation to expertise collection page
 * - Validates expertise cards display correctly
 * - Verifies all required elements are present
 */

test.describe('Guest Expertise Collection Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the expertise collection page
    await page.goto('/expertise');
  });

  /**
   * Test: Guest Expertise Collection Access
   * 
   * This test validates the expertise collection functionality for guest users:
   * 1. Navigates directly to expertise collection page
   * 2. Validates main heading and category sections
   * 3. Verifies expertise cards contain all required elements
   * 4. Tests category filter functionality
   * 
   * Key elements tested:
   * - Direct navigation to expertise collection
   * - Main heading: "Explore Services offered by our Experts"
   * - Category sections (e.g., "Career & Business")
   * - Expertise cards: image, title, price, description, duration
   * - Category filter functionality
   */
  test('should display expertise collection correctly for guest users', async ({ page }) => {
    console.log('🚀 Starting guest expertise collection flow...');
    
    // ===============================
    // STEP 1: VERIFY PAGE LOAD
    // ===============================
    console.log('🌐 Verifying expertise collection page loads...');
    
    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we're on the expertise page
    await expect(page).toHaveURL(/.*\/expertise/);
    console.log('✅ Successfully loaded expertise collection page');

    // ===============================
    // STEP 2: VERIFY MAIN HEADING
    // ===============================
    console.log('📋 Verifying main heading...');
    
    const mainHeading = page.locator('h1').filter({ 
      hasText: /Explore Services offered by our Experts/i 
    });
    await expect(mainHeading).toBeVisible({ timeout: 10000 });
    await expect(mainHeading).toHaveText('Explore Services offered by our Experts');
    console.log('✅ Main heading verified: "Explore Services offered by our Experts"');

    // ===============================
    // STEP 3: VERIFY CATEGORY SECTIONS
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
    // STEP 4: VERIFY EXPERTISE CARDS
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
    // STEP 5: VERIFY CARD ELEMENTS
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
    // STEP 6: TEST CATEGORY FILTER
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
    // STEP 7: FINAL VERIFICATION
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
    console.log(`   - Direct navigation: ✅ Successful`);
    console.log(`   - Page load: ✅ /expertise loaded`);
    console.log(`   - Main heading: ✅ Verified`);
    console.log(`   - Category sections: ✅ ${categoryCount} found`);
    console.log(`   - Expertise cards: ✅ ${cardCount} found`);
    console.log(`   - Card elements: ✅ All verified (image, title, price, description, duration)`);
    console.log(`   - Category filter: ✅ Coach tab tested and verified`);
    console.log(`   - Filtered cards: ✅ ${filteredCardCount} found after filtering`);
    console.log('🎯 Guest test completed successfully!');
  });
}); 