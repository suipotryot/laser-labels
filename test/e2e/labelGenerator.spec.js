import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

async function fillScrewLabel(page) {
  await page.getByLabel('Largeur (mm)').fill('60');
  await page.getByLabel('Hauteur (mm)').fill('20');
  await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Vis' });
  await page.getByLabel("Type d'empreinte").selectOption({ label: 'Pozidriv' });
  await page.getByLabel("Taille d'empreinte").selectOption('PZ2');
  await page.getByLabel('Dimensions de la pièce').fill('3,5x50');
}

test.describe('generate button', () => {
  test('should preview the label sized in millimeters with its text lines', async ({ page }) => {
    await page.goto('/');
    await fillScrewLabel(page);

    await page.getByRole('button', { name: 'Générer' }).click();

    const preview = page.locator('#preview svg');
    await expect(preview).toHaveAttribute('width', '60mm');
    await expect(preview).toHaveAttribute('height', '20mm');
    await expect(preview.locator('text')).toHaveText(['Vis', '3,5x50', 'PZ2']);
  });

  test('should explain an invalid width instead of previewing', async ({ page }) => {
    await page.goto('/');
    await fillScrewLabel(page);
    await page.getByLabel('Largeur (mm)').fill('abc');

    await page.getByRole('button', { name: 'Générer' }).click();

    await expect(page.getByRole('alert')).toHaveText('La largeur doit être un nombre positif (en mm).');
    await expect(page.locator('#preview svg')).toHaveCount(0);
  });

  test('should draw a frame when the frame box is checked', async ({ page }) => {
    await page.goto('/');
    await fillScrewLabel(page);
    await page.getByLabel('Cadre').check();

    await page.getByRole('button', { name: 'Générer' }).click();

    await expect(page.locator('#preview svg rect')).toHaveCount(1);
  });

  test('should stack the text below the icon zone of a label taller than wide', async ({ page }) => {
    await page.goto('/');
    await fillScrewLabel(page);
    await page.getByLabel('Largeur (mm)').fill('20');
    await page.getByLabel('Hauteur (mm)').fill('60');

    await page.getByRole('button', { name: 'Générer' }).click();

    const firstLineBaseline = Number(await page.locator('#preview svg text').first().getAttribute('y'));
    expect(firstLineBaseline).toBeGreaterThan(20);
  });
});

test.describe('hardware type select', () => {
  test('should hide the drive fields for hardware without drive', async ({ page }) => {
    await page.goto('/');
    await fillScrewLabel(page);

    await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Écrou' });
    await page.getByLabel('Dimensions de la pièce').fill('M6');
    await page.getByRole('button', { name: 'Générer' }).click();

    await expect(page.getByLabel("Type d'empreinte")).toBeHidden();
    await expect(page.locator('#preview svg text')).toHaveText(['Écrou', 'M6']);
  });
});

test.describe('drive type select', () => {
  test('should offer the sizes of the chosen drive type', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel("Type d'empreinte").selectOption({ label: 'Torx' });

    await expect(page.getByLabel("Taille d'empreinte").locator('option')).toHaveText([
      'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T15', 'T20', 'T25', 'T27', 'T30', 'T40', 'T45', 'T50',
    ]);
  });
});

test.describe('download button', () => {
  test('should stay disabled until a label is generated', async ({ page }) => {
    await page.goto('/');
    const downloadButton = page.getByRole('button', { name: 'Télécharger' });

    await expect(downloadButton).toBeDisabled();
    await fillScrewLabel(page);
    await page.getByRole('button', { name: 'Générer' }).click();
    await expect(downloadButton).toBeEnabled();
  });

  test('should download the previewed SVG under a name describing its content', async ({ page }) => {
    await page.goto('/');
    await fillScrewLabel(page);
    await page.getByRole('button', { name: 'Générer' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('vis-3,5x50-pz2.svg');
    const downloadedSvg = await readFile(await download.path(), 'utf8');
    expect(downloadedSvg).toContain('width="60mm"');
    expect(downloadedSvg).toContain('>3,5x50</text>');
  });

  test('should be disabled again once the form changes after generation', async ({ page }) => {
    await page.goto('/');
    await fillScrewLabel(page);
    await page.getByRole('button', { name: 'Générer' }).click();

    await page.getByLabel('Dimensions de la pièce').fill('4x40');

    await expect(page.getByRole('button', { name: 'Télécharger' })).toBeDisabled();
  });
});
