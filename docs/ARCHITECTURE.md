# Project Architecture

## Overview

This blog is built with:

- Astro for static site generation
- Vue for interactive components
- MDX for content
- UnoCSS for styling

## Key Components

### Content Processing

The blog uses a custom remark plugin (`src/plugins/remark/sectionize.js`) to:

- Parse markdown content
- Generate section IDs
- Create table of contents

### Page Structure

```text
Layout (Base.astro)
└── Content
    ├── Header
    │   └── Navigation
    ├── Main Content
    │   └── MDX Content
    └── Footer
```

### Data Flow

1. Content (MDX) →
2. Remark/Rehype Plugins →
3. Astro Components →
4. Static HTML

## Performance Considerations

- Images are optimized at build time
- Styles are generated on-demand
- JavaScript is kept minimal
