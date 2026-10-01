// Optional development tool; generated assets are committed for static hosting.
const { default: sharp } = await import(process.env.TEACHA_SHARP_MODULE || 'sharp');
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
await mkdir('assets/social', { recursive: true });
import { readFile, writeFile } from 'node:fs/promises';
for (const name of ['menu-matcha', 'menu-fruittea-zizkov']) {
  await sharp(`assets/menu/${name}.jpg`).webp({quality: 85}).toFile(`assets/menu/${name}.webp`);
}
const font = (await readFile('assets/fonts/nunito-variable.ttf')).toString('base64');
const wordmark = await sharp('assets/logo/teacha-wordmark.svg').resize({width: 480}).png().toBuffer();
const strawberry = await sharp('assets/menu/menu-matcha.jpg').extract({left: 1172, top: 141, width: 431, height: 328}).resize({width: 480}).png().toBuffer();
const fruit = await sharp('assets/menu/menu-fruittea-zizkov.jpg').extract({left: 748, top: 122, width: 469, height: 309}).resize({width: 400}).png().toBuffer();
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<style>@font-face{font-family:Nunito;src:url(data:font/ttf;base64,${font})}text{font-family:Nunito,sans-serif;fill:#244a32}</style>
<defs><clipPath id="matcha"><rect x="720" y="35" width="480" height="365" rx="48"/></clipPath><clipPath id="fruit"><rect x="680" y="350" width="400" height="264" rx="48"/></clipPath></defs>
<rect width="1200" height="630" fill="#fff9ef"/>
<circle cx="1020" cy="255" r="240" fill="#e5edbb"/>
<circle cx="830" cy="495" r="195" fill="#f8d6ca"/>
<image href="data:image/png;base64,${wordmark.toString('base64')}" x="68" y="75" width="440" height="115"/>
<text x="70" y="275" font-size="46" font-weight="800">Matcha &amp; Bubble Tea</text>
<text x="70" y="335" font-size="32" font-weight="600">Your daily tea break.</text>
<text x="70" y="485" font-size="28" font-weight="700">Žižkov · Arkády Pankrác</text>
<text x="70" y="535" font-size="26">Prague · teacha.cz</text>
<image href="data:image/png;base64,${strawberry.toString('base64')}" x="720" y="35" width="480" height="365" clip-path="url(#matcha)"/>
<image href="data:image/png;base64,${fruit.toString('base64')}" x="680" y="350" width="400" height="264" clip-path="url(#fruit)"/>
</svg>`;
await sharp(Buffer.from(svg)).jpeg({quality:90}).toFile('assets/social/teacha-preview.jpg');
