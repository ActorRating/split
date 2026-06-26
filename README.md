# Split

Daily “would you rather” polls — vote, see live results, build a streak.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order in the SQL Editor:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_v3_schema.sql`
   - `supabase/migrations/003_schedule_future_polls.sql`
3. Enable **Anonymous sign-ins**: Authentication → Providers → Anonymous
4. Add your user to admins (for `/admin`):
   ```sql
   INSERT INTO admin_users (user_id) VALUES ('<your-auth-user-uuid>');
   ```

## Deploy on Vercel

### 1. Import the repo

[Import `ActorRating/split`](https://vercel.com/new) from GitHub.

### 2. Build settings (critical)

In **Project → Settings → Build & Deployment**:

| Setting | Value |
|---------|--------|
| **Framework Preset** | `Next.js` (not “Other”) |
| **Root Directory** | *(leave empty)* |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | *(leave empty — do not set `.next` or `out`)* |
| **Install Command** | `npm install` (default) |

If Framework Preset is “Other” or Output Directory is set manually, Vercel serves an empty folder and you get **`404: NOT_FOUND`**.

### 3. Environment variables

In **Project → Settings → Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Apply to **Production**, **Preview**, and **Development**.

### 4. Deploy

Push to `main` or click **Redeploy** in the Vercel dashboard (uncheck “Use existing Build Cache” if the first deploy failed).

Production URL will look like: `https://split-xxxx.vercel.app` (assigned by Vercel — not `split.vercel.app`, which is a different project).

### 5. Admin

Visit `https://your-deployment.vercel.app/admin/login` with your Supabase email/password admin account.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm run start    # run production build locally
npm run lint     # ESLint
```
