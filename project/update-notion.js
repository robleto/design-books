const { Client } = require("@notionhq/client");
require("dotenv").config();

// Notion API Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const pageId = process.env.NOTION_PAGE_ID;

// GitHub Commit Message
const commitMessage = process.env.GITHUB_COMMIT_MSG;

(async () => {
	try {
		// Update the Notion Page's Title
		await notion.pages.update({
			page_id: pageId,
			properties: {
				Title: {
					// Adjust to match your Notion property name
					title: [
						{
							text: {
								content: `Updated: ${commitMessage}`,
							},
						},
					],
				},
			},
		});

		console.log("✅ Notion page updated successfully!");
	} catch (error) {
		console.error("❌ Error updating Notion:", error.message);
		process.exit(1);
	}
})();




