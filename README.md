# 🧹 HTML to Clean Text Converter

A 100% client-side web application that converts raw HTML into AI-ready clean text. No backend, no API calls - everything runs in your browser.

## ✨ Features

- **Three Output Modes:**
  - **Plain Text** - Clean paragraphs with no markup
  - **Markdown** - Preserves headings, lists, and structure
  - **JSON for LLMs** - Chunked output with token estimates

- **Smart Cleaning:**
  - Removes scripts, styles, iframes, SVGs
  - Strips navigation, footers, ads, cookie banners
  - Eliminates hidden elements and noise
  - Preserves only meaningful content

- **LLM-Ready Output:**
  - Automatic chunking (800-1200 tokens)
  - Never breaks mid-sentence
  - Prefers paragraph/heading boundaries
  - Language auto-detection

- **Privacy First:**
  - 100% client-side processing
  - No data sent to servers
  - Works offline

## 🚀 Quick Start

### Option 1: Direct Use (No Build Required)

1. Clone or download this repository
2. Open `index.html` in a modern browser
3. Start converting HTML!

> Note: For the TypeScript version, you'll need to build first (see below)

### Option 2: With Build Step

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start local server
npm run serve
```

Then open `http://localhost:3000` in your browser.

### Option 3: Development Mode

```bash
npm run dev
```

This runs TypeScript compiler in watch mode alongside a local server.

## 📦 GitHub Pages Deployment

### Automatic Deployment with GitHub Actions

1. Push your code to GitHub

2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. Go to your repository Settings → Pages → Source: "GitHub Actions"

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Push all files including the `dist` folder to your GitHub repository

3. Go to repository Settings → Pages

4. Set Source to "Deploy from a branch" and select `main` branch

5. Your site will be live at `https://yourusername.github.io/repository-name`

## 🎯 Usage

1. **Paste HTML** into the left panel
2. **Select output format** (Plain Text, Markdown, or JSON)
3. **Adjust chunk size** if using JSON mode (400-2000 tokens)
4. **Click Clean** or press `Ctrl+Enter`
5. **Copy or Download** the result

### Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Clean HTML
- `Ctrl/Cmd + Shift + C` - Copy output

## 📐 Project Structure

```
html-parser/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── src/
│   ├── types.ts        # TypeScript type definitions
│   ├── cleaner.ts      # Core HTML cleaning logic
│   ├── chunker.ts      # Text chunking & token estimation
│   └── app.ts          # Main application logic
├── dist/               # Compiled JavaScript (after build)
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies
└── README.md           # This file
```

## 🔧 How It Works

### Cleaning Pipeline

1. **Parse HTML** using `DOMParser` (no regex!)
2. **Remove unwanted tags** (script, style, etc.)
3. **Remove noise elements** (nav, footer, ads, etc.)
4. **Extract structured elements** (headings, paragraphs, lists)
5. **Consolidate and normalize** text content

### Chunking Logic

1. Estimate tokens using word count heuristic (~1.3 tokens/word)
2. Find natural break points (paragraphs > sentences > words)
3. Create chunks of 800-1200 tokens
4. Never break mid-sentence

### Language Detection

Auto-detects language based on:
- Character ranges (CJK, Cyrillic, Arabic, etc.)
- Common word patterns for European languages

## 🛡️ What Gets Removed

- `<script>`, `<style>`, `<noscript>`, `<iframe>`
- `<svg>`, `<canvas>`, `<link>`, `<meta>`, `<head>`
- Navigation, headers, footers (outside articles)
- Sidebars, ads, cookie banners
- Hidden elements (`display:none`, `aria-hidden`)
- Forms, buttons, inputs
- Inline event handlers

## 📝 Output Examples

### Plain Text
```
ARTICLE TITLE

This is the first paragraph of clean content.

This is the second paragraph with all HTML noise removed.

• List item one
• List item two
```

### Markdown
```markdown
# Article Title

This is the first paragraph of clean content.

This is the second paragraph with all HTML noise removed.

- List item one
- List item two
```

### JSON for LLMs
```json
{
  "source": "user-pasted-html",
  "language": "en",
  "content": [
    {
      "chunk": 1,
      "text": "Article Title\n\nThis is the first paragraph...",
      "approx_tokens": 850
    }
  ]
}
```

## 📜 License

**All Rights Reserved** - Copyright (c) 2026 kbaytan99

This software is proprietary. No permission is granted to copy, modify, distribute, or use this software without explicit written permission from the copyright holder.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
