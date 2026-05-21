const sharp = require('sharp')
const toIco = require('to-ico')
const fs = require('fs')
const path = require('path')

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2da44e"/>
      <stop offset="100%" stop-color="#1a7f37"/>
    </linearGradient>
    <linearGradient id="pages" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0f4f8"/>
    </linearGradient>
  </defs>

  <!-- background rounded square -->
  <rect x="8" y="8" width="240" height="240" rx="28" ry="28" fill="url(#bg)"/>

  <!-- book shape -->
  <g transform="translate(48, 36)">
    <!-- left page -->
    <path d="M 0 24 L 80 32 L 80 164 L 0 152 Z" fill="url(#pages)" stroke="#c0c8d0" stroke-width="2"/>
    <!-- right page -->
    <path d="M 80 32 L 160 24 L 160 152 L 80 164 Z" fill="url(#pages)" stroke="#c0c8d0" stroke-width="2"/>
    <!-- spine line -->
    <line x1="80" y1="32" x2="80" y2="164" stroke="#8b949e" stroke-width="3"/>
    <!-- left page lines -->
    <line x1="12" y1="52" x2="68" y2="56" stroke="#c0c8d0" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="12" y1="72" x2="68" y2="76" stroke="#c0c8d0" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="12" y1="92" x2="68" y2="96" stroke="#c0c8d0" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="12" y1="112" x2="58" y2="114" stroke="#c0c8d0" stroke-width="2.5" stroke-linecap="round"/>
    <!-- right page lines -->
    <line x1="92" y1="56" x2="148" y2="52" stroke="#c0c8d0" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="92" y1="76" x2="148" y2="72" stroke="#c0c8d0" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="92" y1="96" x2="148" y2="92" stroke="#c0c8d0" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="92" y1="116" x2="148" y2="112" stroke="#c0c8d0" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`

async function generate() {
  const buildDir = path.join(__dirname, '..', 'build')

  // Generate PNGs at multiple sizes
  const sizes = [16, 32, 48, 256]
  const pngBuffers = []

  for (const size of sizes) {
    const buf = await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toBuffer()
    pngBuffers.push(buf)
    // Save 256px version as standalone PNG
    if (size === 256) {
      fs.writeFileSync(path.join(buildDir, 'icon.png'), buf)
    }
  }

  // Create .ico with all sizes
  const icoBuf = await toIco(pngBuffers)
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf)

  console.log('Icon generated: build/icon.ico (16,32,48,256px)')
  console.log('Icon generated: build/icon.png (256px)')
}

generate().catch(e => { console.error(e); process.exit(1) })
