// Simple snapshot style test for Notion markdown transform
// This does not call the API; it ensures the file structure is stable.
const fs = require('fs');
const path = require('path');

function loadReadme() {
  return fs.readFileSync(path.join(__dirname, '..', 'readme.md'), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    console.error('❌ Test failed:', message);
    process.exit(1);
  }
}

function extractHeadings(md) {
  return md.split('\n')
    .filter(l => /^#{1,3}\s/.test(l))
    .map(h => h.replace(/^#+\s+/, '').trim().toLowerCase());
}

function main() {
  const content = loadReadme();
  assert(content.includes('# Design Books'), 'Missing top-level heading');
  assert(content.length > 1000, 'README too short (<1000 chars)');

  const headings = extractHeadings(content);
  const required = [
    'design books',
    '01. business',
    '02. **product design**',
  ];
  required.forEach(r => assert(headings.some(h => h.includes(r.replace(/[*`]/g, ''))), `Missing heading: ${r}`));

  // Basic link sanity: ensure at least 10 Amazon links
  const amazonLinks = (content.match(/https:\/\/www\.amazon\.com\//g) || []).length;
  assert(amazonLinks >= 10, 'Expected at least 10 Amazon links');

  console.log('✅ README content validation passed. Length:', content.length, 'Amazon links:', amazonLinks);
}

main();
