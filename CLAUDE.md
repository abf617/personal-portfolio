# CLAUDE.md - Allen Aronis Portfolio

## Project Overview

Personal portfolio website for Allen Aronis Web Development (Portland, ME). Built with a retro cyberpunk/terminal aesthetic featuring CRT scanlines, Matrix rain background, glitch effects, phosphor glow, and typed text animations.

**Live site:** https://www.allenaroniswebdevelopment.com

## Tech Stack

- **Framework:** Astro 5 (static site generation, content collections)
- **UI Components:** React 19 (interactive islands via `client:load`, `client:idle`, `client:visible`, `client:only="react"`)
- **Styling:** Tailwind CSS 4 (via Vite plugin) + custom CSS (CRT/terminal effects)
- **Animations:** typed.js (typewriter effect), react-powerglitch (glitch transitions)
- **Forms:** Formspree (contact form submission)
- **Deployment:** Vercel
- **Package Manager:** npm

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build locally
```

## Project Structure

```
src/
├── components/
│   ├── *.astro          # Static Astro components (TopNav, Footer, ExperienceCard, GitTimeline)
│   └── *.jsx            # React interactive components (BootAnimation, TerminalMenu, MatrixBackground, GlitchTransition, TypedHeading, SkillBox, TerminalInfo)
├── content/
│   ├── config.ts        # Collection schemas (Zod validation)
│   ├── experience/      # Job entries (markdown with frontmatter, ordered by `order` field)
│   ├── projects/        # Project entries (markdown with frontmatter)
│   ├── pages/           # Page content (about.md)
│   ├── education/       # Education entries (YAML data)
│   ├── certifications/  # Certification entries (YAML data)
│   └── ui/              # UI string collections (YAML data: terminal.yaml, forms.yaml, common.yaml)
├── data/
│   ├── navigation.js    # Nav items with terminal-style labels and keywords
│   └── skills.js        # Skills organized by category
├── hooks/
│   └── useGlitchConfig.js  # Shared glitch effect configuration
├── layouts/
│   └── Layout.astro     # Base layout (SEO meta, structured data, fonts, Matrix background)
├── pages/
│   ├── index.astro      # Home (boot animation → terminal menu → skills grid)
│   ├── about.astro      # About page
│   ├── contact.astro    # Contact form (Formspree)
│   ├── experience.astro # Career timeline with sidebar
│   └── projects/        # Projects listing + dynamic [slug] pages
├── styles/
│   ├── global.css       # Base styles, fonts (Space Mono, Orbitron), hue-rotate animation
│   └── crt-effects.css  # Scanlines, phosphor glow, chromatic aberration, terminal chrome, glitch keyframes
├── utils/
│   ├── contentUtils.ts  # getRequiredEntry() helper for content collections
│   ├── dateUtils.ts     # calculateDuration() for "present" job durations
│   ├── detectMotionPreference.ts  # Reduced motion detection (function + React hook)
│   └── banner.js        # ASCII art banner
└── constants.ts         # Animation timing, matrix config, storage keys
```

## Architecture & Patterns

### Astro Islands Architecture
- Astro handles static rendering; React components are hydrated as "islands"
- Use `client:load` for immediately needed interactivity (MatrixBackground, TerminalInfo)
- Use `client:visible` for below-fold content (TypedHeading, GlitchTransition)
- Use `client:idle` for non-critical interactivity (TerminalMenu)
- Use `client:only="react"` when SSR is not possible

### Content Collections
- All content uses Astro's content collections with Zod schemas in `src/content/config.ts`
- Experience entries use `order` field for sorting (1 = most recent)
- UI strings are centralized in `src/content/ui/*.yaml` files
- Use `getRequiredEntry()` from `src/utils/contentUtils.ts` to fetch entries with error handling

### Theme & Design System
- **Colors:** neon-cyan (#00F0FF), neon-magenta (#FF006E), neon-green (#00FF41), terminal-black (#0a0a0a), terminal-gray (#1a1a1a)
- **Fonts:** Space Mono (body/mono), Orbitron (display/headings)
- **CSS classes:** `terminal-window`, `phosphor-glow`, `chromatic-aberration`, `neon-border-*`
- **Hue-rotate animation:** Applied to `.color-rotation` and `.matrix-background` (15s cycle)
- Terminal-style UI: commands as headings (`> git log --career`), tree-style skill lists (`├── skill`)

### Accessibility
- All animations respect `prefers-reduced-motion` via CSS media queries and the `detectMotionPreference.ts` utility
- Components accept `prefersReducedMotion` prop and skip animations accordingly
- ARIA roles and labels on interactive elements (navigation, menus, forms)
- Semantic HTML throughout

### Boot Sequence (Home Page)
1. `BootAnimation` types welcome message, then glitch-fades out
2. `TerminalMenu` appears with typed heading, then reveals nav options
3. `terminalMenuComplete` event triggers skills grid reveal
4. Session state tracked via `sessionStorage` to manage replay behavior

### Navigation
- Desktop: sticky top nav with terminal-style command labels
- Mobile: hamburger menu (animated X transition at <801px)
- Terminal menu on home page supports keyboard nav (arrows, numbers 1-3, text input matching)

## Conventions

- React components use `.jsx` extension (not `.tsx`)
- Astro components use TypeScript in frontmatter for props interfaces
- Utility functions use `.ts` extension
- No test framework configured
- Tailwind classes preferred over custom CSS; custom CSS only for effects that Tailwind can't handle (scanlines, glitch keyframes, chromatic aberration)
- UI text strings live in `src/content/ui/*.yaml`, not hardcoded in components
- Constants centralized in `src/constants.ts` (animation timing, storage keys, matrix config)
- Git commit messages are short imperative sentences
- **Minimal comments**: Only add comments for genuinely complex or non-obvious logic. No routine comments, no JSDoc boilerplate, no "this does X" comments on self-explanatory code. The code should speak for itself.
- **No emojis**: Never use emojis in code, comments, commit messages, or responses unless explicitly requested.

## Content Updates

### Adding a new experience entry
Create `src/content/experience/NN-company-name.md` with frontmatter matching the schema in `config.ts`:
```yaml
---
title: "Job Title"
company: "Company Name"
location: "City, State"
period: "Mon YYYY - Present"
duration: "X yrs Y mos"  # Auto-calculated if period contains "Present"
type: "Full-time"
skills: ["Skill1", "Skill2"]
order: 1  # Lower = more recent
---
- Bullet point responsibilities
```

### Adding a new project
Create `src/content/projects/project-slug.md` with frontmatter:
```yaml
---
title: "Project Name"
description: "Short description"
techStack: ["React", "Node.js"]
year: 2025
link: "https://example.com"  # optional
featured: true  # optional
---
Project details in markdown...
```

### Updating UI strings
Edit the relevant YAML file in `src/content/ui/` (terminal.yaml, forms.yaml, common.yaml).
