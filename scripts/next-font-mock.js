/* eslint-disable @typescript-eslint/no-require-imports */
// Mock responses for Google Fonts when NEXT_FONT_GOOGLE_MOCKED_RESPONSES is set.
const path = require('node:path');

const fontsDir = path.join(process.cwd(), '.next-font-mock');
const geistPath = path.join(fontsDir, 'geist-latin.woff2');
const geistMonoPath = path.join(fontsDir, 'geist-mono-latin.woff2');

module.exports = {
  'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap': `/* latin */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('${geistPath}') format('woff2');
}`,
  'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap': `/* latin */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('${geistMonoPath}') format('woff2');
}`,
};
