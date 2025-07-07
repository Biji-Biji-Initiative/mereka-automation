import { test, expect } from '@playwright/test';

/**
 * Helper to get all category tab elements
 */
const getCategoryTabs = (page) => page.locator('.category-tab-item');

/**
 * Helper to get the active category tab
 */
const getActiveCategoryTab = (page) => page.locator('.category-tab-item-active');

/**
 * Helper to get job cards
 */
const getJobCards = (page) => page.locator('div.ui-card-job');

/**
 * Helper to get the job widget category on the detail page
 */
const getJobWidgetCategory = (page) => page.locator('.job-widget__category span');

/**
 * Helper to get the icon for Trainer category
 */
const getTrainerIcon = (span) => span.locator('mat-icon[data-mat-icon-name="collection-training"]');

test.describe('Job Collection Category Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('https://mereka.io/jobs');
    await page.waitForTimeout(2000);
  });

  test('should display all category tabs and allow navigation between them', async ({ page }) => {
    const tabs = getCategoryTabs(page);
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabText = await tab.textContent();
      await tab.click();
      await page.waitForTimeout(1000);
      // Check that the clicked tab is now active
      await expect(tab).toHaveClass(/category-tab-item-active/);
      // Check that job cards are visible (may fail if bug exists)
      const jobCards = getJobCards(page);
      await expect(jobCards.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should maintain job cards visibility when switching between categories', async ({ page }) => {
    const tabs = getCategoryTabs(page);
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
    const jobCards = getJobCards(page);
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 });
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(3, tabCount); i++) {
      const tab = tabs.nth(i);
      await tab.click();
      await page.waitForTimeout(1000);
      await expect(jobCards.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should highlight active category tab', async ({ page }) => {
    const tabs = getCategoryTabs(page);
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(1);

    // Click the second tab and check active state
    const secondTab = tabs.nth(1);
    await secondTab.click();
    await page.waitForTimeout(1000);
    await expect(secondTab).toHaveClass(/category-tab-item-active/);
    // Only one tab should be active
    const activeTabs = page.locator('.category-tab-item-active');
    await expect(activeTabs).toHaveCount(1);
  });

  test('should allow navigation to Trainer and Coach tabs and display job cards', async ({ page }) => {
    const tabs = getCategoryTabs(page);
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
    const jobCards = getJobCards(page);
    const tryTab = async (tabLabel) => {
      const tab = tabs.filter({ hasText: tabLabel });
      if (await tab.count() > 0) {
        await tab.first().click();
        await page.waitForTimeout(1000);
        await expect(tab.first()).toHaveClass(/category-tab-item-active/);
        await expect(jobCards.first()).toBeVisible({ timeout: 5000 });
      } else {
        console.warn(`Tab '${tabLabel}' not found.`);
      }
    };
    await tryTab('Trainer');
    await tryTab('Coach');
  });

  test('should click Trainer tab, navigate to job detail, and verify category widget', async ({ page }) => {
    const tabs = getCategoryTabs(page);
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
    const jobCards = getJobCards(page);
    
    // Find and click the Trainer tab
    const trainerTab = tabs.filter({ hasText: 'Trainer' });
    await expect(trainerTab.first()).toBeVisible({ timeout: 10000 });
    await trainerTab.first().click();
    await page.waitForTimeout(1000);
    
    // Verify the tab is active
    await expect(trainerTab.first()).toHaveClass(/category-tab-item-active/);
    
    // Verify job cards are visible
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 });
    
    // Click the first job card
    await jobCards.first().click();
    
    // Wait for navigation to job detail page
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Look for the job widget category
    const widgetCategories = getJobWidgetCategory(page);
    
    // Find the span that contains 'Trainer'
    const trainerSpan = widgetCategories.filter({ hasText: 'Trainer' });
    await expect(trainerSpan.first()).toBeVisible({ timeout: 10000 });
    
    // Assert the Trainer icon is present in the span
    const icon = getTrainerIcon(trainerSpan.first());
    await expect(icon).toBeVisible({ timeout: 5000 });
  });
}); 