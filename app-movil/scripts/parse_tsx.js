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
    } else if (/\.tsx$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}
const files = walk(root);
let hasError = false;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const diagnostics = sourceFile.parseDiagnostics;
  if (diagnostics.length) {
    console.log('PARSE ERROR:', file);
    diagnostics.forEach((d) => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(d.start || 0);
      console.log(`  ${line + 1}:${character + 1} ${d.messageText}`);
    });
    hasError = true;
  }
}
if (!hasError) console.log('NO TSX PARSE ERRORS');
