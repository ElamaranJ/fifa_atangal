const sharp = require('sharp');

async function buildSeamlessRonaldo() {
  const inputPath = 'public/bg_ronaldo.jpg';
  const outputPath = 'public/bg_ronaldo_wide.jpg';

  const metadata = await sharp(inputPath).metadata();
  const targetW = 1920;
  const targetH = 1080;

  // Center figure height 1080
  const centerH = targetH;
  const centerW = Math.round((metadata.width / metadata.height) * centerH); // 608
  const centerLeft = Math.round((targetW - centerW) / 2); // 656

  // 1. Dark Stadium Arena Canvas with matching dark slate/navy atmosphere
  const arenaSvg = `
    <svg width="${targetW}" height="${targetH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="arenaGlow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#182338" />
          <stop offset="35%" stop-color="#101827" />
          <stop offset="70%" stop-color="#090e18" />
          <stop offset="100%" stop-color="#04070d" />
        </radialGradient>

        <!-- Left subtle stadium floodlight haze -->
        <radialGradient id="floodLeft" cx="15%" cy="20%" r="55%">
          <stop offset="0%" stop-color="#243754" stop-opacity="0.25" />
          <stop offset="60%" stop-color="#101827" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#090e18" stop-opacity="0" />
        </radialGradient>

        <!-- Right subtle stadium floodlight haze -->
        <radialGradient id="floodRight" cx="85%" cy="20%" r="55%">
          <stop offset="0%" stop-color="#243754" stop-opacity="0.25" />
          <stop offset="60%" stop-color="#101827" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#090e18" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="${targetW}" height="${targetH}" fill="url(#arenaGlow)" />
      <rect width="${targetW}" height="${targetH}" fill="url(#floodLeft)" />
      <rect width="${targetW}" height="${targetH}" fill="url(#floodRight)" />
    </svg>
  `;

  const arenaBase = await sharp(Buffer.from(arenaSvg)).png().toBuffer();

  // 2. Center Ronaldo (full height 1080, width 608)
  const ronaldoResized = await sharp(inputPath)
    .resize(centerW, centerH, { fit: 'fill' })
    .toBuffer();

  // Feather the outer 8% (~48px) on left and right, preserving full center artwork
  const featherMaskSvg = `
    <svg width="${centerW}" height="${centerH}">
      <defs>
        <linearGradient id="feather" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="black" stop-opacity="0" />
          <stop offset="2%" stop-color="black" stop-opacity="0.2" />
          <stop offset="5%" stop-color="black" stop-opacity="0.65" />
          <stop offset="8%" stop-color="black" stop-opacity="0.95" />
          <stop offset="10%" stop-color="black" stop-opacity="1" />
          <stop offset="90%" stop-color="black" stop-opacity="1" />
          <stop offset="92%" stop-color="black" stop-opacity="0.95" />
          <stop offset="95%" stop-color="black" stop-opacity="0.65" />
          <stop offset="98%" stop-color="black" stop-opacity="0.2" />
          <stop offset="100%" stop-color="black" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#feather)" />
    </svg>
  `;

  const ronaldoFeathered = await sharp(ronaldoResized)
    .composite([
      {
        input: Buffer.from(featherMaskSvg),
        blend: 'dest-in',
      }
    ])
    .png()
    .toBuffer();

  // 3. Dark cinematic vignette across full 1920x1080 canvas
  const vignetteSvg = `
    <svg width="${targetW}" height="${targetH}">
      <defs>
        <radialGradient id="vig" cx="50%" cy="50%" r="75%">
          <stop offset="45%" stop-color="#04070d" stop-opacity="0" />
          <stop offset="80%" stop-color="#04070d" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#04070d" stop-opacity="0.85" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#vig)" />
    </svg>
  `;

  await sharp(arenaBase)
    .composite([
      { input: ronaldoFeathered, left: centerLeft, top: 0 },
      { input: Buffer.from(vignetteSvg), left: 0, top: 0 }
    ])
    .jpeg({ quality: 96 })
    .toFile(outputPath);

  console.log(`Generated high quality wide Ronaldo wallpaper at ${outputPath}`);
}

buildSeamlessRonaldo().catch(console.error);
