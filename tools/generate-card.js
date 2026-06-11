#!/usr/bin/env node
/**
 * generate-card.js — Instagram share card generator
 *
 * Usage:
 *   node tools/generate-card.js --type post   --title "..." --desc "..." [--image url] [--category "Music"] [--out card.png]
 *   node tools/generate-card.js --type review --title "..." --artist "..." [--image url] [--out card.png]
 *
 * Install once:  npm install --save-dev puppeteer  (from project root)
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2).reduce((acc, val, i, arr) => {
  if (val.startsWith('--')) acc[val.slice(2)] = arr[i + 1] ?? true;
  return acc;
}, {});

const type     = args.type     || 'post';
const title    = args.title    || (type === 'post' ? 'Post Title' : 'Album Title');
const desc     = args.desc     || '';
const artist   = args.artist   || '';
const image    = args.image    || null;
const category = args.category || null;
const outFile  = args.out      || `card-${type}-${Date.now()}.png`;

if (!['post', 'review'].includes(type)) {
  console.error('--type must be "post" or "review"');
  process.exit(1);
}

// ── Load template ─────────────────────────────────────────────────────────────
const templatePath = path.resolve(__dirname, `../src/assets/cards/${type}-card.html`);
let html = fs.readFileSync(templatePath, 'utf8');

// ── Inject content ────────────────────────────────────────────────────────────
// Title
html = html.replace(
  /(<div class="title">)[^<]*(<\/div>)/,
  `$1${escHtml(title)}$2`
);

// Description (post only)
if (type === 'post' && desc) {
  html = html.replace(
    /(<div class="description">)[^<]*(<\/div>)/,
    `$1${escHtml(desc)}$2`
  );
}

// Artist (review only)
if (type === 'review' && artist) {
  html = html.replace(
    /(<div class="artist">)[^<]*(<\/div>)/,
    `$1${escHtml(artist)}$2`
  );
}

// Category (post only, optional)
if (type === 'post' && category) {
  html = html.replace(
    /<!--\s*Optional[\s\S]*?-->/,
    `<div class="category">${escHtml(category)}</div>`
  );
}

// Cover image — replaces placeholder div
if (image) {
  const imgTag = `<img src="${escAttr(image)}" alt="Cover">`;
  html = html.replace(/<div class="image-placeholder">[\s\S]*?<\/div>/, imgTag);
}

// ── Launch Puppeteer ──────────────────────────────────────────────────────────
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Extra wait for Google Fonts to render
  await new Promise(r => setTimeout(r, 800));

  const card = await page.$('.card');
  await card.screenshot({ path: outFile });

  await browser.close();

  console.log(`✅  Saved → ${path.resolve(outFile)}`);
})().catch(err => {
  console.error('❌ ', err.message);
  process.exit(1);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}
