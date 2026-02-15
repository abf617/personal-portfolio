Create a new component for the portfolio.

Ask the user:
1. Component name
2. Whether it needs interactivity (React .jsx) or is static (Astro .astro)
3. What the component should do / display
4. Whether it needs to match the terminal/cyberpunk aesthetic

Then:
1. Read the existing component patterns:
   - For React: check `src/components/SkillBox.jsx` or `src/components/GlitchTransition.jsx` as reference
   - For Astro: check `src/components/ExperienceCard.astro` or `src/components/GitTimeline.astro` as reference
2. Create the component following established conventions:
   - React components: use `.jsx`, functional components with hooks, accept `prefersReducedMotion` prop if animated
   - Astro components: use TypeScript interface for Props in frontmatter
   - Use the project's color tokens: `text-neon-cyan`, `text-neon-magenta`, `text-neon-green`, `bg-terminal-black`, `bg-terminal-gray`
   - Use `terminal-window` class for card-style containers
   - Use `phosphor-glow` class for glowing text effects
   - Use `font-mono` for body text and `font-display` for headings
3. If it's a React component that needs glitch effects, import from `react-powerglitch` or wrap with `GlitchTransition`

Run `npm run build` to verify the component compiles.
