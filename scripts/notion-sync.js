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

const DEFAULT_ATTEMPTS = parseInt(process.env.NOTION_MAX_ATTEMPTS || '3', 10);
const DEFAULT_DELAY = parseInt(process.env.NOTION_RETRY_DELAY_MS || '2000', 10);

// Replace Notion AWS S3 URLs with local image paths
function replaceNotionImages(markdown) {
  const imageMap = {
    'design-books-22x.png': 'public/images/design-books-header.png',
    'header-01-blank.png': 'public/images/design-books-business.png',
    'header-02-blank.png': 'public/images/design-books-product-design.png',
    'header-03-blank.png': 'public/images/design-books-ux-research.png',
    'header-04-blank.png': 'public/images/design-books-interaction-design.png',
    'header-05-blank.png': 'public/images/design-books-user-interface-designer.png',
    'header-06-blank.png': 'public/images/design-books-beginner-design.png',
    'header-07-blank.png': 'public/images/design-books-design-management.png'
  };

  let result = markdown;
  for (const [notionName, localPath] of Object.entries(imageMap)) {
    // Replace any AWS S3 URL that contains the notion image filename
    const regex = new RegExp(`!\\[${notionName}\\]\\(https://prod-files-secure\\.s3\\.us-west-2\\.amazonaws\\.com/[^)]+\\)`, 'g');
    result = result.replace(regex, `![${notionName}](${localPath})`);
  }
  return result;
}

async function fetchNotionPage({ attempts = DEFAULT_ATTEMPTS, delayMs = DEFAULT_DELAY } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const mdBlocks = await n2m.pageToMarkdown(pageId);
      const markdown = n2m.toMarkdownString(mdBlocks);

      // Replace Notion image URLs with local paths
      const processedMarkdown = replaceNotionImages(markdown.parent);

      const newSha = computeSha(processedMarkdown);
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
        console.log('[DRY_RUN] Would write README (chars):', processedMarkdown.length, 'newSha:', newSha);
      } else {
        fs.writeFileSync('../readme.md', processedMarkdown);
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
