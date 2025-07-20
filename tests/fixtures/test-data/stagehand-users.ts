/**
 * Stagehand Test Data - User Credentials and Test Scenarios
 * 
 * This file contains test data specifically for Stagehand AI-powered tests.
 * It includes user credentials, test scenarios, and validation data.
 * 
 * Usage: import { StagehandTestData } from '../fixtures/test-data/stagehand-users';
 */

export const StagehandTestData = {
  // Valid test user for successful login scenarios
  validUser: {
    email: 'testingmereka01@gmail.com',
    password: 'merekamereka',
    expectedRole: 'user',
    description: 'Valid user for testing successful login flows'
  },

  // Invalid credentials for error testing
  invalidCredentials: {
    wrongPassword: {
      email: 'testingmereka01@gmail.com',
      password: 'wrongpassword123',
      expectedError: 'Wrong password. Try again'
    },
    invalidEmail: {
      email: 'invalid@nonexistent.com',
      password: 'somepassword',
      expectedError: 'User not found'
    }
  },

  // Email validation test cases
  emailValidation: {
    invalidFormats: [
      'invalidemailformat',
      'missing@domain',
      '@missinguser.com',
      'spaces in@email.com',
      'special#chars@domain.com'
    ],
    validFormats: [
      'user@domain.com',
      'test.user@example.org',
      'user+tag@company.co.uk'
    ],
    expectedValidationMessage: 'Email is invalid'
  },

  // Password reset test data
  passwordReset: {
    validEmail: 'testingmereka01@gmail.com',
    expectedSuccessMessage: 'The Link is sent successfully',
    expectedPageTitle: 'Forgot your password?'
  },

  // AI observation prompts for different test scenarios
  aiPrompts: {
    loginSuccess: 'Is the user successfully logged in? Look for profile menus, dashboard elements, or user indicators',
    loginError: 'Are there any error messages or validation warnings displayed? What does the login form show?',
    emailValidation: 'Are there any email validation errors or warnings? Is the continue button disabled?',
    passwordReset: 'Is there a success message or confirmation that the reset link was sent?',
    homepage: 'What login and authentication options are available on this page?',
    loginPage: 'What login methods and form fields are available on this authentication page?',
    forgotPassword: 'What options are available on the forgot password page? Are there form fields or instructions?'
  },

  // Expected UI elements for verification
  expectedElements: {
    loginButton: ['Log In', 'Login', 'Sign In'],
    emailButton: ['Continue with Email', 'Email'],
    continueButton: ['Continue'],
    signInButton: ['Sign In'],
    forgotPasswordButton: ['Forgot password', 'Forgot Password'],
    sendResetButton: ['Send reset link', 'Send Reset Link']
  },

  // Test environment configuration
  environment: {
    baseURL: 'https://www.mereka.io',
    timeout: 30000,
    retries: 3
  }
};

// Export individual components for convenience
export const { validUser, invalidCredentials, emailValidation, passwordReset, aiPrompts, expectedElements, environment } = StagehandTestData; 