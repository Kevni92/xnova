import { expect, test } from '@playwright/test';

test('Metallmine zeigt das Wüstenplaneten-Gebäude in der Gebäudeliste', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('register-email').fill('building-asset@example.com');
  await page.getByTestId('register-password').fill('geheim123');
  await page.getByTestId('register-submit').click();
  await page.getByTestId('login-email').fill('building-asset@example.com');
  await page.getByTestId('login-password').fill('geheim123');
  await page.getByTestId('login-submit').click();
  await page.getByTestId('username-input').fill('AssetTester');
  await page.getByTestId('username-submit').click();

  await page.getByTestId('nav-buildings').click();

  const mine = page.getByTestId('building-metalMine');
  const visual = mine.locator('.game-card__visual');
  const placeholder = visual.locator('.building-card__placeholder-icon');

  await expect(mine).toContainText('Metallmine');
  await expect(visual).toBeVisible();
  await expect(visual).toHaveCSS('background-image', /building_metal_mine_desert\.svg/);
  await expect(visual).toHaveCSS('background-size', 'cover');
  await expect(placeholder).toHaveCSS('opacity', '0');
});
