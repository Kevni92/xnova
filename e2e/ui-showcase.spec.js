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
  await expect(page.getByTestId('resource-metal').locator('.resource-icon--metal .resource-icon__glyph')).toHaveCount(1);
  await expect(page.getByTestId('resource-metal').locator('.resource-item__icon')).toHaveText('');

  const resourceIconStyles = await page.evaluate(() => {
    const icons = [...document.querySelectorAll('.resource-icon')];
    const metal = document.querySelector('.resource-icon--metal');
    return {
      allBorderless: icons.every((icon) => Number.parseFloat(getComputedStyle(icon).borderTopWidth) === 0),
      metalColor: getComputedStyle(metal).color,
    };
  });
  expect(resourceIconStyles.allBorderless).toBe(true);
  expect(resourceIconStyles.metalColor).toBe('rgb(255, 93, 98)');

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

  const buildingLayout = await mine.evaluate((card) => {
    const visual = card.querySelector('.game-card__visual').getBoundingClientRect();
    const body = card.querySelector('.building-card__body').getBoundingClientRect();
    return {
      display: getComputedStyle(card).display,
      visualRatio: visual.width / visual.height,
      textIsRightOfVisual: body.left >= visual.right - 1,
      cardHeight: card.getBoundingClientRect().height,
    };
  });
  expect(buildingLayout.display).toBe('grid');
  expect(Math.abs(buildingLayout.visualRatio - 4 / 3)).toBeLessThan(0.08);
  expect(buildingLayout.textIsRightOfVisual).toBe(true);
  expect(buildingLayout.cardHeight).toBeLessThan(360);
  await expect(mine.locator('.building-card__description .resource-icon--metal')).toHaveCount(1);
  await expect(mine.locator('.building-card__upgrade-costs .resource-icon--metal')).toHaveCount(1);
  await expect(mine.locator('.building-card__upgrade-costs .resource-icon--metal .resource-icon__glyph')).toHaveCount(1);

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
  await page.getByTestId('nav-buildings').click();

  const mobileMine = page.getByTestId('building-metalMine');
  const mobileLayout = await mobileMine.evaluate((card) => {
    const visual = card.querySelector('.game-card__visual').getBoundingClientRect();
    const body = card.querySelector('.building-card__body').getBoundingClientRect();
    return {
      visualRatio: visual.width / visual.height,
      textIsRightOfVisual: body.left >= visual.right - 1,
    };
  });
  expect(Math.abs(mobileLayout.visualRatio - 4 / 3)).toBeLessThan(0.08);
  expect(mobileLayout.textIsRightOfVisual).toBe(true);
});
