import { expect, test } from '@playwright/test';

test('technische UI bleibt erhalten und Gebäude funktionieren real', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const authButtonRadius = await page.getByTestId('register-submit').evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
  );
  expect(authButtonRadius).toBeLessThanOrEqual(2);

  await page.getByTestId('register-email').fill('builder@example.com');
  await page.getByTestId('register-password').fill('geheim123');
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId('notice')).toContainText('Registrierung erfolgreich');
  await page.getByTestId('login-email').fill('builder@example.com');
  await page.getByTestId('login-password').fill('geheim123');
  await page.getByTestId('login-submit').click();
  await page.getByTestId('username-input').fill('Builder_1');
  await page.getByTestId('username-submit').click();

  await expect(page.getByTestId('ui-showcase')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Aktionen und Auswahl' })).toBeVisible();
  await expect(page.getByTestId('resource-metal')).toContainText('500');

  const visualLanguage = await page.evaluate(() => {
    const panel = getComputedStyle(document.querySelector('.component-panel'));
    const primaryButton = getComputedStyle(document.querySelector('.button--primary'));
    const shell = getComputedStyle(document.querySelector('.game-shell'));
    return {
      panelRadius: Number.parseFloat(panel.borderTopLeftRadius),
      primaryShadow: primaryButton.boxShadow,
      accent: shell.getPropertyValue('--primary').trim(),
    };
  });
  expect(visualLanguage.panelRadius).toBeLessThanOrEqual(2);
  expect(visualLanguage.primaryShadow).not.toBe('none');
  expect(visualLanguage.accent).toBe('#24d6d4');

  await page.getByTestId('nav-buildings').click();
  await expect(page.getByTestId('nav-buildings')).toHaveAttribute('aria-pressed', 'true');
  const mine = page.getByTestId('building-metalMine');
  await expect(mine).toContainText('Metallmine');
  await mine.getByRole('button', { name: 'Stufe 1 ausbauen' }).click();
  await expect(page.getByTestId('game-notice')).toContainText('Bauwarteschlange');
  await expect(page.getByTestId('resource-metal')).toContainText('440');
  await expect(page.getByTestId('build-queue')).toContainText('Metallmine · Stufe 1');

  await mine.getByRole('button', { name: 'Metallmine', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Metallmine' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Aktuelle und nächste zehn Stufen' })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('resource-metal')).not.toContainText('500');

  await page.setViewportSize({ width: 560, height: 900 });
  await page.getByTestId('mobile-menu-toggle').click();
  await expect(page.getByTestId('ui-showcase')).toHaveClass(/is-menu-open/);
});
