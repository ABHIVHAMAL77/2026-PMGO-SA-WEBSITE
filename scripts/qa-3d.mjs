import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:3000/';
const outputDir = path.resolve('outputs', 'qa');

async function launchBrowser() {
  const executablePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter((browserPath) => existsSync(browserPath));

  const launchers = [
    ...executablePaths.map(
      (executablePath) => () =>
        chromium.launch({ executablePath, headless: true, timeout: 20000 }),
    ),
    () => chromium.launch({ headless: true, timeout: 20000 }),
    () =>
      chromium.launch({ channel: 'chrome', headless: true, timeout: 20000 }),
    () =>
      chromium.launch({ channel: 'msedge', headless: true, timeout: 20000 }),
  ];

  let lastError;
  for (const launcher of launchers) {
    try {
      return await launcher();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      }),
    );
  });
}

async function inspectCanvas(page) {
  return page.evaluate(async () => {
    const canvas = document.querySelector('[data-qa="three-canvas"]');
    if (!(canvas instanceof HTMLCanvasElement)) {
      return { exists: false };
    }

    function sampleCanvas(target) {
      const sample = document.createElement('canvas');
      sample.width = 180;
      sample.height = 120;

      const context = sample.getContext('2d', { willReadFrequently: true });
      if (!context) return { supported: false };

      context.drawImage(target, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(
        0,
        0,
        sample.width,
        sample.height,
      ).data;

      let litPixels = 0;
      let checksum = 0;
      for (let index = 0; index < pixels.length; index += 16) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        if (alpha > 8 && red + green + blue > 12) {
          litPixels += 1;
        }
        checksum =
          (checksum +
            (red * 3 + green * 5 + blue * 7 + alpha * 11) * (index + 1)) %
          1000000007;
      }

      return {
        supported: true,
        width: target.width,
        height: target.height,
        litPixels,
        checksum,
      };
    }

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const before = sampleCanvas(canvas);
    await new Promise((resolve) => setTimeout(resolve, 950));
    const afterTime = sampleCanvas(canvas);

    window.scrollTo({
      top: Math.min(1100, document.body.scrollHeight - window.innerHeight),
      behavior: 'instant',
    });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const after = sampleCanvas(canvas);

    return {
      exists: true,
      trophyState: canvas.parentElement?.dataset.trophy,
      before,
      afterTime,
      after,
      changedOverTime:
        before.supported &&
        afterTime.supported &&
        before.checksum !== afterTime.checksum,
      changedAfterScroll:
        before.supported &&
        after.supported &&
        before.checksum !== after.checksum,
    };
  });
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const badImages = Array.from(document.images)
      .filter(
        (image) =>
          !image.complete ||
          image.naturalWidth === 0 ||
          image.naturalHeight === 0,
      )
      .map((image) => image.getAttribute('src'));
    const horizontalOverflow =
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth;
    const heroKv = document.querySelector('[data-qa="hero-kv"]');
    const tickets = document.querySelector('[data-qa="ticket-grid"]');
    const mediaForm = document.querySelector(
      '[data-qa="media-application-form"]',
    );
    const heroKvRect = heroKv?.getBoundingClientRect();
    const ticketRect = tickets?.getBoundingClientRect();
    const pageText = document.body.innerText.toLowerCase();

    return {
      badImages,
      horizontalOverflow,
      heroKvCoversViewport: Boolean(
        heroKvRect &&
        heroKvRect.width >= window.innerWidth - 2 &&
        heroKvRect.height >= window.innerHeight - 70 &&
        heroKvRect.left <= 1 &&
        heroKvRect.right >= window.innerWidth - 1,
      ),
      ticketGridPresent: Boolean(ticketRect && ticketRect.width > 200),
      mediaFormPresent: Boolean(mediaForm),
      hasGeneralPassPrice:
        pageText.includes('general day pass') && pageText.includes('npr 400'),
      hasVipPassPrice:
        pageText.includes('vip day pass') && pageText.includes('npr 600'),
      hasSeasonalPassPrice:
        pageText.includes('seasonal pass') && pageText.includes('npr 1,500'),
      hasRemovedOldPrices:
        !pageText.includes('npr 500') &&
        !pageText.includes('npr 650') &&
        !pageText.includes('npr 1,800'),
      hasDoorsTbd: pageText.includes('doors open') && pageText.includes('tbd'),
      scrollHeight: document.documentElement.scrollHeight,
    };
  });
}

async function runViewport(browser, label, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-qa="hero-kv"]', { state: 'visible' });
  await page.waitForSelector('[data-qa="three-canvas"]', { state: 'attached' });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-qa="three-stage"]')?.dataset.trophy ===
      'loaded',
    null,
    { timeout: 20000 },
  );
  await waitForImages(page);
  await page.screenshot({
    path: path.join(outputDir, `pmgo-${label}.png`),
    fullPage: false,
  });

  const pageStatus = await inspectPage(page);
  const canvasStatus = await inspectCanvas(page);

  await page.screenshot({
    path: path.join(outputDir, `pmgo-${label}-scrolled.png`),
    fullPage: false,
  });
  await page.close();

  return {
    label,
    viewport,
    pageStatus,
    canvasStatus,
  };
}

await mkdir(outputDir, { recursive: true });

const browser = await launchBrowser();
try {
  const results = [];
  results.push(
    await runViewport(browser, 'desktop', { width: 1440, height: 1000 }),
  );
  results.push(
    await runViewport(browser, 'mobile', {
      width: 390,
      height: 844,
      isMobile: true,
    }),
  );

  const failures = results.flatMap((result) => {
    const issues = [];
    if (result.pageStatus.badImages.length > 0) {
      issues.push(
        `${result.label}: image load failures ${result.pageStatus.badImages.join(', ')}`,
      );
    }
    if (result.pageStatus.horizontalOverflow > 2) {
      issues.push(
        `${result.label}: horizontal overflow ${result.pageStatus.horizontalOverflow}px`,
      );
    }
    if (!result.pageStatus.heroKvCoversViewport) {
      issues.push(`${result.label}: main KV is not framing the first viewport`);
    }
    if (!result.pageStatus.ticketGridPresent) {
      issues.push(`${result.label}: ticket grid missing`);
    }
    if (!result.pageStatus.mediaFormPresent) {
      issues.push(`${result.label}: media application form missing`);
    }
    if (!result.pageStatus.hasGeneralPassPrice) {
      issues.push(`${result.label}: General Day Pass NPR 400 missing`);
    }
    if (!result.pageStatus.hasVipPassPrice) {
      issues.push(`${result.label}: VIP Day Pass NPR 600 missing`);
    }
    if (!result.pageStatus.hasSeasonalPassPrice) {
      issues.push(`${result.label}: Seasonal Pass NPR 1,500 missing`);
    }
    if (!result.pageStatus.hasRemovedOldPrices) {
      issues.push(`${result.label}: old ticket pricing still present`);
    }
    if (!result.pageStatus.hasDoorsTbd) {
      issues.push(`${result.label}: doors open TBD missing`);
    }
    if (!result.canvasStatus.exists) {
      issues.push(`${result.label}: 3D canvas missing`);
    }
    if (result.canvasStatus.trophyState !== 'loaded') {
      issues.push(`${result.label}: trophy model did not load`);
    }
    if (
      !result.canvasStatus.before?.supported ||
      !result.canvasStatus.after?.supported ||
      result.canvasStatus.before.litPixels < 100 ||
      result.canvasStatus.after.litPixels < 100
    ) {
      issues.push(`${result.label}: 3D canvas appears blank`);
    }
    if (!result.canvasStatus.changedOverTime) {
      issues.push(`${result.label}: trophy did not animate over time`);
    }
    if (!result.canvasStatus.changedAfterScroll) {
      issues.push(`${result.label}: 3D canvas did not change after scroll`);
    }
    return issues;
  });

  console.log(JSON.stringify({ url, outputDir, results, failures }, null, 2));
  if (failures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
