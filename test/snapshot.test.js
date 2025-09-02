// Simple snapshot style test for Notion markdown transform
// This does not call the API; it ensures the file structure is stable.
const fs = require('fs');
const path = require('path');

function loadReadme() {
  return fs.readFileSync(path.join(__dirname, '..', 'readme.md'), 'utf8');
}

function main() {
  const content = loadReadme();
  if (!content.includes('# Design Books')) {
    console.error('Snapshot check failed: Missing heading');
    process.exit(1);
  }
  if (content.length < 500) {
    console.error('Snapshot check failed: README unexpectedly short');
    process.exit(1);
  }
  console.log('Snapshot test passed. Length:', content.length);
}

main();
