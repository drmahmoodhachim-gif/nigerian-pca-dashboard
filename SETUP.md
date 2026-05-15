# Production setup checklist

## Supabase (one-time)

1. **Authentication → URL configuration**
   - Site URL: `https://nigerian-pca-dashboard.netlify.app`
   - Redirect URLs (add all):
     - `https://nigerian-pca-dashboard.netlify.app`
     - `https://nigerian-pca-dashboard.netlify.app/**`
     - `http://localhost:5173/**`

2. **Authentication → Providers → Email** — enabled

3. **Authentication → Users** — Invite each collaborator by email

## Netlify

Site: **nigerian-pca-dashboard** → https://nigerian-pca-dashboard.netlify.app

Environment variables (Production + Deploy previews):

| Key | Value |
|-----|--------|
| `VITE_SUPABASE_URL` | `https://dyjhlnfoqjwzaxgwvtzl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | From Supabase → Settings → API → anon public |

Link GitHub repo: `drmahmoodhachim-gif/nigerian-pca-dashboard` for auto-deploy on push.

## Refresh data after new analyses

```bash
cd dashboard
# Add SUPABASE_SERVICE_ROLE_KEY to .env.local
npm run seed
```
