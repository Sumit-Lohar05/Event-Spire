# Event-Spire Project Audit

**Audit date:** 2026-09-26  
**Scope:** `Client/`, `Server/`, package scripts, API contracts, and the end-to-end browse/auth/host/purchase/profile flow.

## Executive Summary

The frontend production build succeeds, but the project is not production-ready. The main risks are ticket and capacity data integrity, authorization weaknesses in cancellation/deletion, an incomplete event-edit flow, inconsistent identifier handling, and an optimistic client state flow that can lose or duplicate data. The backend has only one direct unit test and its `npm test` script is still a placeholder.

## Verification Performed

- `Client/npm run build`: **passes**.
- `Client/npm run lint`: **fails** with 4 errors and 1 warning in `Auth.jsx`, `Navbar.jsx`, `EventDetails.jsx`, and `Profile.jsx`.
- `Server/npm test`: **fails by design** because the script is `echo "Error: no test specified" && exit 1`.
- `Server/node --test tests/emailConfig.test.js`: **passes** (1 test).
- `Server/.env` is ignored and was not returned by `git ls-files`; it still contains live-looking credentials and must be treated as compromised if it has been shared.

## Repair Phase Status

- Phase 1 security and data-integrity repairs completed.
- Phase 2 event loading, dates, prices, descriptions, and editing completed.
- Phase 3 authentication restoration, favorites recovery, API helper, and lint repairs completed.
- Phase 4 native backend tests, route security tests, and CI workflow completed.
- Phase 5 deployment configuration, environment templates, CORS restrictions, and deployment runbook completed.

Database-backed integration tests, frontend behavioral tests, credential rotation, image storage migration, and organizer/payment features remain outside the completed repair scope.

## Confirmed Bugs and Risks

### P0: Rotate credentials and keep secrets out of shared environments

**Location:** `Server/.env`

The local environment file contains a MongoDB connection credential, JWT secret, and Gmail app password. Although it is currently ignored, these values should be rotated if they have appeared in a commit, screenshot, issue, log, or shared archive. Use deployment secrets and provide a checked-in `.env.example` containing names only.

### P1: Ticket purchase can consume capacity without creating a ticket

**Locations:** `Client/src/pages/EventDetails.jsx`, `Client/src/App.jsx`, `Server/routes/eventRoutes.js`, `Server/routes/userRoutes.js`

The client first increments event attendees through `/api/events/purchase`, then separately writes the booking through `/api/users/book-ticket`. If the second request fails, the attendee count remains incremented while no ticket is stored. `handleBookTickets` also does not surface a failed response to the user. Make purchase and booking one authenticated server transaction/operation, or add a compensating rollback and idempotency key.

### P1: Cancellation is not authorized against the logged-in user

**Location:** `Server/routes/eventRoutes.js` (`POST /cancel`)

The route authenticates a token but trusts `userId` and `bookingId` from the request body. It decrements event capacity before checking that the booking belongs to `req.user`, and it can remove a booking from an arbitrary supplied user. Validate ownership from the token, verify the booking exists, and update the booking and event atomically. Reject invalid, zero, negative, or non-integer quantities.

### P1: Purchase validation is bypassable and can oversell under concurrency

**Location:** `Server/routes/eventRoutes.js` (`POST /purchase`)

`ticketQuantity` is coerced with `Number()` without requiring a positive integer. Negative quantities can reduce attendees. Capacity is checked in one query and updated in another, so concurrent purchases can both pass the check. Put `attendees + quantity <= maxCapacity` in the update filter, validate the quantity, and return the updated document only when the atomic update succeeds.

### P1: Event deletion uses client-supplied identity and only finds custom IDs

**Locations:** `Client/src/App.jsx`, `Server/routes/eventRoutes.js`

The client sends `userId` in the request body, and the server compares that value instead of relying solely on `req.user.id`. The route only searches `{ id: eventId }`; the client may pass a Mongo `_id` from other event paths, producing a false 404. Authorize with `req.user.id`, normalize ID lookup in one helper, and delete by the event document's creator identity.

### P1: The edit-event UI is linked but not implemented

**Locations:** `Client/src/components/EventCard/EventCard.jsx`, `Client/src/components/HostEvent/HostEventPage.jsx`, `Server/routes/eventRoutes.js`

The card links to `/host-event?edit=...`, but `HostEventPage` never reads the query string, never loads an existing event, and always submits a new event. There is no update endpoint. This can mislead users into creating duplicates. Either remove the edit control until supported or implement load/edit state plus an authorized `PATCH /api/events/:id` route.

### P1: Saved events are inconsistent across ID shapes and are not reliably persisted

**Locations:** `Client/src/pages/SavedEvents.jsx`, `Client/src/App.jsx`

`SavedEvents` filters only `event.id`, while other views use `event.id || event._id`. A database event with only a Mongo identifier will disappear from the wishlist. `clearAllFavourites` updates local state but never synchronizes the empty list to the server. Failed optimistic favorite updates also leave the UI changed. Normalize event IDs everywhere and rollback or refetch after sync failures.

### P1: Login state is trusted from localStorage without token validation

**Locations:** `Client/src/App.jsx`, `Server/middleware/authMiddleware.js`

The app can restore `isLoggedIn=true` and render protected pages after a token has expired or been removed. API requests then fail while the UI still appears authenticated. Store only the token, validate/refresh it on startup, and clear session state on any 401 response.

### P2: Event details ignore the stored description

**Location:** `Client/src/pages/EventDetails.jsx`

The page renders a hard-coded generic paragraph instead of `event.description`, so hosted and seeded event descriptions are never shown.

### P2: Direct event loading is coupled to the home-page fetch

**Locations:** `Client/src/App.jsx`, `Client/src/pages/EventDetails.jsx`, `Server/routes/eventRoutes.js`

`EventDetails` searches the in-memory home-page collection. A direct visit or refresh to `/event/:id` shows a loading state until the collection request completes, and an event not returned by that list cannot be opened even though `GET /api/events/:id` exists. Fetch the requested event by ID on the details page or provide a shared event-query layer. The server detail route currently supports only the custom `id`, not `_id`.

### P2: Date handling is incomplete and can produce invalid results

**Locations:** `Client/src/data/event.js`, `Client/src/App.jsx`, `Client/src/components/FeaturedEvents.jsx`, `Client/src/pages/EventDetails.jsx`

The `Tech Summit 2026` seed record has no `year`, producing invalid sorting, filtering, countdown, and expiration calculations. More broadly, date strings discard event time and treat midnight on the event date as expired. Store a real ISO start/end date and use one timezone policy.

### P2: Client and server error handling is incomplete

**Locations:** `Client/src/App.jsx`, `Client/src/pages/EventDetails.jsx`

The initial events request does not check `response.ok` or guarantee an array, and only logs errors; users receive no useful offline/server-error state. Booking and cancellation also show inconsistent alerts/toasts and do not always handle non-OK responses. Add request helpers, typed/validated response handling, loading/error/empty states, and consistent notifications.

### P2: Lint failures indicate maintainability and render-flow problems

**Locations:** `Client/src/components/Auth/Auth.jsx`, `Client/src/components/Navbar.jsx`, `Client/src/pages/Profile.jsx`, `Client/src/pages/EventDetails.jsx`

ESLint reports synchronous state updates inside effects in three components, an unused `use` import, and a missing hook dependency warning. Refactor derived/reset state so effects synchronize external systems or subscriptions rather than forcing immediate cascading renders; remove the unused import and stabilize the countdown callback/dependencies.

### P2: Display and data contracts are inconsistent

**Locations:** `Client/src/pages/EventDetails.jsx`, `Client/src/components/Tickets/MyTickets.jsx`, `Client/src/components/EventCard/EventCard.jsx`, `Server/models/Event.js`

Prices are displayed with rupees in cards but dollars in checkout and tickets. The schema declares `price` as a string while the host form sends a number. `EventDetails` calls `.replace()` on `event.price` without first handling numeric values. Define one numeric currency contract and format it in one shared utility.

### P2: Email verification is environment-specific and fragile

**Locations:** `Server/routes/authRoutes.js`

Verification redirects are hard-coded to `http://localhost:5173`, and the logo attachment path uses lowercase `client` while the workspace directory is `Client`. This is fragile on case-sensitive deployments. Build URLs and asset paths from environment/configuration and validate required mail settings at startup.

### P3: Hosted-event data is incomplete

**Location:** `Client/src/components/HostEvent/HostEventPage.jsx`

The form does not collect a real description, event time, end time, venue details, or ticket type. It sends the placeholder description `New event created by organizer`. Add the fields that the details and ticketing workflows need, with server-side validation and image upload/storage rather than large base64 strings in MongoDB.

### P3: Product claims are not implemented

**Location:** `Client/src/components/HostEvent/HostEvent.jsx`

The organizer section claims secure payment processing, payouts, marketing tools, analytics, and sales tracking, but the repository contains no payment provider, payout flow, organizer dashboard, or analytics implementation. Change the copy until these features exist or add them to the roadmap.

## End-to-End Flow Assessment

1. **Browse:** Home fetches events from MongoDB and filters client-side. It works after a successful API response, but has no request error UI and does not use `Client/src/data/event.js` as a fallback or seed source.
2. **Authentication:** Registration, email verification, and login are present. Verification email delivery is a hard dependency, and sessions are not restored or invalidated robustly.
3. **Favorites:** Anonymous local favorites work in principle; authenticated sync is optimistic and has ID/clear-all consistency defects.
4. **Host event:** Auth protection and create flow exist. Validation is mostly HTML-only, and edit is incomplete.
5. **Purchase:** The UI and capacity increment exist, but persistence is split across two requests and lacks transaction/idempotency protection.
6. **Tickets/cancellation:** Tickets are rendered from local state seeded at login. Cancellation can corrupt capacity and lacks ownership checks.
7. **Profile:** Profile fields and image preview exist. Updates are authenticated, but base64 image storage and lint failures remain; attendee/saved lists depend on the event collection being loaded.

## Recommended Implementation Order

### Phase 1: Protect data and credentials

1. Rotate MongoDB, Gmail, and JWT credentials; restrict the database user and configure secrets outside the repository.
2. Add strict server validation for event IDs, quantities, dates, prices, capacities, and required fields.
3. Make purchase/cancel atomic and ownership-aware; add idempotency and duplicate-booking rules.
4. Replace body-supplied authorization with `req.user.id` for every protected operation.

### Phase 2: Finish core event functionality

1. Normalize event IDs and dates in a shared API/domain model.
2. Add direct event fetching and a proper not-found/error state.
3. Implement event descriptions and the complete host form.
4. Implement or remove edit-event controls, including an authorized update endpoint.
5. Make wishlist synchronization transactional from the user’s perspective, including clear-all and rollback.

### Phase 3: Stabilize the frontend

1. Fix all ESLint errors and the countdown hook dependency warning.
2. Add a centralized API client that handles base URL, JSON errors, auth headers, and 401 logout.
3. Add visible loading, retry, offline, and mutation-pending states.
4. Use one currency/date formatter and add responsive validation for all forms.

### Phase 4: Test and operate

1. Replace the backend placeholder test script with `node --test` and add route tests using an isolated database.
2. Add frontend component/integration tests for auth, wishlist, purchase failure, cancellation, direct event loading, and edit mode.
3. Add API security tests for unauthorized deletion/cancellation, negative quantities, overselling, duplicate booking, and expired tokens.
4. Add CI to run lint, build, and tests on every change.
5. Add a deployment configuration for frontend URL, API URL, mail settings, CORS allowlist, and database secrets.

## Suggested Acceptance Criteria

- A failed booking cannot consume event capacity.
- A user cannot cancel or delete another user’s data, even if they alter the request body.
- Concurrent purchases cannot exceed `maxCapacity`.
- Refreshing a direct `/event/:id` URL loads the event independently of the home page.
- Editing an event updates the existing record and never creates a duplicate.
- Favorites and tickets remain correct after reload, logout/login, failed requests, and empty-list actions.
- `npm run lint`, `npm run build`, and the backend test command all pass in CI.