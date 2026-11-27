import { test, expect } from '@playwright/test';

async function askImageInHiddenFrame(page, query) {
  await page.goto('/');
  return page.evaluate((frameQuery) => new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    window.addEventListener('message', (event) => {
      if (event.source === frame.contentWindow) {
        resolve(event.data);
      }
    });
    frame.src = `/?mode=image&${frameQuery}`;
    document.body.append(frame);
  }), query);
}

test.describe('image mode', () => {
  test('should send the label svg and its size to the embedding page', async ({ page }) => {
    const answer = await askImageInHiddenFrame(page, 'width=60&height=20&hardwareType=screw&driveType=pozidriv&driveSize=PZ2&dimensions=3,5x50');

    expect(answer).toMatchObject({ type: 'engraving-image', widthMm: 60, heightMm: 20 });
    expect(answer.svg).toMatch(/^<svg /);
  });

  test('should send the refusal reason when the label is invalid', async ({ page }) => {
    const answer = await askImageInHiddenFrame(page, 'width=2&height=20&hardwareType=washer');

    expect(answer).toEqual({ type: 'engraving-image-error', field: 'width', reason: 'tooSmall' });
  });
});
