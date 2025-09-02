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


async function fetchNotionPage() {
  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const markdown = n2m.toMarkdownString(mdBlocks);

    // Save to a markdown file
    fs.writeFileSync("../readme.md", markdown.parent);
    console.log("✅ Notion content synced as Markdown!");
  } catch (error) {
    console.error("❌ Error fetching Notion content:", error.message);
  }
}

fetchNotionPage();
