import { defineConfig, devices } from '@playwright/test';

// Environment configuration
const environments = {
  dev: {
    baseURL: 'https://mereka.dev',
    timeout: 30000,
  },
  staging: {
    baseURL: 'https://staging.mereka.io', // Replace with your actual staging URL
    timeout: 30000,
  },
  live: {
    baseURL: 'https://www.mereka.io',
    timeout: 30000,
  }
};

// Get environment from ENV variable, default to 'live'
const ENV = process.env.TEST_ENV || 'live';
const envConfig = environments[ENV as keyof typeof environments] || environments.live;

console.log(`🚀 Running tests against: ${ENV.toUpperCase()} environment (${envConfig.baseURL})`);

export default defineConfig({
  testDir: './mereka-automation',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Set to 5 for parallel execution
  workers: 5,
  reporter: [
    ['html', { open: 'always' }],
    ['list']
  ],
  timeout: envConfig.timeout,
  use: {
    baseURL: envConfig.baseURL,
    trace: 'on',
    video: 'on',
    screenshot: 'on'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
}); 