import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { computeLayout } from '../../src/label/layout.js';

const FONT_LOADING_FAILURE_NOTICE = "La police de gravure n'a pas pu être chargée : rechargez la page.";
const SMALL_DETAILS_NOTICE = "Certains détails sont très petits : ils risquent d'être illisibles une fois gravés.";

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(previewSvgOf(page)).toHaveCount(1);
});

async function fillScrewLabel(page) {
  await page.getByLabel('Largeur (mm)').fill('60');
  await page.getByLabel('Hauteur (mm)').fill('20');
  await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Vis' });
  await page.getByLabel("Type d'empreinte").selectOption({ label: 'Pozidriv' });
  await page.getByLabel("Taille d'empreinte").selectOption('PZ2');
  await page.getByLabel('Dimensions de la pièce').fill('3,5x50');
}

function previewSvgOf(page) {
  return page.locator('#preview svg');
}

function downloadButtonOf(page) {
  return page.getByRole('button', { name: 'Télécharger' });
}

async function downloadLabel(page) {
  const downloadPromise = page.waitForEvent('download');
  await downloadButtonOf(page).click();
  return downloadPromise;
}

function textPathsOf(page) {
  return previewSvgOf(page).locator('path[aria-label]');
}

function textLinesOf(page) {
  return textPathsOf(page).evaluateAll((paths) => paths.map((path) => path.getAttribute('aria-label')));
}

const ROUNDING_TOLERANCE_MILLIMETERS = 0.001;

function isInsideZone(box, zone) {
  return box.left >= zone.x - ROUNDING_TOLERANCE_MILLIMETERS
    && box.right <= zone.x + zone.width + ROUNDING_TOLERANCE_MILLIMETERS
    && box.top >= zone.y - ROUNDING_TOLERANCE_MILLIMETERS
    && box.bottom <= zone.y + zone.height + ROUNDING_TOLERANCE_MILLIMETERS;
}

function textBoxesOf(page) {
  return textPathsOf(page).evaluateAll((paths) => paths.map((path) => {
    const { x, y, width, height } = path.getBBox();
    return { left: x, top: y, right: x + width, bottom: y + height };
  }));
}

test.describe('preview', () => {
  test('should draw the label as soon as the page opens', async ({ page }) => {
    await expect(previewSvgOf(page)).toHaveAttribute('width', '60mm');
  });

  test('should need no button to draw the label', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Générer' })).toHaveCount(0);
  });

  test('should redraw the label as soon as a field changes', async ({ page }) => {
    await page.getByLabel('Dimensions de la pièce').fill('4x40');

    await expect(textPathsOf(page)).toHaveAttribute('aria-label', '4x40');
  });

  test('should keep the label drawn when Enter is pressed in a field', async ({ page }) => {
    await page.getByLabel('Dimensions de la pièce').fill('4x40');

    await page.getByLabel('Dimensions de la pièce').press('Enter');

    await expect(textPathsOf(page)).toHaveAttribute('aria-label', '4x40');
    await expect(page.getByLabel('Dimensions de la pièce')).toHaveValue('4x40');
  });

  test('should show the label sized in millimeters with its text lines', async ({ page }) => {
    await fillScrewLabel(page);

    const preview = previewSvgOf(page);
    await expect(preview).toHaveAttribute('width', '60mm');
    await expect(preview).toHaveAttribute('height', '20mm');
    expect(await textLinesOf(page)).toEqual(['3,5x50', 'PZ2']);
  });

  test('should draw the icon of the chosen drive just before its size', async ({ page }) => {
    await fillScrewLabel(page);
    await page.getByLabel("Type d'empreinte").selectOption({ label: 'Torx inviolable' });
    await page.getByLabel("Taille d'empreinte").selectOption('T20H');

    const driveIcon = page.locator('#preview svg path[data-drive-icon]');
    await expect(driveIcon).toHaveAttribute('data-drive-icon', 'torxTamperResistant');
    const iconRight = await driveIcon.evaluate((path) => path.getBBox().x + path.getBBox().width);
    const [, driveSizeBox] = await textBoxesOf(page);
    expect(iconRight).toBeLessThan(driveSizeBox.left);
  });

  test('should explain an invalid width while keeping the last valid label greyed out', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel('Largeur (mm)').fill('abc');

    await expect(page.getByRole('alert')).toHaveText('La largeur doit être un nombre positif (en mm).');
    await expect(textPathsOf(page)).toHaveCount(2);
    await expect(page.locator('#preview')).toHaveClass(/is-outdated/);
  });

  test('should list the characters the font cannot engrave while keeping the last valid label greyed out', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel('Dimensions de la pièce').fill('⌀6 j́');

    await expect(page.getByRole('alert')).toHaveText('Ces caractères ne peuvent pas être gravés : ⌀ ́');
    await expect(page.locator('#preview')).toHaveClass(/is-outdated/);
  });

  test('should not announce the same error again while the field stays invalid', async ({ page }) => {
    await page.getByLabel('Largeur (mm)').fill('abc');
    await page.locator('#error-message').evaluate((errorMessage) => {
      globalThis.errorMessageChanges = 0;
      new globalThis.MutationObserver((changes) => {
        globalThis.errorMessageChanges += changes.length;
      }).observe(errorMessage, { childList: true, characterData: true, subtree: true });
    });

    await page.getByLabel('Largeur (mm)').pressSequentially('de');

    await expect(page.getByRole('alert')).toHaveText('La largeur doit être un nombre positif (en mm).');
    expect(await page.evaluate(() => globalThis.errorMessageChanges)).toBe(0);
  });

  test('should clear the previous error once the field is valid again', async ({ page }) => {
    await fillScrewLabel(page);
    await page.getByLabel('Largeur (mm)').fill('abc');

    await page.getByLabel('Largeur (mm)').fill('60');

    await expect(page.getByRole('alert')).toBeEmpty();
    await expect(previewSvgOf(page)).toHaveCount(1);
    await expect(page.locator('#preview')).not.toHaveClass(/is-outdated/);
  });

  test('should draw a frame when the frame box is checked', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel('Cadre').check();

    await expect(page.locator('#preview svg rect')).toHaveCount(1);
  });

  test('should stack the text below the icon zone of a label taller than wide', async ({ page }) => {
    await fillScrewLabel(page);
    await page.getByLabel('Largeur (mm)').fill('20');
    await page.getByLabel('Hauteur (mm)').fill('60');

    const { iconZone } = computeLayout({ width: 20, height: 60 });
    for (const textBox of await textBoxesOf(page)) {
      expect(textBox.top).toBeGreaterThan(iconZone.y + iconZone.height);
    }
  });

  test('should keep long dimensions inside the text zone', async ({ page }) => {
    await page.getByLabel('Largeur (mm)').fill('60');
    await page.getByLabel('Hauteur (mm)').fill('20');
    await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Cheville Molly' });
    await page.getByLabel('Dimensions de la pièce').fill('M5 x 52 tête fraisée inox A2');

    const { textZone } = computeLayout({ width: 60, height: 20 });
    const textBoxes = await textBoxesOf(page);
    expect(textBoxes).toHaveLength(1);
    for (const textBox of textBoxes) {
      expect(isInsideZone(textBox, textZone)).toBe(true);
    }
  });

  test('should still draw a label whose text is too small to read, with a notice', async ({ page }) => {
    await page.getByLabel('Largeur (mm)').fill('20');
    await page.getByLabel('Hauteur (mm)').fill('10');
    await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Cheville Molly' });
    await page.getByLabel('Dimensions de la pièce').fill('M5 x 52 tête fraisée');

    expect(await textLinesOf(page)).toEqual(['M5 x 52 tête fraisée']);
    await expect(page.getByText(SMALL_DETAILS_NOTICE)).toBeVisible();
  });

  test('should still draw a label whose drive icon is too detailed to engrave, with a notice', async ({ page }) => {
    await fillScrewLabel(page);
    await page.getByLabel('Largeur (mm)').fill('25');
    await page.getByLabel('Hauteur (mm)').fill('8');
    await page.getByLabel('Dimensions de la pièce').fill('3x16');

    await expect(page.locator('#preview svg path[data-drive-icon]')).toHaveCount(1);
    await expect(page.getByText(SMALL_DETAILS_NOTICE)).toBeVisible();
  });

  test('should clear the preview and explain an unexpected error instead of keeping the previous label', async ({ page }) => {
    await page.locator('#preview').evaluate((preview) => {
      Object.defineProperty(preview, 'innerHTML', { set: () => { throw new Error('Display broken'); } });
    });

    await page.getByLabel('Dimensions de la pièce').fill('4x40');

    await expect(page.getByRole('alert')).toHaveText("Une erreur inattendue empêche de dessiner l'étiquette.");
    await expect(previewSvgOf(page)).toHaveCount(0);
    await expect(downloadButtonOf(page)).toBeDisabled();
  });

  test('should tell the font is loading until the label can be drawn', async ({ page }) => {
    await page.addInitScript(() => {
      globalThis.fetch = () => new Promise(() => {});
    });

    await page.reload();

    await expect(page.getByRole('status')).toHaveText('Chargement de la police de gravure…');
  });

  test('should explain that no label can be drawn when the font fails to load', async ({ page }) => {
    await page.addInitScript(() => {
      globalThis.fetch = () => Promise.reject(new Error('Network down'));
    });

    await page.reload();

    await expect(page.getByRole('alert')).toHaveText(FONT_LOADING_FAILURE_NOTICE);
    await expect(previewSvgOf(page)).toHaveCount(0);
    await expect(downloadButtonOf(page)).toBeDisabled();
  });

  test('should explain that no label can be drawn when the font cannot be found', async ({ page }) => {
    await page.addInitScript(() => {
      globalThis.fetch = () => Promise.resolve(new Response(null, { status: 404 }));
    });

    await page.reload();

    await expect(page.getByRole('alert')).toHaveText(FONT_LOADING_FAILURE_NOTICE);
    await expect(previewSvgOf(page)).toHaveCount(0);
    await expect(downloadButtonOf(page)).toBeDisabled();
  });
});

test.describe('hardware type select', () => {
  test('should hide the drive fields for hardware without drive', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Écrou' });

    await expect(page.getByLabel("Type d'empreinte")).toBeHidden();
  });

  test('should leave the hidden drive out of the label', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Écrou' });
    await page.getByLabel('Dimensions de la pièce').fill('M6');

    expect(await textLinesOf(page)).toEqual(['M6']);
  });

  test('should drop the drive from the label as soon as a hardware without drive is chosen', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Écrou' });

    expect(await textLinesOf(page)).toEqual(['3,5x50']);
    await expect(page.locator('#preview svg path[data-drive-icon]')).toHaveCount(0);
  });

  test('should show the drive fields again when coming back to a screw', async ({ page }) => {
    await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Écrou' });

    await page.getByLabel('Type de quincaillerie').selectOption({ label: 'Vis' });

    await expect(page.getByLabel("Type d'empreinte")).toBeVisible();
  });
});

test.describe('drive type select', () => {
  test('should offer the sizes of the chosen drive type', async ({ page }) => {
    await page.getByLabel("Type d'empreinte").selectOption({ label: 'Torx' });

    await expect(page.getByLabel("Taille d'empreinte").locator('option')).toHaveText([
      'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T15', 'T20', 'T25', 'T27', 'T30', 'T40', 'T45', 'T50',
    ]);
  });

  test('should offer the usual tamper resistant Torx sizes', async ({ page }) => {
    await page.getByLabel("Type d'empreinte").selectOption({ label: 'Torx inviolable' });

    await expect(page.getByLabel("Taille d'empreinte").locator('option')).toHaveText([
      'T8H', 'T9H', 'T10H', 'T15H', 'T20H', 'T25H', 'T27H', 'T30H', 'T40H', 'T45H', 'T50H',
    ]);
  });

  test('should offer no size when no drive is chosen', async ({ page }) => {
    await page.getByLabel("Type d'empreinte").selectOption({ label: 'Torx' });

    await page.getByLabel("Type d'empreinte").selectOption({ label: 'Aucune' });

    await expect(page.getByLabel("Taille d'empreinte").locator('option')).toHaveCount(0);
  });

  test('should draw the first size of a newly chosen drive type', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel("Type d'empreinte").selectOption({ label: 'Torx' });

    expect(await textLinesOf(page)).toEqual(['3,5x50', 'T5']);
  });

  test('should let a screw label go without drive', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel("Type d'empreinte").selectOption({ label: 'Aucune' });

    expect(await textLinesOf(page)).toEqual(['3,5x50']);
  });
});

test.describe('download button', () => {
  test('should be enabled once the label is drawn', async ({ page }) => {
    await expect(downloadButtonOf(page)).toBeEnabled();
  });

  test('should download the drawn SVG under a name describing its content', async ({ page }) => {
    await fillScrewLabel(page);

    const download = await downloadLabel(page);

    expect(download.suggestedFilename()).toBe('vis-3,5x50-pz2.svg');
    const downloadedSvg = await readFile(await download.path(), 'utf8');
    expect(downloadedSvg).toContain('width="60mm"');
    expect(downloadedSvg).toContain('aria-label="3,5x50"');
    expect(downloadedSvg).not.toContain('<text');
  });

  test('should download the label as drawn after the latest change', async ({ page }) => {
    await fillScrewLabel(page);
    await page.getByLabel('Dimensions de la pièce').fill('4x40');

    const download = await downloadLabel(page);

    expect(download.suggestedFilename()).toBe('vis-4x40-pz2.svg');
    expect(await readFile(await download.path(), 'utf8')).toContain('aria-label="4x40"');
  });

  test('should be disabled while a field is invalid', async ({ page }) => {
    await fillScrewLabel(page);

    await page.getByLabel('Largeur (mm)').fill('abc');

    await expect(downloadButtonOf(page)).toBeDisabled();
  });
});
