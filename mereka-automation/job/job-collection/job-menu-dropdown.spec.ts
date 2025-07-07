import { test, expect } from '@playwright/test';

/**
 * Helper to get the category button trigger
 */
const getCategoryButton = (page) => page.locator('.category-button');

/**
 * Helper to get job cards
 */
const getJobCards = (page) => page.locator('div.ui-card-job');

/**
 * Helper to get the main heading
 */
const getHeading = (page) => page.locator('h1.job-content-header');

/**
 * Helper to get the job widget category on the detail page
 */
const getJobWidgetCategory = (page) => page.locator('.job-widget__category span');

/**
 * Helper to get the icon for Tech & AI
 */
const getTechAIIcon = (span) => span.locator('mat-icon[data-mat-icon-name="code"]');

test.describe('Job Menu Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('https://mereka.io/jobs');
    await page.waitForTimeout(2000);
  });

  test('should open dropdown menu, select Tech & AI category, update heading, and verify job detail category', async ({ page }) => {
    // Wait for the page to load and find the category button
    const categoryButton = getCategoryButton(page);
    await expect(categoryButton).toBeVisible({ timeout: 10000 });
    
    // Click on the category button to open the dropdown
    await categoryButton.click();
    await page.waitForTimeout(1000);
    
    // Look for the dropdown menu items
    const menuItems = page.locator('.mat-mdc-menu-item');
    await expect(menuItems.first()).toBeVisible({ timeout: 5000 });
    
    // Find and click on "Tech & AI" option
    const techAIOption = menuItems.filter({ hasText: 'Tech & AI' });
    await expect(techAIOption.first()).toBeVisible({ timeout: 5000 });
    await techAIOption.first().click();
    
    // Wait for the selection to take effect
    await page.waitForTimeout(2000);
    
    // Verify that job cards are visible after selecting Tech & AI
    const jobCards = getJobCards(page);
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 });
    
    // Assert that the heading text changes to 'Job Opportunities in Tech & AI'
    const heading = getHeading(page);
    await expect(heading).toHaveText('Job Opportunities in Tech & AI');
    
    // Optional: Verify that the category button now shows "Tech & AI"
    await expect(categoryButton).toContainText('Tech & AI');

    // Click the first job card
    await jobCards.first().click();
    // Wait for navigation to job detail page
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for the job widget category
    const widgetCategories = getJobWidgetCategory(page);
    // Find the span that contains 'Tech & AI'
    const techAISpan = widgetCategories.filter({ hasText: 'Tech & AI' });
    await expect(techAISpan.first()).toBeVisible({ timeout: 10000 });
    // Assert the icon is present in the span
    const icon = getTechAIIcon(techAISpan.first());
    await expect(icon).toBeVisible({ timeout: 5000 });
  });
}); 