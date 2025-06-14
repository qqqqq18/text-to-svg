// Simple utility to create a minimal test font
const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

// Create a minimal font with just a few glyphs
const glyphs = [
  // .notdef glyph (required)
  new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 650,
    path: new opentype.Path()
  }),

  // Space character
  new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: 250,
    path: new opentype.Path()
  }),

  // A simple 'A' character
  new opentype.Glyph({
    name: 'A',
    unicode: 65,
    advanceWidth: 650,
    path: (() => {
      const path = new opentype.Path();
      path.moveTo(325, 0);
      path.lineTo(0, 700);
      path.lineTo(100, 700);
      path.lineTo(200, 500);
      path.lineTo(450, 500);
      path.lineTo(550, 700);
      path.lineTo(650, 700);
      path.lineTo(325, 0);
      path.close();
      return path;
    })()
  })
];

const font = new opentype.Font({
  familyName: 'TestFont',
  styleName: 'Regular',
  unitsPerEm: 1000,
  ascender: 800,
  descender: -200,
  glyphs: glyphs
});

const outputPath = path.join(__dirname, '..', 'fonts', 'test-font.otf');
const buffer = font.toArrayBuffer();
fs.writeFileSync(outputPath, Buffer.from(buffer));

console.log(`Test font created at: ${outputPath}`);