Perform an SEO audit of the portfolio site.

1. Read `src/layouts/Layout.astro` and check:
   - Title tags and meta descriptions
   - Open Graph tags
   - Twitter card tags
   - Structured data (JSON-LD)
   - Canonical URLs
   - Geo tags for local SEO

2. Check each page in `src/pages/` for:
   - Proper title and description props passed to Layout
   - Semantic HTML structure (proper heading hierarchy)
   - Image alt text
   - Internal link structure

3. Check `public/robots.txt` for proper configuration

4. Check `astro.config.mjs` for sitemap configuration

5. Review the structured data for accuracy (Person schema, LocalBusiness schema)

6. Report findings organized as:
   - What's good (existing SEO strengths)
   - Issues found (with specific file locations and line numbers)
   - Recommendations for improvement

Focus on actionable improvements. Don't suggest changes that would break the terminal aesthetic.
