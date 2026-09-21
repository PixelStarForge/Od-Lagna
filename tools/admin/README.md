# Od-Lagna Local Admin Tool

> **IMPORTANT**: This directory (`tools/admin/`) contains a local development utility strictly for authoring and curating Q&A entries on your workstation.
>
> - It is **never** built or deployed to Cloudflare Pages.
> - It runs on `http://localhost:4321` via `npm run admin`.
> - It must **never** be exposed publicly.
> - Next.js does not import or bundle anything from this directory.

## Usage

```bash
npm run admin
```

Open `http://localhost:4321` in your browser to create, edit, or delete Q&A JSON files in `content/qna/`.

## Features

- **Strict Duplicate Prevention & Similarity Detection**:
  - Live normalized question check as you type (detects casing, punctuation, and whitespace variations).
  - Exact duplicates are blocked on the server (`HTTP 409`) and disable the save button in the UI.
  - Yellow similarity warnings flag potential near-duplicates with matching percentage and quick jump links.
- **⚡ Quick Paste & Auto-Fill**:
  - Paste raw Q&A text from Twitter, interview transcripts, or summaries (e.g. `Q: ... A: ... Date: ... Arc: ... Source: ...`).
  - Automatically parses fields, matches known characters/topics, and pre-fills the form.
- **✨ Smart Tag Suggestions**:
  - Automatically scans typed Question and Answer text for mentions of known characters and topics.
  - One-click chip buttons to add individual tags or "+ Add All".
- **📋 Clone as Template**:
  - One-click button while viewing an entry to start a new entry retaining the same Date, Arc, Source, and Verification status.
- **Local Draft Autosave & Safety**:
  - Automatically preserves uncommitted form input in `localStorage` across page reloads.
  - Prompts confirmation if switching entries with unsaved dirty changes.
- **Keyboard Shortcuts**:
  - `Ctrl+Enter` / `Cmd+Enter`: Save Q&A entry.
  - `Alt+N`: Create new Q&A.
  - `Esc`: Close modals and autocompletes.

