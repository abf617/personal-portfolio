Add a new page to the portfolio site.

Ask the user for:
1. Page name (will be used for the route, e.g., "blog" → `/blog`)
2. Page title
3. Terminal-style command heading (e.g., "> cat blog.txt")
4. Basic content/description of what the page should display

Then:
1. Read existing pages in `src/pages/` to understand the established patterns
2. Read `src/layouts/Layout.astro` for the base layout props
3. Read existing pages (e.g., `about.astro`) as a template for consistent structure
4. Create the new `.astro` page file following the terminal-window aesthetic with:
   - Layout wrapper with SEO title/description
   - TopNav component
   - GlitchTransition wrapper
   - TypedHeading for the terminal command
   - Content area with terminal-window styling
   - Footer component
5. If the page needs content collection data, create the appropriate content entry in `src/content/pages/`
6. Add the page to the navigation in `src/data/navigation.js` if the user wants it in the nav
7. Run `npm run build` to verify everything compiles
