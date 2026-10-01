# Od-Lagna

A searchable, spoiler-safe archive of author Q&As, interviews, anime live-tweets, and lore statements by *Re:Zero kara Hajimeru Isekai Seikatsu* creator **Tappei Nagatsuki**.

[Website](https://od-lagna.pages.dev) | [Browse Archive](https://od-lagna.pages.dev/browse) | [Character Profiles](https://od-lagna.pages.dev/characters) | [Anime Commentary](https://od-lagna.pages.dev/anime) | [IF Stories](https://od-lagna.pages.dev/ifs)

![Od-Lagna Interface (Light and Dark Theme)](public/screenshots/hero-split.png)

---

## Overview

Over the past decade, *Re:Zero* author Tappei Nagatsuki has answered thousands of fan questions across Twitter sessions, convention appearances, art books, and magazine interviews, alongside live-tweeting scene-by-scene broadcast commentary for every television episode. These responses provide valuable context on characters, cut light novel content, worldbuilding, and alternate storylines, but have been scattered across the internet.

Od-Lagna was created to collect, categorize, and cross-reference these statements in a single static archive, equipped with reader-controlled spoiler filters and per-episode commentary streams so fans can explore lore safely.

---

## Key Features

- **Spoiler Protection**: Filter statements behind an arc cutoff barrier (Arcs 1 through 9, plus anime season presets) and independent IF route toggles. Content beyond the selected threshold remains masked until manually revealed.
- **Search**: Fast client-side search across questions, answers, characters, topics, and entry IDs.
- **Anime Broadcast Commentary**: Explore over 4,000 author live-tweets, trivia notes, and scene explanations across 98 cataloged episodes from Season 1 to Season 4, complete with original tweet sources.
- **Bookmarks & Favorites**: Save Q&A and trivia entries locally in your browser with one-click bookmarking. Access, filter, and sort your personal collection, with JSON backup export/import and shareable URL hash sync for cross-device transfer.
- **Share & Card Export**: Export entries as high-resolution visual quote cards (PNG) or copy direct permalinks for sharing across Discord, Twitter/X, and forums.
- **Random Entry**: Quickly load a random statement filtered strictly within the user's active spoiler boundaries.
- **Characters**: Canonical debut arcs, aliases, affiliations, and associated author statements for major figures.
- **IF Routes and Side Stories**: Cataloged directory covering alternate what-if routes, side stories, and related author commentary.
- **Verified Citations**: Statements track primary sources (original Japanese tweets, convention panels, published fanbooks) with verification status badges.

---

## Interface Showcase

| Browse & Filters | Anime Commentary | IF Routes Directory | Spoiler Protection |
| :---: | :---: | :---: | :---: |
| ![Browse Archive](public/screenshots/browsing.png) | ![Anime Broadcast Commentary](public/screenshots/anime.png) | ![IF Routes Directory](public/screenshots/if-routes.png) | ![Spoiler Protection Settings](public/screenshots/spoiler-protection.png) |
| Searchable index with character, topic, and arc filters. | Season catalog and episode broadcast live-tweets. | Hubs for alternate storylines and author supplements. | Arc-level gating with independent IF route toggles. |


## Contributing

Contributions from the community help keep this archive accurate, properly cited, and up to date.

### How to Submit Content
- **New Q&As & Commentary**: Open a GitHub Issue containing the question/comment, translated answer, relevant arc, episode, or IF route, associated characters/topics, and a primary source link.
- **Google Doc Submission**: You can also provide entries directly via this [Google Document](https://docs.google.com/document/d/1-yXkWranORjknet7cxOGEhOuafEilxk6Oaj6-fSMOFw/edit?tab=t.isa9vixpx82s#heading=h.3zujftrfbgoi).
- **Reddit Contact**: For any queries, feedback, or to share entries directly, you can message [u/Mildly_Confused_NPC](https://www.reddit.com/user/Mildly_Confused_NPC) on Reddit.
- **Source Verification**: If an existing entry is unverified and you have the original Japanese source (tweet URL, event recording, publication issue), please link it in an issue referencing the entry ID (e.g. `#0042`).
- **Corrections**: Translation adjustments, typo fixes, or miscategorized tags can be submitted via an issue or pull request.

### Local Development

Prerequisites: Node.js 18+ and npm.

```bash
# Clone the repository
git clone https://github.com/PixelStarForge/Od-Lagna.git
cd Od-Lagna

# Install dependencies
npm install

# Start the development server (http://localhost:3000)
npm run dev

# Validate all content files against Zod schemas
npm run validate

# Run schema and loader test suites
npx tsx lib/schema.test.ts

# Build static production bundle
npm run build
```

---

## Disclaimer and Copyright

Od-Lagna is an unofficial, non-commercial fan project created for archival, reference, and educational purposes under fair use.

*Re:Zero kara Hajimeru Isekai Seikatsu*, its characters, settings, and original Japanese text are the intellectual property of **Tappei Nagatsuki**, **Kadokawa**, and illustrator **Shinichirou Otsuka**.
