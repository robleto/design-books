const { Client } = require("@notionhq/client");
require("dotenv").config();

// Notion API Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const pageId = process.env.NOTION_PAGE_ID;

// GitHub Commit Message
const commitMessage = process.env.GITHUB_COMMIT_MSG;

async function updateNotion({ attempts = 3, delayMs = 1500 } = {}) {
	if (!process.env.NOTION_API_KEY || !pageId) {
		console.error("❌ Missing NOTION_API_KEY or NOTION_PAGE_ID.");
		process.exit(1);
	}
	if (!commitMessage) {
		console.warn("⚠️ No commit message provided; using placeholder.");
	}
	let lastErr;
	for (let i = 1; i <= attempts; i++) {
		try {
			if (process.env.DRY_RUN === '1') {
				console.log(`[DRY_RUN] Would update Notion page ${pageId} with title prefix:`);
			} else {
				await notion.pages.update({
					page_id: pageId,
					properties: {
						Title: {
							title: [
								{
									text: { content: `Updated: ${commitMessage || 'No message'}` },
								},
							],
						},
					},
				});
			}
			console.log("✅ Notion page update complete.");
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
	console.error("❌ Failed to update Notion after retries:", lastErr && lastErr.message);
	process.exit(1);
}

updateNotion();




