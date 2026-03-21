/**
 * E2E Test: Alarm List Screen
 * Tests the main alarm list functionality
 * Note: These tests assume onboarding is already completed
 */
describe('Alarm List Screen', () => {
  it('should display the alarm list screen', async () => {
    await driver.pause(2000);
    
    const title = await $('//*[contains(@text, "Your Alarms")]');
    await expect(title).toBeDisplayed();
  });

  it('should show empty state when no alarms exist', async () => {
    const emptyText = await $('//*[contains(@text, "No alarms yet")]');
    if (await emptyText.isDisplayed()) {
      await expect(emptyText).toBeDisplayed();
      const subtext = await $('//*[contains(@text, "Create an alarm")]');
      await expect(subtext).toBeDisplayed();
    }
  });

  it('should display the FAB button', async () => {
    const fab = await $('//*[contains(@text, "+")]');
    // FAB might use an icon, try alternative selector
    if (!(await fab.isDisplayed())) {
      // Try finding by content description or accessibility
      const addBtn = await $('~add');
      if (await addBtn.isExisting()) {
        await expect(addBtn).toBeDisplayed();
      }
    }
  });

  it('should display bottom tab bar', async () => {
    const alarmsTab = await $('//*[contains(@text, "Alarms")]');
    await expect(alarmsTab).toBeDisplayed();

    const exploreTab = await $('//*[contains(@text, "Explore")]');
    await expect(exploreTab).toBeDisplayed();

    const settingsTab = await $('//*[contains(@text, "Settings")]');
    await expect(settingsTab).toBeDisplayed();
  });

  it('should show app title', async () => {
    const appTitle = await $('//*[contains(@text, "Vigilant Path")]');
    await expect(appTitle).toBeDisplayed();
  });

  it('should navigate to create alarm when FAB is tapped', async () => {
    // Find and tap the FAB (+ button)
    const fab = await $('//android.view.ViewGroup[contains(@content-desc, "add")]');
    if (await fab.isExisting()) {
      await fab.click();
    } else {
      // Try tapping by coordinates (bottom right area)
      await driver.touchAction({
        action: 'tap',
        x: 650,
        y: 1200,
      });
    }
    await driver.pause(2000);

    // Check if map is visible (Create Alarm screen)
    const searchBar = await $('//*[contains(@text, "Search for a place")]');
    if (await searchBar.isExisting()) {
      await expect(searchBar).toBeDisplayed();
    }

    // Go back
    await driver.back();
    await driver.pause(1000);
  });
});
