import { test, expect } from '@playwright/test';

test.describe('Job Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://mereka.io/jobs');
  });

  test('should navigate to detail page and display job info', async ({ page }) => {
    // Step 1: Find the first job card and click "Learn More & Apply"
    const firstJobCard = page.locator('div.ui-card-job').first();
    await firstJobCard.waitFor({ state: 'visible' });
    const applyButton = firstJobCard.getByRole('link', { name: 'Learn More & Apply' });
    await applyButton.click();

    // Step 2: Wait for navigation and verify the URL
    await page.waitForURL('**/job/**', { timeout: 15000 });
    await expect(page.url()).toContain('/job/');

    // Step 3: Verify the job title and posted date are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/Posted/)).toBeVisible();

    // Step 4: Verify all info labels are visible
    const infoSection = page.locator('section[job-page-info-section]');
    await expect(infoSection.getByText('Experience Level')).toBeVisible();
    await expect(infoSection.getByText('Location')).toBeVisible();
    await expect(infoSection.getByText('Timeline')).toBeVisible();
    await expect(infoSection.getByText('Starts')).toBeVisible();
    await expect(infoSection.getByText('Budget')).toBeVisible();

    // Step 5: Verify the "About the Job" section
    const aboutSection = page.locator('section[job-page-about-section]');
    await expect(aboutSection.getByRole('heading', { name: 'About the Job' })).toBeVisible();
    await expect(aboutSection.locator('div.layout-row')).toBeVisible();

    // Step 6: Verify the "Required Skills" section
    const skillsSection = page.locator('section[job-page-skills-section]');
    await expect(skillsSection.getByRole('heading', { name: 'Required Skills' })).toBeVisible();
    await expect(skillsSection.locator('ul.tags-container')).toBeVisible();

    // Step 7: Verify the "Meet the Client" section
    const clientSection = page.locator('section[job-page-client-section]');
    await expect(clientSection.getByRole('heading', { name: 'Meet the Client' })).toBeVisible();
    await expect(clientSection.locator('h3.client-info__name')).toBeVisible();
    await expect(clientSection.locator('div.client-info__text')).toBeVisible();

    // Step 8: Verify the "Similar Jobs" section loads
    const similarJobsSection = page.locator('section[job-page-jobs-section]');
    await expect(similarJobsSection.getByRole('heading', { name: 'Similar Jobs' })).toBeVisible();

    // Verify the actual job cards are visible in the similar jobs section
    const firstSimilarJob = similarJobsSection.locator('div.ui-card-job').first();
    await expect(firstSimilarJob).toBeVisible({ timeout: 15000 });
  });
}); 