#!/usr/bin/env node
// Normalize README headings (ensure numbering and formatting consistency)
const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'readme.md');
let content = fs.readFileSync(readmePath, 'utf8');

// Map of expected section headings with their canonical form
const headingMap = [
  { regex: /^##\s*01\.\s*business/i, replace: '## 01. Business' },
  { regex: /^##\s*02\.\s*\*?product design\*?/i, replace: '## 02. Product Design' },
  { regex: /^##\s*03\.\s*ux research/i, replace: '## 03. UX Research' },
  { regex: /^##\s*04\.\s*interaction design/i, replace: '## 04. Interaction Design' },
  { regex: /^##\s*05\.\s*user interface designer/i, replace: '## 05. User Interface Designer' },
  { regex: /^##\s*06\.\s*beginner design 101/i, replace: '## 06. Beginner Design 101' },
  { regex: /^##\s*07\.\s*design management/i, replace: '## 07. Design Management' }
];

const lines = content.split('\n');
const updated = lines.map(line => {
  if (line.startsWith('##')) {
    for (const h of headingMap) {
      if (h.regex.test(line.trim())) return h.replace + '\n';
    }
  }
  return line;
});

const newContent = updated.join('\n');
if (newContent !== content) {
  fs.writeFileSync(readmePath, newContent);
  console.log('Headings normalized.');
} else {
  console.log('No heading changes needed.');
}
