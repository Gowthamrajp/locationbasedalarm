/**
 * Appium + WebdriverIO Configuration for Vigilant Path E2E Tests
 *
 * Run locally: npx wdio tests/appium/wdio.conf.js
 * Run in CI: Configured to use Android emulator in GitHub Actions
 */

const path = require('path');

exports.config = {
  runner: 'local',
  port: 4723,
  specs: ['./tests/appium/specs/**/*.test.js'],
  maxInstances: 1,

  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': process.env.DEVICE_NAME || 'emulator-5554',
    'appium:app': process.env.APK_PATH || path.resolve(__dirname, '../../android/app/build/outputs/apk/release/app-release.apk'),
    'appium:automationName': 'UiAutomator2',
    'appium:newCommandTimeout': 240,
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:autoGrantPermissions': true,
  }],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: 30000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: ['appium'],
  appium: {
    args: {
      relaxedSecurity: true,
    },
  },

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },
};
