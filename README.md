# UNDERCONTROL Store

Modern Next.js ecommerce landing page with a persistent cart, color selections, checkout summary, and Resend-powered order emails.

## Getting Started

```bash
bun install
bun run dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and set:

- `RESEND_API_KEY`: Server-side API key from Resend (Project → API Keys).
- `FROM_EMAIL`: Verified sender, e.g. `UNDERCONTROL Orders <orders@yourdomain.com>`.
- `ADMIN_EMAIL`: Address that must receive every order notification.

Restart `bun run dev` after editing `.env.local`. These values are also required in Vercel’s project settings (Settings → Environment Variables).

## Building & Testing

```bash
bun run lint
bun run build
```

## Deployment (Vercel)

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repo into [Vercel](https://vercel.com/import).
3. Set the three env vars above in Vercel.
4. Click **Deploy**. The `/api/order-email` route sends checkout emails through Resend using those secrets.

## Notes

- Checkout keeps cart state in `localStorage` and only sends email once the user confirms the modal.
- All Resend secrets stay on the server (API route), so no keys are exposed client-side.
