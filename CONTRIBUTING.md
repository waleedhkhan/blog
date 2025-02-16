# Contributing Guide

Thank you for considering contributing to this blog project! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

## Project Structure

- `src/components/`: Reusable Astro components
- `src/layouts/`: Page layouts
- `src/pages/`: Route components
- `src/plugins/`: Custom plugins (like remark plugins)
- `src/styles/`: Global styles and UnoCSS config

## Code Style

This project uses:

- ESLint for code linting
- Prettier for code formatting
- UnoCSS for styling

## Adding New Features

1. Create a new branch
2. Write clean, documented JavaScript code
3. Test your changes locally
4. Submit a pull request

## Writing Blog Posts

Place new blog posts in `src/content/blog/` using MDX format.

## Need Help?

Feel free to open an issue for:

- Bug reports
- Feature requests
- Questions about the codebase
