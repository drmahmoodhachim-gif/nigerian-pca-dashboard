# Prostate RNA-seq Collaborator Dashboard

Live dashboard for Nigerian vs Portuguese prostate cancer RNA-seq results (Paper-2), backed by **Supabase** and hosted on **Netlify**.

## Stack

- **Frontend:** Vite + React + Recharts
- **Database:** Supabase (`pc_*` tables)
- **Auth:** Supabase magic link (invite collaborators in Supabase → Authentication → Users)
- **Deploy:** GitHub → Netlify

## Local development

```bash
cd dashboard
cp .env.example .env.local
# Edit .env.local with your Supabase URL + anon key
npm install
npm run dev
```

## Load analysis data into Supabase

```bash
# Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Dashboard → Settings → API)
npm run seed
```

This uploads significant DEGs, fgsea pathways, PROGENy scores, and ESTIMATE purity from `../Paper-2/`.

## Deploy to Netlify

1. Push this folder to GitHub (repo `nigerian-pca-dashboard` or monorepo subfolder).
2. In [Netlify](https://app.netlify.com): **Add site → Import from Git**.
3. Base directory: `Manuscript/dashboard` (if monorepo) or repo root.
4. Build command: `npm run build` · Publish: `dist`
5. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. In Supabase → Authentication → URL configuration, add your Netlify URL to **Redirect URLs**.

## Invite collaborators

1. Supabase → **Authentication** → **Users** → **Invite user** (email).
2. They open the Netlify URL, enter email, click the magic link.
3. RLS allows read-only access to `pc_*` tables when signed in.

## Tables

| Table | Content |
|-------|---------|
| `pc_samples` | Sample metadata (12 samples) |
| `pc_comparisons` | DESeq2 comparison labels |
| `pc_deg` | Significant DEGs per comparison |
| `pc_fgsea` | Hallmark fgsea results |
| `pc_progeny` | PROGENy pathway scores |
| `pc_estimate` | ESTIMATE stroma / immune / purity |
