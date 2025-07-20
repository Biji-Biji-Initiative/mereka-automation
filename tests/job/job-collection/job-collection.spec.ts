import { test, expect } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'testingmereka01@gmail.com',
  password: 'merekamereka'
};

test.describe('Job Collection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('https://mereka.io/jobs');
  });

  test('should successfully access job collection', async ({ page }) => {
    // TODO: Add test scenario here
    console.log('Job collection test - scenario to be added');
  });

  test('should display all required elements on a job card', async ({ page }) => {
    // Target the first job card on the page using a class selector
    const firstJobCard = page.locator('div.ui-card-job').first();
    await firstJobCard.waitFor({ state: 'visible', timeout: 10000 });

    // Verify Client Name element is visible
    const clientName = firstJobCard.getByText(/Client:/);
    await expect(clientName).toBeVisible();

    // Verify Posted Date element is visible
    const postedDate = firstJobCard.getByText(/Posted/);
    await expect(postedDate).toBeVisible();

    // Verify Employment Type element is visible
    const employmentType = firstJobCard.locator('span.job-tag');
    await expect(employmentType).toBeVisible();

    // Verify Job Title element is visible
    const jobTitle = firstJobCard.getByRole('heading').first();
    await expect(jobTitle).toBeVisible();

    // Verify Job Description is visible
    const jobDescription = firstJobCard.locator('p.ui-card-desc');
    await expect(jobDescription).toBeVisible();

    // Verify all meta labels are visible
    await expect(firstJobCard.getByText('Experience Level')).toBeVisible();
    await expect(firstJobCard.getByText('Location')).toBeVisible();
    await expect(firstJobCard.getByText('Timeline')).toBeVisible();
    await expect(firstJobCard.getByText('Starts')).toBeVisible();
    await expect(firstJobCard.getByText('Budget')).toBeVisible();

    // Verify "Learn More & Apply" button is visible
    const applyButton = firstJobCard.getByRole('link', { name: 'Learn More & Apply' });
    await expect(applyButton).toBeVisible();
  });
}); 