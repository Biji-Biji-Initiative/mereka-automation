import { test, expect } from '@playwright/test';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

/**
 * Stagehand Authentication Login Test - Positive Flow Only
 * 
 * This test suite uses Stagehand AI to test the successful login flow with natural language actions.
 * Stagehand provides resilient test automation that adapts to UI changes using AI-powered 
 * element detection and natural language instructions.
 * 
 * Features tested:
 * - Successful login with valid credentials
 * 
 * IMPORTANT: Requires API key setup for full AI functionality.
 * Environment variables needed:
 * - GOOGLE_API_KEY for Gemini (recommended for cost-effectiveness)
 * - OPENAI_API_KEY for OpenAI (alternative)
 * - TEST_ENV set to "live" for production testing
 * 
 * Run with: $env:TEST_ENV = "live"; npx playwright test tests/auth/login-stagehand.spec.ts --headed
 */

// Test data
const TEST_USER = {
  email: 'testingmereka01@gmail.com',
  password: 'merekamereka'
};

test.describe('Authentication - Positive Login Flow with Stagehand AI', () => {
  let stagehand: Stagehand;

  test.beforeEach(async () => {
    // Set up Stagehand with Google Gemini API (most cost-effective option)
    // Using fallback API key for demo purposes - replace with your own
    process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyCqDH_o2bY8hzppKiBOHMLeEXTsLJOUQQw';
    
    stagehand = new Stagehand({
      modelName: 'gemini-1.5-flash',
      env: 'LOCAL',
      verbose: 1
    });

    await stagehand.init();
  });

  test.afterEach(async () => {
    console.log('🧹 Cleaning up and closing browser...');
    if (stagehand) {
      try {
        await stagehand.close();
        console.log('✅ Stagehand browser closed successfully');
      } catch (error) {
        console.error('❌ Error closing Stagehand browser:', error);
      }
    }
  });

  test('should successfully login with valid credentials using AI', async () => {
    console.log('🚀 Starting AI-powered login flow with valid credentials...');

    try {
      // Step 1: Navigate to Mereka platform
      console.log('Step 1: Navigating to Mereka platform...');
      await stagehand.page.goto('https://www.mereka.io');
      await stagehand.page.waitForLoadState('networkidle');

      // Observe what page we landed on
      console.log('👀 Observing current page...');
      const pageObs = await stagehand.page.observe('What is this page? Is this the Mereka homepage with navigation and a Log In button in the top-right corner?');
      console.log('🔍 Page observation:', pageObs);

      // Check current URL to determine if we need to find a login button
      const currentUrl = stagehand.page.url();
      console.log('Current URL:', currentUrl);

      if (currentUrl.includes('auth') || currentUrl.includes('login')) {
        console.log('Already on login page, proceeding with authentication options...');
      } else {
        // Step 2: Find and click the "Log In" button in the navigation
        console.log('Step 2: Looking for Log In button in navigation...');
        
        // Detailed observation of the navigation area
        console.log('👀 Observing navigation area specifically...');
        const navObs = await stagehand.page.observe('What buttons and links are visible in the top navigation bar, especially in the top-right area?');
        console.log('🔍 Navigation observation:', navObs);
        
        // Try multiple approaches to find the login button
        try {
          // First, try the most specific description
          console.log('Attempting to click: black "Log In" button in top-right corner...');
          await stagehand.page.act('Click the black "Log In" button in the top-right corner of the navigation bar');
          console.log('✅ First attempt succeeded!');
        } catch (error) {
          console.log('❌ First attempt failed:', error.message);
          console.log('Trying alternative approach...');
          try {
            await stagehand.page.act('Look for a button with text "Log In" in the upper right area of the page and click it');
            console.log('✅ Second attempt succeeded!');
          } catch (error2) {
            console.log('❌ Second attempt failed:', error2.message);
            console.log('Trying third approach...');
            try {
              await stagehand.page.act('Find and click the login button located in the header navigation on the right side');
              console.log('✅ Third attempt succeeded!');
            } catch (error3) {
              console.log('❌ All attempts failed. Final observation...');
              const finalObs = await stagehand.page.observe('What clickable elements are available in the header or top area of the page?');
              console.log('🔍 Final observation:', finalObs);
              throw new Error(`Failed to find login button after multiple attempts. Final observation: ${finalObs}`);
            }
          }
        }
        
        await stagehand.page.waitForLoadState('networkidle');
      }

      // Observe login page to understand authentication methods
      console.log('👀 Observing authentication page...');
      const loginPageObs = await stagehand.page.observe('What login methods and form fields are available on this authentication page?');
      console.log('🔍 Authentication page observation:', loginPageObs);

      // Step 3: Select email login method
      console.log('Step 3: Selecting email login method...');
      await stagehand.page.act('Click on Continue with Email or email login option');
      await stagehand.page.waitForLoadState('networkidle');

      // Step 4: Enter email address
      console.log('Step 4: Entering email address...');
      await stagehand.page.act(`Fill in the email field with "${TEST_USER.email}"`);
      await stagehand.page.act('Click the continue button');
      await stagehand.page.waitForLoadState('networkidle');

      // Step 5: Enter password
      console.log('Step 5: Entering password...');
      await stagehand.page.act(`Fill in the password field with "${TEST_USER.password}"`);
      await stagehand.page.act('Click the sign in button');
      await stagehand.page.waitForLoadState('networkidle');

      // Step 6: Verify successful login by checking redirect to mereka.io
      console.log('Step 6: Verifying successful login by checking redirect...');
      
      // Wait a bit for any redirects to complete
      await stagehand.page.waitForTimeout(3000);
      
      // Check the final URL
      const finalUrl = stagehand.page.url();
      console.log('Final URL after login:', finalUrl);
      
      // Verify we're redirected back to mereka.io (successful login)
      expect(finalUrl).toContain('mereka.io');
      expect(finalUrl).not.toContain('auth.mereka.io');
      
      console.log('✅ AI-powered login test completed successfully! Redirected to:', finalUrl);

    } catch (error) {
      console.error('❌ AI-powered login failed:', error);
      
      // Emergency observation for debugging
      try {
        console.log('👀 Emergency observation of current page state...');
        const emergencyObs = await stagehand.page.observe('What is currently visible on this page? Any error messages or unexpected content?');
        console.log('🚨 Emergency observation:', emergencyObs);
      } catch (obsError) {
        console.error('❌ Could not perform emergency observation:', obsError);
      }
      
      // Ensure browser is closed even on failure
      console.log('🧹 Ensuring browser cleanup on failure...');
      if (stagehand) {
        try {
          await stagehand.close();
          console.log('✅ Browser closed after failure');
        } catch (closeError) {
          console.error('❌ Error closing browser after failure:', closeError);
        }
      }
      
      throw error;
    }
  });
}); 