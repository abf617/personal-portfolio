Add a new project entry to the portfolio.

Ask the user for:
1. Project name
2. Short description
3. Tech stack (list of technologies)
4. Year
5. Live link (optional)
6. Whether it should be featured

Then:
1. Read `src/content/config.ts` to confirm the project schema
2. Check existing entries in `src/content/projects/` for naming conventions
3. Create the new markdown file at `src/content/projects/project-slug.md` with proper frontmatter
4. Ask the user if they want to add detailed markdown content for the project page
5. Run `npm run build` to verify the new entry compiles without errors
