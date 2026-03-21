/**
 * E2E Test: Onboarding Flow
 * Tests the 4-step permission onboarding process
 */
describe('Onboarding Flow', () => {
  it('should display the welcome screen on first launch', async () => {
    // Wait for app to load
    await driver.pause(3000);

    // Check for welcome screen elements
    const title = await $('//*[contains(@text, "Vigilant Path")]');
    await expect(title).toBeDisplayed();

    const getStartedBtn = await $('//*[contains(@text, "Get Started")]');
    await expect(getStartedBtn).toBeDisplayed();
  });

  it('should show feature chips on welcome screen', async () => {
    const gpsChip = await $('//*[contains(@text, "GPS Geofencing")]');
    await expect(gpsChip).toBeDisplayed();

    const soundChip = await $('//*[contains(@text, "Alarm Sound")]');
    await expect(soundChip).toBeDisplayed();
  });

  it('should navigate to location permission screen after Get Started', async () => {
    const getStartedBtn = await $('//*[contains(@text, "Get Started")]');
    await getStartedBtn.click();
    await driver.pause(1000);

    const locationTitle = await $('//*[contains(@text, "Location Access")]');
    await expect(locationTitle).toBeDisplayed();

    const allowBtn = await $('//*[contains(@text, "Allow Location Access")]');
    await expect(allowBtn).toBeDisplayed();
  });

  it('should show privacy details on location screen', async () => {
    const privacyText = await $('//*[contains(@text, "stays on your device")]');
    await expect(privacyText).toBeDisplayed();
  });
});
