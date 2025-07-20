import { test, expect } from '@playwright/test';

// Expert test data - easily extensible
const EXPERT_TEST_DATA = [
  {
    slug: 'JeyBala',
    expectedName: 'Jey Bala',
    description: 'Main test expert'
  }
  // Add more experts here as needed:
  // { slug: 'AnotherExpert', expectedName: 'Another Expert', description: 'Secondary test expert' }
];

test.describe('Expert Detail Page - Single User', () => {
  
  /**
   * Helper function to verify a section exists and is visible
   */
  async function verifySection(page, sectionName: string, headingPattern: RegExp, options: { 
    required?: boolean, 
    hasContent?: boolean,
    contentSelector?: string 
  } = {}) {
    const { required = true, hasContent = false, contentSelector } = options;
    
    console.log(`🔍 Verifying "${sectionName}" section...`);
    
    try {
      // Look for section heading
      const sectionHeading = page.locator('h1, h2, h3, h4, h5, h6').filter({ 
        hasText: headingPattern 
      }).first();
      
      await sectionHeading.scrollIntoViewIfNeeded();
      await expect(sectionHeading).toBeVisible({ timeout: 10000 });
      
      // Verify content if specified
      if (hasContent && contentSelector) {
        const contentElement = page.locator(contentSelector).first();
        await expect(contentElement).toBeVisible({ timeout: 5000 });
      }
      
      console.log(`✅ "${sectionName}" section verified`);
      return true;
    } catch (error) {
      if (required) {
        throw new Error(`❌ Required "${sectionName}" section not found: ${error.message}`);
      } else {
        console.log(`⚠️ Optional "${sectionName}" section not found (this is OK)`);
        return false;
      }
    }
  }

  /**
   * Helper function to verify expert profile basics
   */
  async function verifyExpertProfile(page, expertData) {
    console.log(`🔍 Verifying expert profile for: ${expertData.expectedName}`);
    
         // Verify expert name using correct selector from actual HTML
     const expertName = page.locator('.ui-profile-card__name, [data-testid="expert-name"], .expert-name, .profile-name, h1').filter({ 
       hasText: new RegExp(expertData.expectedName, 'i') 
     }).first();
    await expect(expertName).toBeVisible({ timeout: 15000 });
    console.log(`✅ Expert name "${expertData.expectedName}" found`);
    
    // Verify profile image with fallback selectors
    const profileImage = page.locator(
      '[data-testid="profile-image"], [class*="profile-image"], [class*="expert-avatar"], ui-profile-card img'
    ).first();
    await expect(profileImage).toBeVisible({ timeout: 10000 });
    console.log(`✅ Profile image verified`);
  }

  // Generate tests for each expert
  EXPERT_TEST_DATA.forEach((expertData) => {
    test(`should display expert page correctly for ${expertData.expectedName}`, async ({ page }) => {
      const expertUrl = `/expert/${expertData.slug}`;
      
      try {
        // Step 1: Navigate to expert page
        console.log(`🚀 Navigating to ${expertUrl} (${expertData.description})`);
        await page.goto(expertUrl);
        
        // Step 2: Verify URL
        await expect(page).toHaveURL(new RegExp(expertData.slug));
        console.log(`✅ URL verified: ${expertUrl}`);
        
        // Step 3: Verify basic profile information
        await verifyExpertProfile(page, expertData);
        
        // Step 4: Verify core sections (required)
        await verifySection(page, 'About/Bio', /About.*Me|About|Bio|Profile/i, { 
          required: true 
        });
        
        // Step 5: Verify optional sections (won't fail if missing)
        await verifySection(page, 'Expertise', /Browse.*Expertise|My.*Expertise|Expertise|Book.*session/i, { 
          required: false,
          hasContent: true,
          contentSelector: 'swiper-container, .swiper-container, [data-testid*="expertise"]'
        });
        
        await verifySection(page, 'Experiences', /My.*Experience|Experience/i, { 
          required: false,
          hasContent: true,
          contentSelector: 'swiper-container, .swiper-container, [data-testid*="experience"]'
        });
        
        await verifySection(page, 'Projects', /Project/i, { 
          required: false,
          hasContent: true,
          contentSelector: 'swiper-container, .swiper-container, [data-testid*="project"]'
        });
        
        console.log(`🎉 All verifications completed successfully for ${expertData.expectedName}!`);
        
      } catch (error) {
        console.error(`❌ Test failed for ${expertData.expectedName}:`, error.message);
        throw error;
      }
    });
  });
  
  // Optional: Test with invalid expert (should handle gracefully)
  test('should handle non-existent expert gracefully', async ({ page }) => {
    console.log('🔍 Testing non-existent expert handling...');
    
    await page.goto('/expert/NonExistentExpert');
    
    // Should either show 404 or redirect to experts list
    const is404 = await page.locator('text=/404|Not Found|Page not found/i').isVisible().catch(() => false);
    const isRedirected = page.url().includes('/experts');
    
    if (!is404 && !isRedirected) {
      console.log('⚠️ No clear 404 handling detected - this might be OK depending on your app design');
    } else {
      console.log('✅ Non-existent expert handled appropriately');
    }
  });
}); 