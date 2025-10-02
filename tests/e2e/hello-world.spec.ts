import { test, expect } from '@playwright/test';

test('basic page load', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/UDS Protocol Simulator/);
});
