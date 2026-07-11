import { expect, test } from '@playwright/test';

test('UI-Showcase zeigt und bedient zentrale Spielkomponenten', async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 900 });
  await page.goto('/');

  await page.getByTestId('register-email').fill('designer@example.com');
  await page.getByTestId('register-password').fill('geheim123');
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId('notice')).toContainText('Registrierung erfolgreich');

  await page.getByTestId('login-email').fill('designer@example.com');
  await page.getByTestId('login-password').fill('geheim123');
  await page.getByTestId('login-submit').click();
  await page.getByTestId('username-input').fill('Designer_1');
  await page.getByTestId('username-submit').click();

  await expect(page.getByTestId('ui-showcase')).toBeVisible();
  await expect(page.getByTestId('resource-metal')).toContainText('12.480');
  await expect(page.getByRole('heading', { name: 'Aktionen und Auswahl' })).toBeVisible();

  const buildingsChip = page.getByRole('button', { name: 'Gebäude' });
  await buildingsChip.click();
  await expect(buildingsChip).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Tabellenzeile nach Metall sortieren' }).click();
  await expect(page.getByTestId('planet-table-body').locator('tr').first()).toContainText('Luna Outpost');

  await page.getByRole('button', { name: 'Dialog öffnen' }).click();
  await expect(page.getByTestId('demo-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Bestätigen' }).click();
  await expect(page.getByTestId('toast')).toContainText('Auftrag wurde erfolgreich vorgemerkt');

  await page.getByRole('button', { name: 'Gameplay' }).click();
  await expect(page.getByRole('heading', { name: 'Gebäude und Forschung' })).toBeVisible();
  await expect(page.getByText('Metallmine · Stufe 18')).toBeVisible();

  await page.getByTestId('mobile-menu-toggle').click();
  await expect(page.getByTestId('ui-showcase')).toHaveClass(/is-menu-open/);
});
