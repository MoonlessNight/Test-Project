const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(full, files);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}
const kindMap = {
  '.js': ts.ScriptKind.JS,
  '.jsx': ts.ScriptKind.JSX,
  '.ts': ts.ScriptKind.TS,
  '.tsx': ts.ScriptKind.TSX,
};
let hasError = false;
for (const file of walk(root)) {
  const ext = path.extname(file);
  const kind = kindMap[ext] || ts.ScriptKind.Unknown;
  const text = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, kind);
  const diags = sourceFile.parseDiagnostics;
  if (diags.length) {
    console.log('PARSE ERROR:', file);
    diags.forEach((d) => {
      const pos = sourceFile.getLineAndCharacterOfPosition(d.start || 0);
      console.log(`  ${pos.line + 1}:${pos.character + 1} ${d.messageText}`);
    });
    hasError = true;
  }
}
if (!hasError) console.log('NO PARSE ERRORS FOUND');
