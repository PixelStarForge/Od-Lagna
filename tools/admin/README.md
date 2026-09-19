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
