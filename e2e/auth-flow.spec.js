import { expect, test } from '@playwright/test';

test('Registrierung, Login, Username und Logout funktionieren', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('register-email').fill('pilot@example.com');
  await page.getByTestId('register-password').fill('geheim123');
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId('notice')).toContainText('Registrierung erfolgreich');

  await page.getByTestId('login-email').fill('pilot@example.com');
  await page.getByTestId('login-password').fill('geheim123');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('username-screen')).toBeVisible();

  await page.getByTestId('username-input').fill('Commander_7');
  await page.getByTestId('username-submit').click();
  await expect(page.getByTestId('greeting')).toHaveText(
    'Hallo Commander_7, du bist eingeloggt.',
  );

  await page.reload();
  await expect(page.getByTestId('greeting')).toHaveText(
    'Hallo Commander_7, du bist eingeloggt.',
  );

  await page.getByTestId('logout-button').click();
  await expect(page.getByTestId('auth-screen')).toBeVisible();
});
