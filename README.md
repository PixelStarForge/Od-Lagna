# Od-Lagna

The static archive of public Q&A sessions, author interviews, convention panels, and Twitter lore statements given by *Re:Zero kara Hajimeru Isekai Seikatsu* author **Tappei Nagatsuki**.


---

## Core Features

- **Spoiler Protection**: Filter answers and character revelations behind an arc-level barrier (Arcs 1 through 10, with anime season presets including Arc 6 / Season 4) and an IF timeline gate.
- **Advanced Search**: Instant fuzzy and substring search powered by Fuse.js across questions, answers, characters, topics, and story arcs, accessible via command palette (`/` or `Cmd/Ctrl + K`).
- **Dedicated Q&A Pages**: Static permalink view for every entry (`/qna/[id]`) featuring an automated recommendation engine connecting related questions based on shared characters, topics, and narrative arcs.
- **Clean Interface**: Built from scratch with Tailwind CSS without external UI component libraries
- **Typography**: Inter for UI controls paired with Newsreader for body text, calibrated for long-form readability and full WCAG AA contrast compliance in both light and dark themes.


---

## Contributing

We welcome community contributions to keep this archive comprehensive, accurate, and properly cited.

### Raising an Issue on GitHub

If you would like to submit a new Q&A, provide a primary source, or report an error in an existing entry, please open a GitHub Issue:

- **Submit a New Q&A**: Include the author's question and answer, the story arc or IF route it pertains to, associated characters and topics, and a link or citation to the primary source (e.g., tweet URL, convention recording, or magazine issue).
- **Provide or Verify a Source**: If you have a primary citation for an unverified entry, share the entry ID (`#0001`) and the verification link.
- **Submit a Correction**: For translation discrepancies, typo fixes, or miscategorized spoiler tags, reference the entry ID and detail the proposed modification.

### Contributing via Pull Request

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/od-lagna.git
   cd od-lagna
   npm install
   ```

2. Add or modify entries in `content/qna/`. Each entry is stored in its own JSON file named `{id}.qna.json`:
   ```json
   {
     "id": "0003",
     "question": "The fan or interviewer question...",
     "answer": "Tappei Nagatsuki's translated response...",
     "characters": ["Natsuki Subaru", "Emilia"],
     "topics": ["Authorities", "Witch Factors"],
     "arc": "arc-4",
     "source": {
       "type": "url",
       "value": "https://twitter.com/..."
     },
     "verified": true
   }
   ```

3. Validate your changes against the schema and registries:
   ```bash
   npm run validate
   ```

4. Build the search index and verify static compilation:
   ```bash
   npm run build
   ```

5. Open a Pull Request with a summary of the added or amended entries.

---

## Local Development

```bash
# Start Next.js development server
npm run dev

# Run content validator
npm run validate

# Build client-side search index
npm run build:search

# Run local administration GUI (dev-only tool)
npm run admin

# Run linter
npm run lint

# Compile static production export
npm run build
```

---

## Project Structure

```
od-lagna/
├── app/                      # Next.js App Router pages
│   ├── browse/               # Filter and archive view
│   ├── qna/[id]/             # Dedicated Q&A detail view with recommendations
│   ├── globals.css           # Global theme variables & styles
│   ├── layout.tsx            # Root layout with fonts & theme script
│   └── page.tsx              # Home landing page with metrics & timeline
├── components/               # Handcrafted UI components
│   ├── CustomSelect.tsx      # Scratch-built accessible dropdowns
│   ├── Header.tsx            # Navigation bar & search trigger
│   ├── OnboardingModal.tsx   # First-visit spoiler configuration
│   ├── QnaCard.tsx           # Individual Q&A card with spoiler gating
│   ├── SearchModal.tsx       # Fuzzy search modal
│   └── SpoilerControls.tsx   # Arc cutoff slider and season presets
├── content/
│   ├── config/               # Canonical registries (arcs, if-routes, characters, topics)
│   └── qna/                  # Individual Q&A entry JSON files
├── lib/                      # Schemas, loader utilities, and preference stores
├── public/                   # Static assets and search-index.json
├── scripts/                  # Build-time validation and index generation
└── tools/admin/              # Dev-only local administration GUI (port 4321)
```

---

## Production Deployment

The project is configured for static export (`output: 'export'`) and outputs to the `out/` directory with zero server runtime dependencies.

- **Build Command**: `npm run build`
- **Output Directory**: `out`
- **Node.js Runtime**: None required in production. Deployable directly to Cloudflare Pages, GitHub Pages, or any static object storage.

*Note: The `tools/admin/` curation server is strictly a local development tool and is excluded from the production build.*

---

## License

This project is open-source under the MIT License. *Re:Zero kara Hajimeru Isekai Seikatsu* and related lore statements belong to Tappei Nagatsuki, Kadokawa, and White Fox.
