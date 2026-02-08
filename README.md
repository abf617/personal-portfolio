# Personal Portfolio

A 90s futurist terminal-inspired portfolio website built with Astro, React, and Tailwind CSS.

## ✨ Features

- **Matrix Background**: Canvas-based falling code animation
- **CRT Effects**: Scanlines, phosphor glow, and chromatic aberration
- **Terminal UI**: Navigation and interactions styled as command-line interface
- **Typing Animations**: Dynamic text using typed.js
- **Glitch Transitions**: RGB channel separation effects
- **Accessibility**: Full support for prefers-reduced-motion
- **Content Collections**: Easy markdown-based project management
- **Optimized Performance**: Astro Islands architecture for minimal JavaScript

## 🎨 Tech Stack

- **Framework**: Astro 5.x
- **UI Library**: React (for interactive components)
- **Styling**: Tailwind CSS v4
- **Typography**: Space Mono, Orbitron
- **Effects**: typed.js, react-matrix-animation, react-powerglitch
- **Deployment**: Vercel

## 🚀 Project Structure

```text
/
├── public/                  # Static assets
├── src/
│   ├── components/          # React & Astro components
│   │   ├── MatrixBackground.jsx
│   │   ├── TypedHeading.jsx
│   │   ├── GlitchTransition.jsx
│   │   └── TopNav.astro
│   ├── content/             # Content collections
│   │   ├── config.ts
│   │   └── projects/        # Markdown project files
│   ├── layouts/
│   │   └── Layout.astro     # Base layout with CRT effects
│   ├── pages/               # File-based routing
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   └── projects/
│   ├── styles/              # Global styles
│   │   ├── global.css
│   │   └── crt-effects.css
│   └── utils/
│       └── detectMotionPreference.ts
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## 📝 Adding Content

To add a new project, create a markdown file in `src/content/projects/`:

```markdown
---
title: "Project Name"
description: "Brief description"
techStack: ["React", "Node.js"]
year: 2026
link: "https://example.com"
featured: true
---

# Project Details

Your project content here...
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
