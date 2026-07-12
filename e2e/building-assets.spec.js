import { expect, test } from '@playwright/test';

test('Metallmine zeigt das Wüstenplaneten-Gebäude in der Gebäudeliste', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('register-email').fill('building-asset@example.com');
  await page.getByTestId('register-password').fill('geheim123');
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId('notice')).toContainText('Registrierung erfolgreich');

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
  await expect(placeholder).toHaveCSS('opacity', '0');

  const artworkStyles = await visual.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      backgroundSizes: styles.backgroundSize.split(',').map((value) => value.trim()),
      backgroundPositions: styles.backgroundPosition.split(',').map((value) => value.trim()),
    };
  });

  expect(artworkStyles.backgroundSizes.every((value) => value === 'cover')).toBe(true);
  expect(artworkStyles.backgroundPositions.every((value) => value === '50% 50%')).toBe(true);
});
