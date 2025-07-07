import { test, expect } from '@playwright/test';

test.describe('Home Page Elements', () => {
  test('should display all key elements in a single flow', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // 1. Verify Hero Section - exact selector
    const heroHeading = page.locator('h1').filter({ 
      hasText: /Book Leading Experts & Services/i 
    }).first();
    await expect(heroHeading).toBeVisible({ timeout: 10000 });
    
    // Wait for animation to load instead of hardcoded timeout
    const lottieAnimation = page.locator('ng-lottie > div > svg');
    await expect(lottieAnimation).toBeVisible({ timeout: 10000 });

    // 2. Verify Featured Experts Section - exact selector
    const expertsHeading = page.locator('h2').filter({ 
      hasText: /Browse Featured Experts/i 
    }).first();
    await expertsHeading.scrollIntoViewIfNeeded();
    await expect(expertsHeading).toBeVisible({ timeout: 10000 });
    
    const firstExpertCard = page.locator('div[ui-card-expert]').first();
    await expect(firstExpertCard).toBeVisible({ timeout: 15000 });
    await expect(firstExpertCard.locator('p.ui-card-desc')).toBeVisible();

    // 3. Verify "View all Experts" button is functional and then navigate back
    const viewAllExpertsButton = page.getByRole('link', { name: 'View all Experts' });
    await expect(viewAllExpertsButton).toBeVisible();
    await viewAllExpertsButton.click();
    await expect(page).toHaveURL(/.*\/experts/);
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // 4. Verify Expertise Section - using correct selectors from HTML
    const expertiseHeading = page.locator('h2.section-heading').filter({ 
      hasText: /book their.*Expertise/i 
    });
    await expertiseHeading.scrollIntoViewIfNeeded();
    await expect(expertiseHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Expertise heading found');
    
    // Wait for expertise cards to load - using the correct selector from HTML
    const expertiseCards = page.locator('[ui-card-expertise]');
    await expect(expertiseCards.first()).toBeVisible({ timeout: 15000 });
    
    const cardCount = await expertiseCards.count();
    console.log(`✅ Found ${cardCount} expertise cards`);
    
    if (cardCount === 0) {
      throw new Error('❌ CRITICAL ISSUE: No expertise cards found! This indicates the expertise section is not loading properly.');
    }
    
    const firstExpertiseCard = expertiseCards.first();
    
    // Verify card structure based on the provided HTML
    await expect(firstExpertiseCard.locator('.ui-card-title a')).toBeVisible({ timeout: 10000 });
    
    // Verify price element exists (test should fail if missing)
    const priceElement = firstExpertiseCard.locator('.ui-card-price');
    await expect(priceElement).toBeVisible({ timeout: 10000 });
    
    // Verify price amount is displayed
    const priceAmount = priceElement.locator('span.ui-card-price__amount');
    await expect(priceAmount).toBeVisible();
    console.log('✅ Expertise card elements verified');

    // 5. Verify "View all Expertise" button is functional and then navigate back
    const viewAllExpertiseButton = page.getByRole('link', { name: 'View all Expertise' });
    await expect(viewAllExpertiseButton).toBeVisible();
    await viewAllExpertiseButton.click();
    await expect(page).toHaveURL(/.*\/expertise/);
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // 6. Verify Discover Experiences Section - MUST exist (test fails if missing)
    const experiencesHeading = page.locator('h2').filter({ 
      hasText: /Discover Experiences/i 
    }).first();
    await experiencesHeading.scrollIntoViewIfNeeded();
    await expect(experiencesHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Experiences section found and verified');

    const firstExperienceCard = page.locator('div[ui-card-experience]').first();
    await expect(firstExperienceCard).toBeVisible({ timeout: 15000 });
    
    // Verify all required experience card elements
    await expect(firstExperienceCard.locator('span.ui-card-location')).toBeVisible();
    await expect(firstExperienceCard.locator('h3.ui-card-title a')).toBeVisible();
    await expect(firstExperienceCard.locator('span.ui-card-date')).toBeVisible();
    
    // Verify experience price element and amount
    const experiencePrice = firstExperienceCard.locator('div.ui-card-price');
    await expect(experiencePrice).toBeVisible();
    await expect(experiencePrice.locator('span.ui-card-price__amount')).toBeVisible();
    console.log('✅ Experience card elements verified');

    // 7. Verify "View all Experiences" button is functional
    const viewAllExperiencesButton = page.getByRole('link', { name: 'View all Experiences' });
    await expect(viewAllExperiencesButton).toBeVisible();
    await viewAllExperiencesButton.click();
    await expect(page).toHaveURL(/.*\/experiences/);
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // 8. Verify Explore Job Opportunities Section - exact selector
    const jobsHeading = page.locator('h2').filter({ 
      hasText: /Explore Job Opportunities/i 
    }).first();
    await jobsHeading.scrollIntoViewIfNeeded();
    await expect(jobsHeading).toBeVisible({ timeout: 10000 });

    const firstJobCard = page.locator('div[ui-card-job]').first();
    await expect(firstJobCard).toBeVisible({ timeout: 15000 });
    await expect(firstJobCard.getByText(/Client:/)).toBeVisible();
    await expect(firstJobCard.getByText(/Posted/)).toBeVisible();
    await expect(firstJobCard.locator('span.job-tag')).toBeVisible();
    await expect(firstJobCard.locator('h3.ui-card-title a')).toBeVisible();
    await expect(firstJobCard.locator('p.ui-card-desc')).toBeVisible();
    await expect(firstJobCard.getByRole('link', { name: 'Learn More & Apply' })).toBeVisible();

    // 9. Verify "View all Jobs" button is functional
    const viewAllJobsButton = page.getByRole('link', { name: 'View all Jobs' });
    await expect(viewAllJobsButton).toBeVisible();
    await viewAllJobsButton.click();
    await expect(page).toHaveURL(/.*\/jobs/);
  });
}); 