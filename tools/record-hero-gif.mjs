#!/usr/bin/env node
// tools/record-hero-gif.mjs — records the hero clip "the key burned" for hash.html.
//
// What it does: drives the Lamport panel (block A) in real Chrome through a fixed
// storyboard — generate a key, sign 0000, flip three bits, sign again with the SAME key
// (cells turn red, meter -> 75%), forge a message nobody signed ("verified ✓") — records
// the page, crops to the panel and encodes a looping GIF plus an H.264 MP4.
//
// Usage:
//   node tools/record-hero-gif.mjs [--url <page>] [--theme dark|light] [--width 800]
//                                  [--fps 12] [--out <dir>] [--keep-frames]
//
//   --url          page to record (default: file:// URL of this repo's hash.html;
//                  e.g. https://anaexplores.github.io/the-signature-explorer/hash.html)
//   --theme        prefers-color-scheme to emulate (default: dark)
//   --width        output width in px (default: 800)
//   --fps          output frame rate (default: 12). If the GIF exceeds 5 MB the script
//                  steps width and fps down automatically until it fits.
//   --out          output directory (default: ./hero-out relative to cwd). Keep it outside
//                  the repo or do not commit it.
//   --keep-frames  also dump the final frames as PNGs into <out>/frames
//
// Output: <out>/hero-<theme>.gif and <out>/hero-<theme>.mp4
//
// Requirements: Node >= 19, `npm install` (playwright devDependency), system Google
// Chrome (launched via channel "chrome"; no browser is ever downloaded), and ffmpeg
// (FFMPEG env var, or `ffmpeg` on PATH).
//
// Design notes:
//   * Capture = Playwright recordVideo (webm), not screenshot polling: video runs in real
//     time, so the pacing of the clip equals the pacing of the script; screenshot loops
//     stutter and drift. Video is rendered at CSS-pixel size (device scale factor does
//     not apply to it), so the viewport is kept near the output width to stay sharp.
//   * Video has no mouse cursor, so a small fake cursor element is injected by this
//     script only (nothing in the site is edited) and glides to every click target.
//   * The panel crop box comes from the DOM (measured on the final state).
//   * With a file:// URL any non-file request fails the run (the site must stay offline).

import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MAX_GIF_BYTES = 5_000_000;

// ---------- helpers ----------

function parseArgs(argv) {
  const opts = {
    url: pathToFileURL(path.join(ROOT, "hash.html")).href,
    theme: "dark",
    width: 800,
    fps: 12,
    out: path.resolve(process.cwd(), "hero-out"),
    keepFrames: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) fail(`missing value for ${a}`);
      return argv[++i];
    };
    if (a === "--url") opts.url = next();
    else if (a === "--theme") opts.theme = next();
    else if (a === "--width") opts.width = Number(next());
    else if (a === "--fps") opts.fps = Number(next());
    else if (a === "--out") opts.out = path.resolve(process.cwd(), next());
    else if (a === "--keep-frames") opts.keepFrames = true;
    else fail(`unknown option ${a}`);
  }
  if (!["dark", "light"].includes(opts.theme)) fail("--theme must be dark or light");
  if (!(opts.width >= 200)) fail("--width must be a number >= 200");
  if (!(opts.fps >= 1 && opts.fps <= 30)) fail("--fps must be between 1 and 30");
  return opts;
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function resolveFfmpeg() {
  const candidates = [process.env.FFMPEG, "ffmpeg"].filter(Boolean);
  for (const bin of candidates) {
    const r = spawnSync(bin, ["-version"], { encoding: "utf8" });
    if (r.status === 0) return bin;
  }
  fail("ffmpeg not found. Set the FFMPEG env var to the ffmpeg executable or put ffmpeg on PATH.");
}

function ffmpeg(bin, args) {
  const r = spawnSync(bin, ["-y", "-hide_banner", "-loglevel", "error", ...args], { encoding: "utf8" });
  if (r.status !== 0) fail(`ffmpeg failed: ${r.stderr || r.error}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const even = (n) => Math.max(2, Math.floor(n / 2) * 2);

// ---------- fake cursor (injected by this script only) ----------

const CURSOR_JS = `(() => {
  const c = document.createElement("div");
  c.id = "__hero_cursor";
  c.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none;" +
    "transform:translate(700px,60px);transition:transform var(--g,.4s) cubic-bezier(.45,.05,.2,1);";
  c.innerHTML =
    '<span id="__hero_pulse" style="position:absolute;left:-18px;top:-18px;width:36px;height:36px;border-radius:50%;' +
    'border:3px solid #f5c542;opacity:0;transform:scale(.3)"></span>' +
    '<svg width="26" height="30" viewBox="0 0 26 30" style="position:absolute;left:-2px;top:-2px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))">' +
    '<path d="M3 2 L3 23 L8.5 18.2 L12.2 26.5 L15.6 25 L12 16.9 L19.5 16.9 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.documentElement.appendChild(c);
})()`;

async function glideTo(page, locator, { dx = 0, dy = 0, ms = 400 } = {}) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("click target has no box");
  const x = box.x + box.width / 2 + dx;
  const y = box.y + box.height / 2 + dy;
  await page.evaluate(([px, py, dur]) => {
    const c = document.getElementById("__hero_cursor");
    c.style.setProperty("--g", `${dur}ms`);
    c.style.transform = `translate(${px}px,${py}px)`;
  }, [x, y, ms]);
  await page.mouse.move(x, y, { steps: 4 });
  await sleep(ms + 40); // let the CSS glide finish
}

async function click(page, locator, ms) {
  await glideTo(page, locator, { ms });
  await page.evaluate(() => {
    const p = document.getElementById("__hero_pulse");
    p.animate(
      [
        { opacity: 0.95, transform: "scale(.3)" },
        { opacity: 0, transform: "scale(1.5)" },
      ],
      { duration: 380, easing: "ease-out" },
    );
  });
  await sleep(110);
  await locator.click({ noWaitAfter: true });
}

// ---------- encoding ----------

function encode(bin, { webm, ss, dur, crop, width, fps, gif, mp4 }) {
  const outW = even(width);
  const base = `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},fps=${fps},scale=${outW}:-2:flags=lanczos`;
  const palette = path.join(os.tmpdir(), `hero-palette-${process.pid}.png`);
  const common = ["-ss", String(ss), "-t", String(dur), "-i", webm];
  // pass 1: palette from the whole clip; pass 2: dither with it
  ffmpeg(bin, [...common, "-vf", `${base},palettegen=stats_mode=diff:max_colors=128`, palette]);
  ffmpeg(bin, [
    ...common,
    "-i",
    palette,
    "-lavfi",
    `${base}[x];[x][1:v]paletteuse=dither=none:diff_mode=rectangle`,
    "-loop",
    "0",
    gif,
  ]);
  fs.rmSync(palette, { force: true });
  if (mp4) {
    ffmpeg(bin, [
      ...common,
      "-vf",
      `${base},format=yuv420p`,
      "-c:v",
      "libx264",
      "-crf",
      "18",
      "-preset",
      "slow",
      "-movflags",
      "+faststart",
      "-an",
      mp4,
    ]);
  }
}

// ---------- main ----------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const ffmpegBin = resolveFfmpeg();
  const isFile = opts.url.startsWith("file:");
  fs.mkdirSync(opts.out, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hero-rec-"));

  const VIEW = { width: 900, height: 1500 };
  console.log(`▶ recording ${opts.url} (theme: ${opts.theme})`);

  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    fail(`could not launch system Chrome (channel "chrome"): ${e.message}`);
  }

  const context = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 2,
    colorScheme: opts.theme,
    reducedMotion: "no-preference",
    recordVideo: { dir: tmpDir, size: VIEW },
  });
  const page = await context.newPage();
  const pageCreatedAt = Date.now();

  const stray = [];
  if (isFile) {
    page.on("request", (req) => {
      const u = req.url();
      if (!u.startsWith("file:") && !u.startsWith("data:") && !u.startsWith("blob:") && !u.startsWith("about:")) stray.push(u);
    });
  }

  await page.goto(opts.url, { waitUntil: "load" });
  await page.addStyleTag({ content:
      // keep layout, hide every card after the signing panel except the attack card, so the
      // teaser cards below it never show in the clip
      "html{scroll-behavior:auto!important}" +
      ".card:has(.grid) ~ *:not(:has(.verdict)){visibility:hidden!important}" });
  await page.evaluate(CURSOR_JS);

  const genBtn = page.locator("button", { hasText: "Generate a key pair" });
  const signBtn = page.locator("button", { hasText: "Sign this message" });
  const forgeBtn = page.locator("button", { hasText: "Forge a message nobody ever signed" });
  await genBtn.waitFor();

  await sleep(500);
  const storyStart = Date.now();

  // 1. generate
  await click(page, genBtn);
  await page.locator(".grid .cell.hidden").first().waitFor();
  await sleep(900);

  // 2. sign 0000
  await click(page, signBtn);
  await page.locator(".verdict", { hasText: "1 message signed" }).waitFor();
  await sleep(1000);

  // 3. flip three bits (1110), sign again with the same key
  for (const i of [0, 1, 2]) {
    await click(page, page.locator(".msg .bit").nth(i), 260);
    await sleep(150);
  }
  await sleep(300);
  await click(page, signBtn);
  await page.locator(".grid .cell.leaked").first().waitFor();
  await sleep(1100);

  // 4. forge
  await click(page, forgeBtn);
  await page.locator(".pill.good", { hasText: "verified" }).waitFor();
  await sleep(500);
  // park the cursor away from the text so the final frame is clean
  await glideTo(page, page.locator(".verdict").first(), { dx: 330, dy: -40 });

  // 5. hold the final frame
  await sleep(1500);
  const storyEnd = Date.now();

  // crop box: from the top of the signing panel (message bits + grid) to the end of the attack
  // card (incl. the forged-message card), measured in the final state
  const box = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".card")];
    const first = cards.find((c) => c.querySelector(".grid"));
    const last = cards.find((c) => c.querySelector(".verdict"));
    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();
    return { x: a.left, y: a.top, w: Math.max(a.right, b.right) - a.left, h: b.bottom - a.top };
  });
  const finalMetrics = await page.evaluate(() => ({
    verdict: document.querySelector(".verdict")?.textContent,
    leaked: document.querySelectorAll(".grid .cell.leaked").length,
    meter: document.querySelector(".meter > i")?.style.width,
  }));

  if (opts.keepFrames) {
    fs.mkdirSync(path.join(opts.out, "frames"), { recursive: true });
  }
  await context.close(); // finalises the video
  const webm = await page.video().path();
  await browser.close();

  if (stray.length) fail(`unexpected non-file requests with a file:// URL:\n  ${stray.join("\n  ")}`);
  console.log(`✓ no external requests (${isFile ? "file://" : "checked only for file:// URLs"})`);
  console.log(`✓ final state: "${finalMetrics.verdict}" · meter ${finalMetrics.meter} · ${finalMetrics.leaked} leaked cells`);

  const pad = 12;
  const crop = {
    x: Math.max(0, Math.floor(box.x - pad)),
    y: Math.max(0, Math.floor(box.y - pad)),
    w: 0,
    h: 0,
  };
  crop.w = even(Math.min(VIEW.width - crop.x, Math.ceil(box.w + 2 * pad)));
  crop.h = even(Math.min(VIEW.height - crop.y, Math.ceil(box.h + 2 * pad)));
  console.log(`▶ crop ${crop.w}x${crop.h} at (${crop.x},${crop.y})`);

  // video t=0 is page creation; trim the blank load and keep a short lead-in
  const ss = Math.max(0, (storyStart - pageCreatedAt) / 1000 - 0.25);
  const dur = (storyEnd - storyStart) / 1000 + 0.25;

  const gif = path.join(opts.out, `hero-${opts.theme}.gif`);
  const mp4 = path.join(opts.out, `hero-${opts.theme}.mp4`);

  let width = opts.width;
  let fps = opts.fps;
  for (;;) {
    console.log(`▶ encoding GIF ${width}px @ ${fps} fps`);
    encode(ffmpegBin, { webm, ss, dur, crop, width, fps, gif, mp4: null });
    const size = fs.statSync(gif).size;
    if (size <= MAX_GIF_BYTES) break;
    console.log(`  ${(size / 1048576).toFixed(2)} MB > 5 MB, reducing`);
    if (fps > 10) fps -= 2;
    else if (width > 480) width = even(width * 0.85);
    else fail("could not get the GIF under 5 MB; lower --width/--fps manually");
  }
  encode(ffmpegBin, { webm, ss, dur, crop, width, fps, gif: path.join(tmpDir, "unused.gif"), mp4 });

  if (opts.keepFrames) {
    ffmpeg(ffmpegBin, ["-i", gif, path.join(opts.out, "frames", `${opts.theme}-%03d.png`)]);
  }

  const kb = (f) => `${(fs.statSync(f).size / 1024).toFixed(0)} KB`;
  console.log(`✓ GIF  ${gif} (${kb(gif)}, ${width}px @ ${fps} fps)`);
  console.log(`✓ MP4  ${mp4} (${kb(mp4)})`);
  console.log(`  clip length ${dur.toFixed(1)} s; keep the output dir outside the repo or do not commit it`);

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((e) => fail(e.stack || e.message));
