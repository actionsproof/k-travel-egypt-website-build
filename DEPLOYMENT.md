# Production deployment

The production setup uses Neon Postgres for trips and inquiries, and Vercel Blob for durable public trip media. The app does not run schema changes during a deployment; initialize the database explicitly before deploying.

## 1. Create and initialize Neon

1. Create a Neon project and database.
2. Copy its pooled Postgres connection string and keep `sslmode=require` enabled. Use it as `DATABASE_URL` for the deployed app.
3. Copy the direct (unpooled) connection string as `DATABASE_URL_UNPOOLED` for local migration and seed commands. If you only have one URL, `DATABASE_URL` is also accepted by those commands.
4. With Node.js 22+ and pnpm installed, run:

   ```powershell
   pnpm install --frozen-lockfile
   pnpm db:migrate
   pnpm db:seed
   ```

`db:migrate` applies the idempotent schema in `scripts/init-db.sql` inside a transaction. `db:seed` inserts the initial travel catalog and site content without overwriting existing rows. Both prefer `DATABASE_URL_UNPOOLED`. Keep database URLs private and never commit `.env.local`.

## 2. Configure durable media

1. Create a Vercel Blob store in the Vercel project’s Storage dashboard.
2. Connect the store to this project and enable its read/write token for Development, Preview, and Production. Vercel provides `BLOB_READ_WRITE_TOKEN`.
3. The admin uploader sends files directly from the browser to Blob; image uploads are limited to 25 MB and video uploads to 250 MB. The server issues upload tokens only to signed-in admins and restricts file content types.

Media is public because trip galleries are public. Removing an asset from a trip removes its database reference; the Blob object may need to be removed separately from the Vercel Blob dashboard.

## 3. Set Vercel environment variables

Set these for every environment where the admin panel should work:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `ADMIN_EMAIL` | Admin email, or comma-separated allowlist |
| `ADMIN_PASSWORD` | Random password with at least 16 characters |
| `NEON_AUTH_COOKIE_SECRET` | Random secret with at least 32 characters |
| `BLOB_READ_WRITE_TOKEN` | Added by the connected Vercel Blob store |

Generate a cookie secret locally with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Set the admin password separately in Vercel’s encrypted environment-variable settings. Do not put either secret in source control or share it in chat. Production sign-in requires both an allowlisted email and the password. Local development may omit the password for convenience; that behavior is disabled in production.

## 4. Deploy and verify

Connect the GitHub repository to Vercel and deploy `main` after adding the environment variables. Once deployment is ready:

1. Open `/admin/login`, sign in with the configured email and password, and create or update a test trip.
2. Upload an image and a small video; verify the returned media is visible in the public trip gallery after saving.
3. Submit a test inquiry and confirm it appears in the admin dashboard after a refresh.
4. Confirm `/api/admin/trips` returns `401` when accessed without an admin session.

If you change the database schema later, apply the matching migration explicitly before deploying application code that depends on it. Production admin mutations and public inquiry submissions fail instead of pretending to save when `DATABASE_URL` is missing.
