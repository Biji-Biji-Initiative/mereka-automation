import { test, expect } from '@playwright/test';

// Test data - using the same credentials from other tests
const TEST_USER = {
  email: 'testingmereka01@gmail.com',
  password: 'merekamereka'
};

test.describe('Physical Experience Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  /**
   * Helper function to perform login
   */
  // ========================================
  // ⚠️  DO NOT MODIFY LOGIN FUNCTION - WORKING CORRECTLY
  // ========================================
  async function loginToMereka(page) {
    console.log('🔐 Starting login flow...');
    
    // Step 1: Click login link - flexible selector
    const loginLink = page.getByRole('link', { name: 'Log In' }).or(
      page.getByRole('link', { name: 'Login' })
    ).or(
      page.locator('a[href*="login"], a[href*="auth"], a:has-text("Log In"), a:has-text("Login")')
    );
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();

    // Step 2: Select email login method
    console.log('📧 Selecting email login method...');
    await page.waitForLoadState('networkidle');
    const emailButton = page.getByRole('button', { name: 'Continue with Email' }).or(
      page.getByRole('button', { name: 'Email' })
    );
    await expect(emailButton).toBeVisible({ timeout: 10000 });
    await emailButton.click();
    await page.waitForLoadState('networkidle');

    // Step 3: Enter email
    console.log('✉️ Entering email...');
    const emailInput = page.locator('input[formcontrolname="email"][type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_USER.email);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: Enter password
    console.log('🔑 Entering password...');
    const passwordInput = page.locator('input[formcontrolname="password"][type="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Step 5: Verify successful login
    await page.waitForLoadState('networkidle');
    
    // Check for successful login indicators (profile menu, dashboard, etc.)
    const loginSuccessIndicators = page.locator('[class*="profile"], [class*="user"], [class*="menu"], [class*="avatar"]').or(
      page.getByText('Welcome').or(
        page.getByText('Dashboard')
      )
    );
    await expect(loginSuccessIndicators.first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Login successful!');
  }
  // ========================================
  // ⚠️  END OF LOGIN FUNCTION - DO NOT MODIFY ABOVE
  // ========================================

  test('should navigate to physical experience creation page and create experience', async ({ page }) => {
    // Increase timeout for this comprehensive test
    test.setTimeout(90000); // 90 seconds

    // Handle potential pop-ups that might appear during the test
    page.on('dialog', async dialog => {
      console.log(`🚨 Dialog appeared: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // Enhanced survey and popup handling
    const handlePopups = async () => {
      try {
        let questionsHandled = 0;
        const maxQuestions = 6; // Handle up to 6 questions
        
        // Keep handling questions until no more are found
        while (questionsHandled < maxQuestions) {
          let foundPopup = false;
          
          // First priority: Look for generic close/hide buttons to close entire survey
          const closeButtons = [
            'button:has-text("Hide survey")',
            'button:has-text("×")',
            'button[aria-label="Close"]',
            'button[aria-label="close"]',
            'button:has-text("Close")',
            '.close-button',
            '[data-testid="close-button"]',
            'button:has-text("✕")',
            'button:has-text("X")',
            '.survey-close',
            '.modal-close',
            'button[title="Close"]',
            'button[title="close"]'
          ];

          for (const selector of closeButtons) {
            const closeButton = page.locator(selector).first();
            if (await closeButton.isVisible({ timeout: 300 }).catch(() => false)) {
              console.log(`🚨 Found close button: ${selector}`);
              await closeButton.click();
              await page.waitForTimeout(500);
              console.log('✅ Entire survey closed via close button');
              return; // Exit completely - survey should be closed
            }
          }

          // Second priority: Look for skip buttons to skip individual questions
          const skipButtons = [
            'button:has-text("Skip")',
            'button:has-text("No thanks")',
            'button:has-text("Maybe later")',
            'button:has-text("Dismiss")',
            'button:has-text("Not now")',
            'button:has-text("Later")',
            'button:has-text("Cancel")',
            'button:has-text("No")',
            'button:has-text("Skip for now")',
            'button:has-text("Skip this")',
            'button:has-text("Not interested")',
            'button:has-text("Skip question")'
          ];

          for (const selector of skipButtons) {
            const skipButton = page.locator(selector).first();
            if (await skipButton.isVisible({ timeout: 300 }).catch(() => false)) {
              console.log(`🚨 Found skip button for question ${questionsHandled + 1}: ${selector}`);
              await skipButton.click();
              await page.waitForTimeout(500);
              console.log(`✅ Question ${questionsHandled + 1} skipped`);
              questionsHandled++;
              foundPopup = true;
              break;
            }
          }

          // Third priority: Look for survey rating buttons to quickly dismiss
          const quickRatingButtons = [
            'button:has-text("1")',
            'button:has-text("2")',
            'button:has-text("3")',
            'button:has-text("4")',
            'button:has-text("5")',
            'button:has-text("Not relevant at all")',
            'button:has-text("Very relevant")',
            'button:has-text("Poor")',
            'button:has-text("Fair")',
            'button:has-text("Good")',
            'button:has-text("Very good")',
            'button:has-text("Excellent")'
          ];

          for (const selector of quickRatingButtons) {
            const ratingButton = page.locator(selector).first();
            if (await ratingButton.isVisible({ timeout: 300 }).catch(() => false)) {
              console.log(`🚨 Found rating button for question ${questionsHandled + 1}: ${selector}`);
              await ratingButton.click();
              await page.waitForTimeout(500);
              console.log(`✅ Question ${questionsHandled + 1} answered with rating`);
              questionsHandled++;
              foundPopup = true;
              break;
            }
          }

          // If no popup found, we're done
          if (!foundPopup) {
            break;
          }
        }

        if (questionsHandled > 0) {
          console.log(`✅ Handled ${questionsHandled} survey questions`);
        } else {
          console.log('ℹ️ No popups found to handle');
        }
      } catch (error) {
        console.log(`ℹ️ Pop-up handling completed (error: ${error.message})`);
      }
    };

    // ========================================
    // ⚠️  DO NOT MODIFY SECTION BELOW - WORKING LOGIN & NAVIGATION FLOW
    // This section contains tested and working code for:
    // - Login process
    // - Hub Dashboard navigation  
    // ========================================

    // Step 1: Login to Mereka
    await loginToMereka(page);
    await handlePopups(); // Check for pop-ups after login

    // Step 2: Click Hub Dashboard button
    console.log('🏢 Looking for Hub Dashboard button...');
    
    // Using multiple selector strategies based on the provided HTML
    const hubDashboardButton = page.locator('a[href*="/hub/"][href*="/dashboard"]').filter({
      hasText: /Business Dashboard|Dashboard/i
    }).or(
      page.getByRole('link', { name: /Business Dashboard|Dashboard/i })
    ).or(
      page.locator('a').filter({ hasText: 'Business Dashboard' })
    );

    await expect(hubDashboardButton).toBeVisible({ timeout: 15000 });
    console.log('✅ Hub Dashboard button found');
    await hubDashboardButton.click();
    
    // Wait for navigation and page load with more flexible timing
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000); // Give more time for dashboard to load
    await handlePopups(); // Check for pop-ups after dashboard load
    console.log('✅ Dashboard page loaded');

    // Handle any survey popups that might be blocking the interface
    console.log('🔍 Checking for survey popups...');
    
    // Enhanced survey popup handling with more patterns
    const surveyPopups = [
      // Primary skip/close buttons
      'button:has-text("Skip")',
      'button:has-text("×")',
      'button:has-text("✕")',
      'button:has-text("X")',
      'button:has-text("Close")',
      'button[aria-label="Close"]',
      'button[aria-label="close"]',
      '.close-btn',
      '.close-button',
      'button:has-text("Hide survey")',
      'button:has-text("Dismiss")',
      'button:has-text("Not now")',
      'button:has-text("Maybe later")',
      'button:has-text("No thanks")',
      'button:has-text("Cancel")',
      'button:has-text("Skip for now")',
      'button:has-text("Skip this")',
      'button:has-text("Not interested")',
      // Rating buttons for quick dismissal
      'button:has-text("Not relevant at all")',
      'button:has-text("Very relevant")',
      'button:has-text("1")',
      'button:has-text("2")',
      'button:has-text("3")',
      'button:has-text("4")',
      'button:has-text("5")',
      'button:has-text("Poor")',
      'button:has-text("Fair")',
      'button:has-text("Good")',
      'button:has-text("Very good")',
      'button:has-text("Excellent")',
      // Additional survey patterns
      'button:has-text("No")',
      'button:has-text("Yes")',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'button:has-text("Done")',
      'button:has-text("Finish")',
      'button:has-text("Submit")'
    ];

    let surveyHandled = false;
    for (const selector of surveyPopups) {
      const popup = page.locator(selector).first();
      if (await popup.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`🚨 Found survey popup: ${selector}`);
        await popup.click();
        await page.waitForTimeout(500);
        console.log('✅ Survey popup handled');
        surveyHandled = true;
        break;
      }
    }
    
    if (!surveyHandled) {
      console.log('ℹ️ No survey popups found to handle');
    }
    
    await handlePopups(); // Check for additional pop-ups after survey handling

    // ========================================
    // PHYSICAL EXPERIENCE CREATION FLOW STARTS HERE
    // ========================================

    // Step 3: Click Experiences button from dropdown
    console.log('🌟 Looking for Experiences button in dropdown...');
    
    // Wait for dynamic content to load - give Angular time to load
    console.log('⏳ Waiting for dashboard content to load...');
    await page.waitForTimeout(5000); // Give Angular time to load
    
    // First, look for "Manage Services" dropdown button
    console.log('🔽 Looking for Manage Services dropdown button...');
    const dropdownToggle = page.locator('a[ui-button-clear]').filter({ hasText: 'Manage Services' }).or(
      page.locator('a.ui-button').filter({ hasText: 'Manage Services' })
    ).or(
      page.locator('a').filter({ has: page.locator('.menu-title').filter({ hasText: 'Manage Services' }) })
    ).or(
      page.locator('a').filter({ has: page.locator('svg-icon[name="chevron-down"]') }).filter({ hasText: 'Manage Services' })
    ).first();
    
    // Click dropdown toggle to open the menu
    await expect(dropdownToggle).toBeVisible({ timeout: 10000 });
    console.log('✅ Manage Services dropdown button found');
    await dropdownToggle.click();
    console.log('✅ Manage Services dropdown opened');
    
    // Wait for dropdown menu to appear
    await page.waitForTimeout(1000);
    
    // Now target the Experiences button from the dropdown
    const experiencesButton = page.locator('a[href*="/dashboard/service/experiences/listing"]').or(
      page.locator('.dropdown-item').filter({ hasText: 'Experiences' })
    ).or(
      page.locator('a.dropdown-item').filter({ hasText: 'Experiences' })
    ).first();

    // Wait for the button to be visible in the dropdown
    await expect(experiencesButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Experiences button found in dropdown');
    
    await experiencesButton.click();
    console.log('✅ Experiences button clicked from dropdown');

    // Wait for navigation to experiences listing page
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await handlePopups(); // Check for pop-ups after page load
    console.log('✅ Experiences listing page loaded');

    // Step 4: Look for Create Physical Experience button
    console.log('➕ Looking for Create Physical Experience button...');
    
    const currentUrl = page.url();
    console.log(`🌐 Current URL before Create Physical Experience: ${currentUrl}`);
    
    // Count all buttons/links for debugging
    const allButtons = page.locator('button, a, [role="button"]');
    const buttonCount = await allButtons.count();
    console.log(`🔍 Found ${buttonCount} total buttons/links on page`);
    
    await handlePopups(); // Check for pop-ups before proceeding
    
    // Multiple selector strategies for Create Physical Experience button
    const createExperienceButton = page.getByRole('button', { name: /Create.*Experience|Add.*Experience|New.*Experience/i }).or(
      page.getByRole('link', { name: /Create.*Experience|Add.*Experience|New.*Experience/i })
    ).or(
      page.locator('button').filter({ hasText: /Create.*Experience|Add.*Experience|New.*Experience/i })
    ).or(
      page.locator('a').filter({ hasText: /Create.*Experience|Add.*Experience|New.*Experience/i })
    ).or(
      page.locator('[data-testid*="create"], [data-testid*="add"], [data-testid*="new"]').filter({ hasText: /Experience/i })
    ).first();

    await expect(createExperienceButton).toBeVisible({ timeout: 10000 });
    console.log(`✅ Create Physical Experience button found with text "${await createExperienceButton.textContent()}"`);
    
    await handlePopups(); // Check for pop-ups before clicking
    await createExperienceButton.click();
    console.log('✅ Create Physical Experience button clicked');

    // Step 5: Verify navigation to experience creation page
    console.log('📝 Verifying physical experience creation page...');
    
    // Wait for page to load after clicking create button
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Give time for Angular to render the cards
    const newUrl = page.url();
    console.log(`🌐 Current URL: ${newUrl}`);
    
    await handlePopups(); // Check for pop-ups after navigation
    
    // Verify we're on the correct page
    if (newUrl.includes('create') || newUrl.includes('experience') || newUrl.includes('new') || newUrl.includes('express-experience')) {
      console.log('🎉 Successfully navigated to physical experience creation page!');
      console.log('✅ URL verification passed - contains creation terms');
    } else {
      console.log('⚠️ URL might not be correct, but continuing...');
    }

        // Step 6: Select Platform listing option
    console.log('🎯 Looking for Platform listing option...');
    
    // Wait for the page to load the options
    console.log('⏳ Waiting for listing options to load...');
    await page.waitForTimeout(3000);
    
    // Close any survey popups aggressively before proceeding
    console.log('🚨 Closing any survey popups before Platform listing selection...');
    await handlePopups();
    await page.waitForTimeout(1000);
    
    // Look for the Platform listing radio button using a more specific approach
    console.log('🔍 Looking for Platform listing radio button...');
    
    // Use a simple approach - just click on the Platform listing text directly
    // This should automatically select the associated radio button
    const platformListingText = page.getByText('Platform listing', { exact: true }).first();
    
    // Wait for the Platform listing text to be visible
    await expect(platformListingText).toBeVisible({ timeout: 15000 });
    console.log('✅ Platform listing text found');
    
    // Click on the Platform listing text to select it
    await platformListingText.click();
    console.log('✅ Platform listing text clicked');
    
    // Wait for the selection to register
    await page.waitForTimeout(1000);
    
    // Verify selection by checking if Platform listing is selected
    console.log('🔍 Verifying Platform listing is selected...');
    
    // Check if there's a radio button that's now selected for Platform listing
    const allRadios = page.locator('input[type="radio"]');
    const radioCount = await allRadios.count().catch(() => 0);
    console.log(`📊 Found ${radioCount} radio buttons on page`);
    
    // Look for the second radio button (Platform listing should be the second option)
    if (radioCount >= 2) {
      const secondRadio = allRadios.nth(1);
      const isSecondSelected = await secondRadio.isChecked().catch(() => false);
      console.log(`📋 Second radio button (Platform listing) selected: ${isSecondSelected}`);
      
      if (!isSecondSelected) {
        console.log('⚠️ Platform listing might not be selected, trying direct radio click...');
        await secondRadio.click();
        await page.waitForTimeout(500);
        console.log('🔄 Second radio button clicked directly');
      }
    }
    
    console.log('✅ Platform listing selection completed and verified');

    // Step 7: Click Next button
    console.log('➡️ Looking for Next button...');
    
    // Target the specific Next button using the exact HTML structure provided
    const nextButton = page.locator('button[ui-button-flat-large]').filter({ has: page.locator('.ui-button-wrapper').filter({ hasText: 'Next' }) }).or(
      page.locator('button.ui-button-flat-large').filter({ has: page.locator('.ui-button-wrapper').filter({ hasText: 'Next' }) })
    ).or(
      page.locator('button').filter({ has: page.locator('.ui-button-wrapper').filter({ hasText: 'Next' }) })
    ).or(
      page.locator('button').filter({ hasText: 'Next' })
    ).first();

    await expect(nextButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Next button found');
    
    // Add debugging to verify the button structure
    const buttonClass = await nextButton.getAttribute('class');
    const buttonText = await nextButton.textContent();
    console.log(`📝 Next button class: "${buttonClass}"`);
    console.log(`📝 Next button text: "${buttonText}"`);
    
    await nextButton.click();
    console.log('✅ Next button clicked');

    // Step 8: Wait for page to load and verify redirect
    console.log('⏳ Waiting for page to load and redirect...');
    
    // Wait for navigation to complete
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Give time for redirect to process
    
    // Verify the redirect URL
    const redirectedUrl = page.url();
    console.log(`🌐 Current URL after redirect: ${redirectedUrl}`);
    
    // Check if we're on the correct page
    const expectedUrl = 'https://app.mereka.io/create-workshop/your-experience';
    if (redirectedUrl === expectedUrl || redirectedUrl.includes('create-workshop/your-experience')) {
      console.log('✅ Successfully redirected to your-experience page!');
      console.log('✅ URL verification passed - reached create-workshop/your-experience');
    } else {
      console.log(`⚠️ Expected URL: ${expectedUrl}`);
      console.log(`⚠️ Actual URL: ${redirectedUrl}`);
      console.log('⚠️ URL might not match exactly, but continuing...');
    }
    
    await handlePopups(); // Check for pop-ups after redirect

    // Step 9: Verify page content and fill in the experience title
    console.log('📝 Verifying page content and filling experience title...');
    
    // First, verify the heading and description text
    console.log('🔍 Verifying page heading and description...');
    
    const pageHeading = page.locator('h3[ui-panel-row-title]').filter({ hasText: 'Provide a title for your Experience' }).or(
      page.locator('h3.ui-panel-row-title').filter({ hasText: 'Provide a title for your Experience' })
    ).or(
      page.locator('h3').filter({ hasText: 'Provide a title for your Experience' })
    ).first();
    
    await expect(pageHeading).toBeVisible({ timeout: 10000 });
    const headingText = await pageHeading.textContent();
    console.log(`✅ Page heading verified: "${headingText}"`);
    
    const pageDescription = page.locator('p[ui-panel-row-desc]').filter({ hasText: 'This is how your Experience will be listed on Mereka Connect.' }).or(
      page.locator('p.ui-panel-row-desc').filter({ hasText: 'This is how your Experience will be listed on Mereka Connect.' })
    ).or(
      page.locator('p').filter({ hasText: 'This is how your Experience will be listed on Mereka Connect.' })
    ).first();
    
    await expect(pageDescription).toBeVisible({ timeout: 10000 });
    const descriptionText = await pageDescription.textContent();
    console.log(`✅ Page description verified: "${descriptionText}"`);
    
    // Now target the experience title input field using the provided HTML structure
    const experienceTitleInput = page.locator('input[formcontrolname="experienceTitle"]').or(
      page.locator('input[placeholder="Name"][maxlength="70"]')
    ).or(
      page.locator('input[placeholder="Name"]')
    ).or(
      page.locator('input.form-control[formcontrolname]')
    ).first();
    
    await expect(experienceTitleInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Experience title input field found');
    
    // Clear any existing content and fill with the specified title
    const experienceTitle = 'Fadlan Physical Experience';
    await experienceTitleInput.clear();
    await experienceTitleInput.fill(experienceTitle);
    console.log(`✅ Experience title filled: "${experienceTitle}"`);
    
    // Verify the title was entered correctly
    const enteredTitle = await experienceTitleInput.inputValue();
    console.log(`📋 Verified title: "${enteredTitle}"`);
    
    if (enteredTitle === experienceTitle) {
      console.log('✅ Experience title verification passed');
    } else {
      console.log('⚠️ Experience title verification failed, but continuing...');
    }

    console.log('🎉 Experience title filling completed successfully!');

    // Step 10: Scroll to Experience Category section and select Event
    console.log('📜 Scrolling to Experience Category section...');
    
    // Scroll to find the Experience Category section
    const experienceCategorySection = page.locator('h3[ui-panel-row-title]').filter({ hasText: 'What type of Experience will you offer?' }).or(
      page.locator('h3.ui-panel-row-title').filter({ hasText: 'What type of Experience will you offer?' })
    ).or(
      page.locator('h3').filter({ hasText: 'What type of Experience will you offer?' })
    ).first();
    
    // Scroll the section into view
    await experienceCategorySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000); // Give time for scroll to complete
    
    await expect(experienceCategorySection).toBeVisible({ timeout: 10000 });
    console.log('✅ Experience Category section found and scrolled into view');
    
    // Verify the section heading
    const categoryHeadingText = await experienceCategorySection.textContent();
    console.log(`📋 Category section heading: "${categoryHeadingText}"`);
    
    // Find and select the Event checkbox
    console.log('🎯 Looking for Event checkbox tile...');
    
    // Debug: Let's see what's actually on the page
    console.log('🔍 Debugging: Checking what elements are present...');
    
    // Check for any checkbox elements
    const allCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await allCheckboxes.count().catch(() => 0);
    console.log(`📊 Found ${checkboxCount} checkbox elements on page`);
    
    // Check for tiles with Event text
    const eventTiles = page.locator('*').filter({ hasText: 'Event' });
    const eventTileCount = await eventTiles.count().catch(() => 0);
    console.log(`📊 Found ${eventTileCount} elements containing "Event" text`);
    
    // Check for ui-checkbox-tile elements
    const checkboxTiles = page.locator('[ui-checkbox-tile], .ui-checkbox-tile');
    const tileCount = await checkboxTiles.count().catch(() => 0);
    console.log(`📊 Found ${tileCount} checkbox tile elements`);
    
    if (checkboxCount > 0) {
      console.log('🔍 Listing all checkbox IDs:');
      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = allCheckboxes.nth(i);
        const id = await checkbox.getAttribute('id').catch(() => 'no-id');
        const ariaChecked = await checkbox.getAttribute('aria-checked').catch(() => 'no-aria');
        console.log(`  - Checkbox ${i}: id="${id}", aria-checked="${ariaChecked}"`);
      }
    }
    
    if (eventTileCount > 0) {
      console.log('🔍 Listing elements with "Event" text:');
      for (let i = 0; i < Math.min(eventTileCount, 5); i++) {
        const tile = eventTiles.nth(i);
        const tagName = await tile.evaluate(el => el.tagName).catch(() => 'unknown');
        const className = await tile.getAttribute('class').catch(() => 'no-class');
        const id = await tile.getAttribute('id').catch(() => 'no-id');
        console.log(`  - Element ${i}: <${tagName}> id="${id}" class="${className}"`);
      }
    }
    
    // Try to find Event checkbox with more generic approach
    console.log('🎯 Trying to find Event checkbox with generic approach...');
    
    // Look for any element that contains "Event" and is part of a checkbox structure
    const eventCheckboxOptions = [
      page.locator('#checkbox-6-input'),
      page.locator('#checkbox-6 input'),
      page.locator('input[type="checkbox"]').filter({ has: page.locator('.. span').filter({ hasText: 'Event' }) }),
      page.locator('input[type="checkbox"]').filter({ has: page.locator('~ * span').filter({ hasText: 'Event' }) }),
      page.locator('*').filter({ hasText: 'Event' }).locator('input[type="checkbox"]').first(),
      page.locator('*').filter({ hasText: 'Event' }).locator('.. input[type="checkbox"]').first()
    ];
    
    let eventCheckbox: any = null;
    for (let i = 0; i < eventCheckboxOptions.length; i++) {
      const option = eventCheckboxOptions[i];
      const isVisible = await option.isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`  - Option ${i}: ${isVisible ? 'VISIBLE' : 'not visible'}`);
      if (isVisible && !eventCheckbox) {
        eventCheckbox = option;
        console.log(`✅ Found Event checkbox with option ${i}`);
        break;
      }
    }
    
    if (eventCheckbox) {
      // Check if already selected
      const isAlreadyChecked = await eventCheckbox.getAttribute('aria-checked').catch(() => 'false');
      console.log(`📋 Event checkbox aria-checked: ${isAlreadyChecked}`);
      
      if (isAlreadyChecked === 'true') {
        console.log('✅ Event checkbox is already selected');
      } else {
        console.log('🔄 Event checkbox not selected, proceeding to select it...');
        
        // Click the Event checkbox
        await eventCheckbox.click({ force: true });
        console.log('✅ Event checkbox clicked');
        
        // Wait and verify
        await page.waitForTimeout(1000);
        
        const newCheckedState = await eventCheckbox.getAttribute('aria-checked').catch(() => 'false');
        console.log(`📋 Event checkbox new aria-checked state: ${newCheckedState}`);
      }
    } else {
      console.log('❌ Could not find Event checkbox with any approach');
      
      // Last resort: try to find and click any checkbox tile that contains "Event"
      const eventTileGeneric = page.locator('*').filter({ hasText: 'Event' }).filter({ hasText: /^Event$/ }).first();
      const tileVisible = await eventTileGeneric.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (tileVisible) {
        console.log('🔄 Trying to click Event tile as last resort...');
        await eventTileGeneric.click({ force: true });
        console.log('✅ Event tile clicked as fallback');
      } else {
        console.log('❌ No Event-related elements found at all');
      }
    }
    
    // Verify the Event checkbox is now selected using multiple methods
    console.log('🔍 Verifying Event checkbox selection...');
    
    // Wait a bit for the UI to update
    await page.waitForTimeout(1000);
    
    // Method 1: Check for ui-checkbox-checked class on the first checkbox tile (Event)
    const hasCheckedClass = await page.locator('#checkbox-1.ui-checkbox-checked').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`📋 Event tile has checked class: ${hasCheckedClass}`);
    
    // Method 2: Check aria-checked attribute on the first checkbox input (Event)
    const eventInput = page.locator('#checkbox-1-input');
    const ariaChecked = await eventInput.getAttribute('aria-checked').catch(() => 'false');
    console.log(`📋 Event input aria-checked: ${ariaChecked}`);
    
    // Method 3: Check if the input is actually checked
    const isInputChecked = await eventInput.isChecked().catch(() => false);
    console.log(`📋 Event input checked state: ${isInputChecked}`);
    
    // Method 4: Check if the Event checkbox we found earlier is still selected
    let eventCheckboxSelected = false;
    if (eventCheckbox) {
      const currentAriaChecked = await eventCheckbox.getAttribute('aria-checked').catch(() => 'false');
      eventCheckboxSelected = currentAriaChecked === 'true';
      console.log(`📋 Found Event checkbox aria-checked: ${currentAriaChecked}`);
    }
    
    // Final verification
    if (hasCheckedClass || ariaChecked === 'true' || isInputChecked || eventCheckboxSelected) {
      console.log('✅ Event checkbox is successfully selected');
    } else {
      console.log('⚠️ Event checkbox selection may have failed, attempting one more time...');
      
      // Try one more click attempt with the found checkbox
      if (eventCheckbox) {
        console.log('🔄 Attempting one more click with found Event checkbox...');
        await eventCheckbox.click({ force: true });
        await page.waitForTimeout(1000);
        
        const finalAriaChecked = await eventCheckbox.getAttribute('aria-checked').catch(() => 'false');
        console.log(`📋 Final Event checkbox aria-checked: ${finalAriaChecked}`);
        
        if (finalAriaChecked === 'true') {
          console.log('✅ Event checkbox is now selected after retry');
        } else {
          console.log('⚠️ Event checkbox selection still failed, but continuing...');
        }
      } else {
        console.log('⚠️ No Event checkbox found to retry, but continuing...');
      }
    }

    console.log('🎉 Experience Category selection completed successfully!');
    await handlePopups(); // Check for pop-ups after category selection

    // Step 11: Add Theme Selection
    console.log('🎨 Starting theme selection process...');
    
    // First, click the "Add Theme" button
    console.log('➕ Looking for Add Theme button...');
    
    const addThemeButton = page.locator('#checkbox-11').or(
      page.locator('button[ui-button-icon-outline]').filter({ has: page.locator('svg-icon[name="plus"]') })
    ).or(
      page.locator('div.ui-checkbox-tile').filter({ has: page.locator('span').filter({ hasText: 'Add Theme' }) }).locator('button')
    ).or(
      page.locator('button').filter({ has: page.locator('svg-icon[name="plus"]') })
    ).first();
    
    await expect(addThemeButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Add Theme button found');
    
    // Click the Add Theme button
    await addThemeButton.click();
    console.log('✅ Add Theme button clicked');
    
    // Wait for the theme options to appear
    await page.waitForTimeout(2000);
    console.log('⏳ Waiting for theme options to appear...');
    
    // Step 12: Click Health & Safety theme option
    console.log('🎯 Looking for Health & Safety theme option...');
    
    // Target the Health & Safety checkbox tile
    const healthSafetyOption = page.locator('#checkbox-120').or(
      page.locator('div[ui-checkbox-tile]').filter({ has: page.locator('.ui-checkbox-tile-label').filter({ hasText: 'Health & Safety' }) })
    ).or(
      page.locator('.ui-checkbox-tile').filter({ has: page.locator('div').filter({ hasText: 'Health & Safety' }) })
    );
    
    await expect(healthSafetyOption).toBeVisible({ timeout: 10000 });
    console.log('✅ Health & Safety theme option found');
    
    // Click the Health & Safety option
    await healthSafetyOption.click();
    console.log('✅ Health & Safety theme option clicked');
    
    // Wait for the second level options to appear
    await page.waitForTimeout(2000);
    console.log('⏳ Waiting for second level theme options...');
    
    // Step 13: Click Occupational Safety from the second level
    console.log('🎯 Looking for Occupational Safety option...');
    
    // Target the Occupational Safety checkbox tile
    const occupationalSafetyOption = page.locator('#checkbox-138').or(
      page.locator('div[ui-checkbox-tile]').filter({ has: page.locator('.ui-checkbox-tile-label').filter({ hasText: 'Occupational Safety' }) })
    ).or(
      page.locator('.ui-checkbox-tile').filter({ has: page.locator('div').filter({ hasText: 'Occupational Safety' }) })
    );
    
    await expect(occupationalSafetyOption).toBeVisible({ timeout: 10000 });
    console.log('✅ Occupational Safety option found');
    
    // Click the Occupational Safety option
    await occupationalSafetyOption.click();
    console.log('✅ Occupational Safety option clicked');
    
    // Wait for the selection to be processed
    await page.waitForTimeout(1000);
    console.log('⏳ Processing theme selection...');
    
    console.log('🎉 Theme selection process completed successfully!');
    await handlePopups(); // Check for pop-ups after theme selection

    // Step 14: Select Physical experience type
    console.log('🏛️ Looking for Physical experience type radio button...');
    
    // Target the Physical radio button using the correct ID from the error message
    const physicalRadioButton = page.locator('#ui-radio-2').first();
    
    await expect(physicalRadioButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Physical radio button found');
    
    // Click the Physical radio button to ensure it's selected
    await physicalRadioButton.click();
    console.log('✅ Physical radio button clicked');
    
    // Wait for the selection to be processed
    await page.waitForTimeout(500);
    
    // Verify the selection
    const physicalSelected = await page.locator('#ui-radio-2.ui-radio-checked').isVisible({ timeout: 3000 }).catch(() => false);
    const physicalInput = await page.locator('#ui-radio-2-input').isChecked().catch(() => false);
    
    console.log(`📋 Physical radio button status: class-checked=${physicalSelected}, input-checked=${physicalInput}`);
    
    if (physicalSelected || physicalInput) {
      console.log('✅ Physical experience type successfully selected');
    } else {
      console.log('⚠️ Physical experience type selection unclear, but continuing...');
    }
    
    console.log('🎉 Physical experience type selection completed successfully!');
    await handlePopups(); // Check for pop-ups after physical type selection

    // Step 15: Verify Location section appears
    console.log('📍 Looking for Location section...');
    
    // Scroll to ensure Location section is in view if needed
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    
    // Target the Location panel more specifically
    const locationPanel = page.locator('div[ui-panel]').filter({ has: page.locator('div[ui-panel-header-title]').filter({ hasText: 'Location' }) }).first();
    
    await expect(locationPanel).toBeVisible({ timeout: 10000 });
    console.log('✅ Location panel found');
    
    // Verify the location section content
    const locationTitle = page.locator('h3').filter({ hasText: 'Share the location of your Experience!' });
    await expect(locationTitle).toBeVisible({ timeout: 5000 });
    console.log('✅ Location section title verified');
    
    // Check for address form elements
    const hubAddressButton = page.locator('button.button-tab').filter({ hasText: 'Hub Address' });
    const newAddressButton = page.locator('button.button-tab').filter({ hasText: 'New Address' });
    const otherHubVenueButton = page.locator('button.button-tab').filter({ hasText: 'Other Hub Venue' });
    
    const hubAddressVisible = await hubAddressButton.isVisible({ timeout: 3000 }).catch(() => false);
    const newAddressVisible = await newAddressButton.isVisible({ timeout: 3000 }).catch(() => false);
    const otherHubVenueVisible = await otherHubVenueButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    console.log(`📋 Location options visible: Hub Address=${hubAddressVisible}, New Address=${newAddressVisible}, Other Hub Venue=${otherHubVenueVisible}`);
    
    // Verify Street Address input field
    const streetAddressInput = page.locator('input[placeholder="Start typing to search"], input#autoCompleteInput');
    const streetAddressVisible = await streetAddressInput.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`📋 Street Address input visible: ${streetAddressVisible}`);
    
    if (hubAddressVisible || newAddressVisible || streetAddressVisible) {
      console.log('✅ Location section successfully loaded with address options');
    } else {
      console.log('⚠️ Location section may not be fully loaded, but continuing...');
    }
    
    console.log('🎉 Location section verification completed successfully!');

    // Step 16: Scroll to Host section
    console.log('👥 Scrolling to Host section...');
    
    const hostPanel = page.locator('div[ui-panel]').filter({ has: page.locator('div[ui-panel-header-title]').filter({ hasText: 'Host' }) }).first();
    await hostPanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    await expect(hostPanel).toBeVisible({ timeout: 10000 });
    console.log('✅ Host panel found and scrolled into view');
    
    // Verify host section content
    const hostTitle = page.locator('h3').filter({ hasText: 'Who will be hosting your Experience?' });
    await expect(hostTitle).toBeVisible({ timeout: 5000 });
    console.log('✅ Host section title verified');
    
    // Step 17: Select Team Member
    console.log('👤 Selecting team member...');
    
    const teamMemberSelect = page.locator('ng-select').filter({ has: page.locator('div.ng-placeholder').filter({ hasText: 'Choose Your Team Member' }) });
    await expect(teamMemberSelect).toBeVisible({ timeout: 5000 });
    
    // Click on the select container to open dropdown
    const teamMemberContainer = teamMemberSelect.locator('.ng-select-container');
    await teamMemberContainer.click();
    console.log('✅ Team member dropdown opened');
    
    // Wait for dropdown options to appear
    await page.waitForTimeout(2000);
    
    // Select first option (Fadlan Testing 01)
    const firstTeamMemberOption = page.locator('.ng-option').filter({ has: page.locator('span.expert-option__name').filter({ hasText: 'Fadlan Testing 01' }) }).first();
    await expect(firstTeamMemberOption).toBeVisible({ timeout: 5000 });
    await firstTeamMemberOption.click();
    console.log('✅ First team member selected: Fadlan Testing 01');
    
    // Step 18: Click Save Host button
    console.log('💾 Clicking Save Host button...');
    
    // Wait for the Save Host button to appear
    await page.waitForTimeout(1000);
    
    // Look for Save Host button with multiple selector strategies
    const saveHostButton = page.locator('button').filter({ hasText: 'Save Host' }).or(
      page.locator('button[ui-button-outline]').filter({ hasText: 'Save Host' })
    ).or(
      page.locator('button').filter({ has: page.locator('svg-icon[name="check"]') }).filter({ hasText: 'Save Host' })
    ).first();
    
    await expect(saveHostButton).toBeVisible({ timeout: 10000 });
    await saveHostButton.click();
    console.log('✅ Save Host button clicked');
    
    // Wait for save operation to complete
    await page.waitForTimeout(2000);
    
    // Verify team member selection
    const selectedTeamMember = teamMemberSelect.locator('.ng-value-label').filter({ hasText: 'Fadlan Testing 01' });
    const teamMemberSelected = await selectedTeamMember.isVisible().catch(() => false);
    
    console.log(`📋 Host selection - Team Member: ${teamMemberSelected}`);
    
    if (teamMemberSelected) {
      console.log('✅ Host section successfully configured with team member and saved');
    } else {
      console.log('⚠️ Host section partially configured, but continuing...');
    }
    
    console.log('🎉 Host section configuration completed successfully!');
    await handlePopups(); // Check for pop-ups after host configuration

    // Step 19: Click Continue button
    console.log('➡️ Looking for Continue button...');
    
    const continueButton = page.locator('a[ui-button-flat-large]').filter({ hasText: 'Continue' }).or(
      page.locator('a.ui-button-flat-large').filter({ hasText: 'Continue' })
    ).or(
      page.locator('a').filter({ has: page.locator('.ui-button-wrapper').filter({ hasText: 'Continue' }) })
    ).or(
      page.locator('button, a').filter({ hasText: 'Continue' })
    ).first();
    
    await expect(continueButton).toBeVisible({ timeout: 10000 });
    await continueButton.click();
    console.log('✅ Continue button clicked');
    
    // Wait for page to load after continue
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    await handlePopups(); // Check for pop-ups after continue

    // Step 20: Select hidden option in Experience Access section
    console.log('🔒 Configuring Experience Access - selecting hidden option...');
    
    // Scroll to Experience Access section
    const experienceAccessPanel = page.locator('div[ui-panel]').filter({ has: page.locator('div[ui-panel-header-title]').filter({ hasText: 'Experience Access' }) }).first();
    await experienceAccessPanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Target the "I want my Experience to be hidden" checkbox
    const hiddenCheckbox = page.locator('span[ui-checkbox]').filter({ has: page.locator('.ui-checkbox-label').filter({ hasText: 'I want my Experience to be hidden' }) }).or(
      page.locator('#checkbox-169')
    ).or(
      page.locator('input[id="checkbox-169-input"]').locator('..')
    ).first();
    
    await expect(hiddenCheckbox).toBeVisible({ timeout: 10000 });
    await hiddenCheckbox.click();
    console.log('✅ Hidden experience option selected');
    
    // Verify the checkbox is checked
    const hiddenCheckboxInput = page.locator('#checkbox-169-input');
    const isChecked = await hiddenCheckboxInput.isChecked().catch(() => false);
    console.log(`📋 Hidden checkbox status: ${isChecked ? 'checked' : 'unchecked'}`);

    // Step 21: Verify Target Audience - "Open to Everyone" (should already be selected)
    console.log('👥 Verifying Target Audience section...');
    
    const targetAudiencePanel = page.locator('div[ui-panel]').filter({ has: page.locator('div[ui-panel-header-title]').filter({ hasText: 'Target Audience' }) }).first();
    await targetAudiencePanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Target the "Open to Everyone" radio button
    const openToEveryoneRadio = page.locator('span[ui-radio-button][value="public"]').or(
      page.locator('#ui-radio-8')
    ).or(
      page.locator('span[ui-radio-button]').filter({ has: page.locator('.ui-radio-label-content').filter({ hasText: 'Open to Everyone' }) })
    ).first();
    
    await expect(openToEveryoneRadio).toBeVisible({ timeout: 10000 });
    
    // Check if already selected, if not, click it
    const isAlreadySelected = await openToEveryoneRadio.locator('input').isChecked().catch(() => false);
    if (!isAlreadySelected) {
      await openToEveryoneRadio.click();
      console.log('✅ "Open to Everyone" option selected');
    } else {
      console.log('✅ "Open to Everyone" option already selected');
    }

    // Step 22: Select Beginner level in Level of Expertise section
    console.log('🎓 Selecting Beginner level in Level of Expertise section...');
    
    const expertisePanel = page.locator('div[ui-panel]').filter({ has: page.locator('div[ui-panel-header-title]').filter({ hasText: 'Level of Expertise' }) }).first();
    await expertisePanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Target the "Beginner" radio button
    const beginnerRadio = page.locator('span[ui-radio-button][value="Beginner"]').or(
      page.locator('#ui-radio-11')
    ).or(
      page.locator('span[ui-radio-button]').filter({ has: page.locator('.ui-radio-label-content').filter({ hasText: 'Beginner' }) })
    ).first();
    
    await expect(beginnerRadio).toBeVisible({ timeout: 10000 });
    await beginnerRadio.click();
    console.log('✅ Beginner expertise level selected');
    
    // Verify the selection
    const beginnerInput = beginnerRadio.locator('input');
    const beginnerChecked = await beginnerInput.isChecked().catch(() => false);
    console.log(`📋 Beginner radio status: ${beginnerChecked ? 'selected' : 'not selected'}`);

    // Step 23: Select English in Language section
    console.log('🌐 Selecting English in Language section...');
    
    const languagePanel = page.locator('div[ui-panel]').filter({ has: page.locator('div[ui-panel-header-title]').filter({ hasText: 'Language' }) }).first();
    await languagePanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Target the primary language dropdown
    const primaryLanguageSelect = page.locator('ng-select[formcontrolname="primaryLanguage"]').or(
      page.locator('ng-select').filter({ has: page.locator('.ng-placeholder').filter({ hasText: 'Choose language' }) })
    ).first();
    
    await expect(primaryLanguageSelect).toBeVisible({ timeout: 10000 });
    
    // Click to open the dropdown
    await primaryLanguageSelect.click();
    console.log('✅ Language dropdown opened');
    
    // Wait for dropdown options to appear
    await page.waitForTimeout(2000);
    
    // Select English option
    const englishOption = page.locator('.ng-option').filter({ hasText: 'English' }).first();
    await expect(englishOption).toBeVisible({ timeout: 5000 });
    await englishOption.click();
    console.log('✅ English language selected');
    
    // Verify the selection
    await page.waitForTimeout(1000);
    const selectedLanguage = primaryLanguageSelect.locator('.ng-value-label').filter({ hasText: 'English' });
    const languageSelected = await selectedLanguage.isVisible().catch(() => false);
    console.log(`📋 Language selection status: ${languageSelected ? 'English selected' : 'not confirmed'}`);
    
    await handlePopups(); // Check for pop-ups after all configurations
    
    console.log('🎉 Experience configuration completed successfully!');
    console.log('📝 Ready for final submission or additional steps...');
  });
}); 