const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require("fs");
require("dotenv").config();

// Initialize Notion client
const notionApiKey = process.env.NOTION_API_KEY;
const pageId = process.env.NOTION_PAGE_ID; // Your Notion page ID

if (!notionApiKey || !pageId) {
  console.error("❌ Missing NOTION_API_KEY or NOTION_PAGE_ID environment variables.");
  process.exit(1);
}

const notion = new Client({ auth: notionApiKey });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Only log a safe prefix of sensitive values
console.log("Notion API Key prefix:", notionApiKey.slice(0, 4) + "***");
console.log("Notion Page ID:", pageId);


const crypto = require('crypto');
const checksumFile = pathJoinSafe('../.cache/readme.sha1');

function pathJoinSafe(p) { return require('path').join(__dirname, p); }

function computeSha(text) { return crypto.createHash('sha1').update(text).digest('hex'); }

async function fetchNotionPage({ attempts = 3, delayMs = 2000 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const mdBlocks = await n2m.pageToMarkdown(pageId);
      const markdown = n2m.toMarkdownString(mdBlocks);

      const newSha = computeSha(markdown.parent);
      let oldSha = 'NONE';
      // Ensure cache directory exists
      const cacheDir = require('path').dirname(checksumFile);
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      if (fs.existsSync(checksumFile)) {
        oldSha = fs.readFileSync(checksumFile, 'utf8').trim();
      }
      if (oldSha === newSha) {
        console.log('No content change (checksum match); skipping write.');
        return;
      }
      if (process.env.DRY_RUN === '1') {
        console.log('[DRY_RUN] Would write README (chars):', markdown.parent.length, 'newSha:', newSha);
      } else {
        fs.writeFileSync('../readme.md', markdown.parent);
        fs.writeFileSync(checksumFile, newSha + '\n');
        console.log('✅ Notion content synced as Markdown! New checksum:', newSha);
      }
      return;
    } catch (error) {
      lastErr = error;
      const retriable = ["rate_limited", "internal_server_error"].some(code => (error.code || "").includes(code));
      console.error(`Attempt ${i}/${attempts} failed:`, error.message);
      if (i < attempts && retriable) {
        await new Promise(r => setTimeout(r, delayMs * i));
        continue;
      }
      break;
    }
  }
  console.error("❌ Failed to fetch Notion content after retries:", lastErr && lastErr.message);
  process.exit(1);
}

fetchNotionPage();
