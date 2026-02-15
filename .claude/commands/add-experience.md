Add a new experience entry to the portfolio.

Ask the user for:
1. Job title
2. Company name
3. Location (City, State)
4. Period (e.g., "Mar 2023 - Present")
5. Employment type (Full-time, Part-time, Freelance, Contract)
6. Key skills/technologies used
7. Key responsibilities (bullet points)

Then:
1. Read `src/content/config.ts` to confirm the experience schema
2. Check existing entries in `src/content/experience/` to determine the next order number and filename convention
3. Create the new markdown file at `src/content/experience/NN-company-name.md`
4. If the period contains "Present", set duration to a placeholder — the `calculateDuration()` utility will compute it at build time
5. Run `npm run build` to verify the new entry compiles without errors
