# Deploying NewWork to dimaggi.ai

Architecture: the app runs on **Firebase App Hosting** (built from the GitHub
repo `mutebironald/newWork`), and a **Cloudflare Worker** on the `dimaggi.ai`
zone proxies requests (`newwork.dimaggi.ai/*` or `dimaggi.ai/newwork/*`) to it.

Repo-side config (already committed):

- `apphosting.yaml` — sets `NEXT_PUBLIC_BASE_PATH=/newwork` (or `""` if at subdomain root) and
  `NEXT_PUBLIC_APP_URL=https://newwork.dimaggi.ai`, and maps Stripe/Gemini secrets
  from Cloud Secret Manager.
- `lib/firebase.ts` — uses Application Default Credentials when running on
  App Hosting (`FIREBASE_CONFIG` present), so no service-account key is
  needed; real Firestore replaces the local filesystem mock automatically.
- `deploy/cloudflare-newwork-worker.js` — the proxy Worker.

## 1. Firebase project + App Hosting backend

```bash
npm i -g firebase-tools
firebase login
firebase projects:create dimaggi-newwork   # or reuse an existing project
firebase use dimaggi-newwork
```

Enable **Firestore** (Native mode) and **Cloud Storage** in the Firebase
console, then create the backend (this walks you through connecting the
GitHub repo and picking the live branch, `main`):

```bash
firebase apphosting:backends:create --project dimaggi-newwork
```

Note the backend URL it prints (e.g. `https://newwork--dimaggi-newwork.us-central1.hosted.app`).

## 2. Secrets

```bash
firebase apphosting:secrets:set GEMINI_API_KEY
firebase apphosting:secrets:set STRIPE_SECRET_KEY
firebase apphosting:secrets:set STRIPE_WEBHOOK_SECRET   # value comes from step 4
```

Grant the backend access when prompted (or `firebase apphosting:secrets:grantaccess`).

## 3. Cloudflare Worker route

1. Cloudflare dashboard → **Workers & Pages** → Create Worker.
2. Paste `deploy/cloudflare-newwork-worker.js`, replacing `BACKEND_ORIGIN`
   with the backend URL from step 1.
3. Worker → Settings → **Domains & Routes** → Add route
   `newwork.dimaggi.ai/*` (or `dimaggi.ai/newwork*`) on the `dimaggi.ai` zone.

## 4. Stripe webhook

Point the webhook **directly at the backend URL** (skips the proxy hop):

```
https://<backend-url>/newwork/api/payments/stripe-webhook
```

Events: `checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`. Copy the signing secret into the
`STRIPE_WEBHOOK_SECRET` secret (step 2) and trigger a rollout.

## 5. Verify

- `https://newwork.dimaggi.ai` (or `https://dimaggi.ai/newwork`) loads the app.
- Register/login works and data survives a redeploy (proves real Firestore,
  not the filesystem mock).
- A test checkout redirects back to `https://newwork.dimaggi.ai/programs/...`.

Deploys are automatic on push to `main` once the backend is connected.
