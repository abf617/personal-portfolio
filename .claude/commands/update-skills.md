Update the skills displayed on the portfolio.

Read the current skills from `src/data/skills.js` and display them to the user organized by category.

Ask the user what changes they want to make:
- Add new skills to existing categories
- Remove skills from categories
- Create a new category
- Reorder skills within categories

Then update `src/data/skills.js` accordingly. If adding a new category, also update the `skillCategories` array export.

Note: The home page skills grid uses a 4-column layout (`md:grid-cols-4`). If adding a 5th category, suggest updating the grid in `src/pages/index.astro` to accommodate it.

Run `npm run build` to verify changes compile.
