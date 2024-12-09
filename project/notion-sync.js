const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require("fs");
require("dotenv").config();

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

const pageId = process.env.NOTION_PAGE_ID; // Your Notion page ID

console.log("Notion API Key:", process.env.NOTION_API_KEY);
console.log("Notion Page ID:", process.env.NOTION_PAGE_ID);


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
