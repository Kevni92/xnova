import { expect, test } from '@playwright/test';

test('Gebäude können betrachtet und in die Bauwarteschlange aufgenommen werden', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('register-email').fill('builder@example.com');
  await page.getByTestId('register-password').fill('geheim123');
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId('notice')).toContainText('Registrierung erfolgreich');
  await page.getByTestId('login-email').fill('builder@example.com');
  await page.getByTestId('login-password').fill('geheim123');
  await page.getByTestId('login-submit').click();
  await page.getByTestId('username-input').fill('Builder_1');
  await page.getByTestId('username-submit').click();

  await expect(page.getByTestId('resource-metal')).toContainText('500');
  await page.getByTestId('nav-buildings').click();
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
});
