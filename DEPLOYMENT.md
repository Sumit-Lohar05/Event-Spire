# Event-Spire Deployment Runbook

## Environment

The server requires the variables listed in `Server/.env.example`. The client uses `VITE_API_URL` from `Client/.env.example`.

- `MONGO_URI`: use a least-privilege MongoDB user and restrict network access.
- `JWT_SECRET`: generate a random value of at least 32 characters.
- `BASE_URL`: public API origin used in verification emails.
- `FRONTEND_URL`: public frontend origin used after verification.
- `CORS_ORIGINS`: comma-separated frontend origins allowed by the API.
- `EMAIL_USER` and `EMAIL_PASS`: use a mail-provider app password or deployment secret.
- `MONGO_TRANSACTIONS`: set to `true` only when the MongoDB deployment supports transactions; otherwise the ticket service uses compensation.
- `VITE_API_URL`: public API origin consumed by the browser build.

Never commit `.env` files, print their contents, or place secret values in issue reports, logs, screenshots, or generated documentation.

## Credential Rotation

If the local credentials have ever been shared or committed outside the ignored local file:

1. Revoke and recreate the MongoDB database credential.
2. Revoke and recreate the mail-provider app password.
3. Generate a new JWT secret.
4. Update the deployment secret store and restart the server.
5. Invalidate existing sessions by changing the JWT secret.
6. Review Git history and hosting logs for accidental exposure.

Rotation requires the project owner or deployment administrator and is intentionally not performed by this repair.

## CORS and URLs

Set `FRONTEND_URL` and `CORS_ORIGINS` to the exact deployed browser origin, including scheme and port where applicable. Do not use a wildcard origin when authenticated requests are enabled. Set `VITE_API_URL` before building the client.

## Email Verification

The verification link is generated from `BASE_URL`; the final redirect uses `FRONTEND_URL`. The server expects the Event-Spire logo at `Client/src/assets/logo1.png`. For production email delivery, verify the mail provider configuration and attachment path during deployment.

## Images

The current profile and event forms can send base64 image data. This increases request size and MongoDB document growth. For production, store images in object storage or a media service, save only a URL and metadata in MongoDB, enforce content type and size limits, and add malware/content checks where required.

## Deployment Checks

Run from the repository root:

```text
Client: npm ci && npm run lint && npm test && npm run build
Server: npm ci && npm test
```

The repository CI workflow runs these checks for pushes and pull requests. Database-backed integration tests still require a separate isolated MongoDB environment.

Ticket purchase and cancellation use MongoDB transactions only when `MONGO_TRANSACTIONS=true`. Otherwise, the service uses atomic updates with compensation. Compensation cannot guarantee cross-document atomicity if the process stops between writes, so production should use a transaction-capable MongoDB deployment and run the integration suite with a separate `TEST_MONGO_URI`.

## Remaining Product Work

Payment processing, payouts, organizer analytics, attendee insights, and marketing tools are not implemented. Do not advertise these capabilities as production features until their workflows, authorization, operational monitoring, and tests exist.
