const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const allFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(full);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      allFiles.push(full);
    }
  }
}
walk(root);
let bad = false;
for (const file of allFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const open = text.split('/*').length - 1;
  const close = text.split('*/').length - 1;
  if (open !== close) {
    console.log('UNBALANCED COMMENT', file, open, close);
    bad = true;
  }
  const backticks = text.split('`').length - 1;
  if (backticks % 2 === 1) {
    console.log('ODD BACKTICK', file, backticks);
    bad = true;
  }
}
if (!bad) console.log('COMMENTS OK');
