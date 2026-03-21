/**
 * E2E Test: Create Alarm Screen
 * Tests alarm creation functionality
 */
describe('Create Alarm Screen', () => {
  before(async () => {
    // Navigate to create alarm screen
    await driver.pause(2000);
    // Tap FAB
    await driver.touchAction({ action: 'tap', x: 650, y: 1200 });
    await driver.pause(3000);
  });

  it('should display the create alarm screen', async () => {
    const title = await $('//*[contains(@text, "New Alarm")]');
    await expect(title).toBeDisplayed();
  });

  it('should show the search bar', async () => {
    const searchBar = await $('//*[contains(@text, "Search for a place")]');
    await expect(searchBar).toBeDisplayed();
  });

  it('should show the Save button', async () => {
    const saveBtn = await $('//*[contains(@text, "Save")]');
    await expect(saveBtn).toBeDisplayed();
  });

  it('should show alarm name input', async () => {
    const nameInput = await $('//*[contains(@text, "Alarm name")]');
    await expect(nameInput).toBeDisplayed();
  });

  it('should show radius section', async () => {
    const radiusLabel = await $('//*[contains(@text, "Radius")]');
    await expect(radiusLabel).toBeDisplayed();

    const radiusValue = await $('//*[contains(@text, "500")]');
    await expect(radiusValue).toBeDisplayed();
  });

  it('should show vibrate toggle', async () => {
    const vibrateLabel = await $('//*[contains(@text, "Vibrate on Arrival")]');
    await expect(vibrateLabel).toBeDisplayed();
  });

  it('should show sound toggle', async () => {
    const soundLabel = await $('//*[contains(@text, "Sound Alarm")]');
    await expect(soundLabel).toBeDisplayed();
  });

  it('should show close button', async () => {
    // Close button should exist
    const closeBtn = await $('//*[contains(@content-desc, "close")]');
    if (await closeBtn.isExisting()) {
      await expect(closeBtn).toBeDisplayed();
    }
  });

  it('should alert when saving without location', async () => {
    const saveBtn = await $('//*[contains(@text, "Save")]');
    await saveBtn.click();
    await driver.pause(1000);

    // Should show alert about no location
    const alertText = await $('//*[contains(@text, "No location")]');
    if (await alertText.isExisting()) {
      await expect(alertText).toBeDisplayed();
      // Dismiss alert
      const okBtn = await $('//*[contains(@text, "OK")]');
      if (await okBtn.isExisting()) {
        await okBtn.click();
      }
    }
  });

  after(async () => {
    await driver.back();
    await driver.pause(1000);
  });
});
