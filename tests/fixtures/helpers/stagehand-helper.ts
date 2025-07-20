import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

/**
 * Stagehand Helper Class
 * 
 * This helper class provides reusable methods for Stagehand test setup,
 * common operations, and structured data extraction.
 * 
 * Usage:
 * ```typescript
 * const helper = new StagehandHelper();
 * await helper.init();
 * await helper.navigateToLogin();
 * ```
 */
export class StagehandHelper {
  private stagehand: Stagehand | null = null;

  /**
   * Initialize Stagehand with optimal configuration
   * Uses Google Gemini API for cost-effectiveness
   */
  async init(): Promise<void> {
    // Set up API key with fallback
    process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyCqDH_o2bY8hzppKiBOHMLeEXTsLJOUQQw';
    
    this.stagehand = new Stagehand({
      modelName: 'gemini-1.5-flash',
      env: 'LOCAL',
      verbose: 1
    });

    await this.stagehand.init();
  }

  /**
   * Get the Stagehand page instance
   */
  get page() {
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized. Call init() first.');
    }
    return this.stagehand.page;
  }

  /**
   * Clean up Stagehand instance
   */
  async close(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      this.stagehand = null;
    }
  }

  /**
   * Navigate to Mereka platform and observe homepage
   */
  async navigateToLogin(): Promise<void> {
    await this.page.goto('https://www.mereka.io');
    await this.page.waitForLoadState('networkidle');
    
    // Observe homepage
    const homepageObs = await this.page.observe('What login and authentication options are available on this page?');
    console.log('🔍 Homepage observation:', homepageObs);
  }

  /**
   * Perform complete login flow with AI
   */
  async loginWithCredentials(email: string, password: string): Promise<void> {
    // Navigate to login if not already there
    await this.navigateToLogin();
    
    // Click login button
    await this.page.act('Click on the login button or login link');
    await this.page.waitForLoadState('networkidle');

    // Select email login method
    await this.page.act('Click on continue with email or email login option');
    await this.page.waitForLoadState('networkidle');

    // Enter email
    await this.page.act(`Fill in the email field with "${email}"`);
    await this.page.act('Click the continue button');
    await this.page.waitForLoadState('networkidle');

    // Enter password
    await this.page.act(`Fill in the password field with "${password}"`);
    await this.page.act('Click the sign in button');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if user is successfully logged in
   */
  async checkLoginStatus(): Promise<{
    isLoggedIn: boolean;
    userIndicator: string;
    currentPage: string;
  }> {
    const loginStatus = await this.page.extract({
      instruction: "Check if user is successfully logged in by looking for profile indicators, user menus, or dashboard elements",
      schema: z.object({
        isLoggedIn: z.boolean(),
        userIndicator: z.string(),
        currentPage: z.string()
      })
    });

    return loginStatus;
  }

  /**
   * Check for error messages and validation warnings
   */
  async checkForErrors(): Promise<{
    hasError: boolean;
    errorMessage: string;
    isLoginFailed: boolean;
  }> {
    const errorStatus = await this.page.extract({
      instruction: "Check for error messages, validation warnings, or failed login indicators",
      schema: z.object({
        hasError: z.boolean(),
        errorMessage: z.string(),
        isLoginFailed: z.boolean()
      })
    });

    return errorStatus;
  }

  /**
   * Check email validation status
   */
  async checkEmailValidation(): Promise<{
    hasValidationError: boolean;
    validationMessage: string;
    isContinueDisabled: boolean;
  }> {
    const validationStatus = await this.page.extract({
      instruction: "Check for email validation errors, warning messages, or disabled continue button",
      schema: z.object({
        hasValidationError: z.boolean(),
        validationMessage: z.string(),
        isContinueDisabled: z.boolean()
      })
    });

    return validationStatus;
  }

  /**
   * Perform password reset flow
   */
  async resetPassword(email: string): Promise<{
    isResetSent: boolean;
    confirmationMessage: string;
    currentPage: string;
  }> {
    // Navigate to forgot password
    await this.page.act('Click on the forgot password link or button');
    await this.page.waitForLoadState('networkidle');

    // Enter email for reset
    await this.page.act(`Fill in the email field with "${email}"`);
    await this.page.act('Click the send reset link button');
    await this.page.waitForLoadState('networkidle');

    // Check reset confirmation
    const resetStatus = await this.page.extract({
      instruction: "Check if password reset was successful by looking for success messages or confirmation",
      schema: z.object({
        isResetSent: z.boolean(),
        confirmationMessage: z.string(),
        currentPage: z.string()
      })
    });

    return resetStatus;
  }

  /**
   * Emergency observation for debugging
   */
  async emergencyObservation(): Promise<void> {
    const observation = await this.page.observe('What is currently visible on this page? Any error messages or unexpected content?');
    console.log('🚨 Emergency observation:', observation);
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for a specific amount of time
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
} 