# LastMile Aid — Frontend UI Specification (Build Frontend First)

Purpose: a complete, implementation-ready spec so the frontend can be generated and demoed **before the backend exists**. The UI talks to an `api` layer with a swappable implementation: `mockApi` now (in-memory, deterministic), `httpApi` later (real Express backend). Types and endpoint shapes match the PRD so the swap is mechanical.

> Honesty rule: while on `mockApi`, show a small "DEMO DATA" badge in the footer. Mock ETAs are labelled "Estimated (mock)". Never show fake payments or fake success.

---

## 1. Frontend Stack

| Need | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 (data router, route guards by role) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Icons | lucide-react |
| Server state | TanStack Query (cache, retries, optimistic where safe) |
| Client state | Zustand (session, role, clock offset, socket status) |
| Forms | React Hook Form + zod |
| Maps | Leaflet + react-leaflet + OpenStreetMap |
| Charts | Recharts |
| Realtime | `socket.io-client` behind a `realtime` adapter; `mockRealtime` uses an event emitter |
| Dates | date-fns (all display via a single `formatLocal(utcIso)` helper) |
| Tests | Vitest + React Testing Library; Playwright for key flows |
| Mock data | In-memory store + MSW (optional) — choose ONE: `mockApi` class (recommended) |

### Folder structure

```
frontend/
  src/
    app/            router.tsx, providers.tsx, guards.tsx
    api/            types.ts, client.ts (interface), mockApi.ts, httpApi.ts, seed.ts
    realtime/       realtime.ts (interface), mockRealtime.ts, socketRealtime.ts
    components/
      ui/           shadcn components
      common/       StatusBadge, UrgencyBadge, CountdownTimer, EtaBadge, EmptyState, ErrorState, SkeletonList, ConnectionIndicator, DemoBanner
      donation/     DonationForm, DonationCard, AllocationTable, ModeRecommendation
      task/         TaskCard, TaskBoard, TaskTimeline, RerouteProposalCard
      site/         SiteCard, DemandEditor, CapabilityToggles, SiteStatusSwitch
      map/          LiveMap, MapLegend, MarkerIcon
      credits/      LedgerTable, Leaderboard
      admin/        SimulationPanel, EventLog, AuditTable
    pages/          (one folder per page, see §5)
    hooks/          useServerClock, useCountdown, useRealtimeEvent, useRole
    lib/            format.ts, urgency.ts, constants.ts, cn.ts
    styles/         globals.css (tokens)
```

---

## 2. Design System

**Tone:** clean, credible civic-tech. Information-dense but calm. Status clarity beats decoration.

### 2.1 Color tokens (CSS variables; light + dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F8FA` | `#0F1419` | Page background |
| `--surface` | `#FFFFFF` | `#161C23` | Cards |
| `--border` | `#E3E7EC` | `#2A323C` | Borders |
| `--text` | `#14202B` | `#E8EDF2` | Body text |
| `--muted` | `#5B6B7A` | `#9AA8B6` | Secondary text |
| `--primary` | `#0F766E` (teal) | `#2DD4BF` | Primary actions |
| `--primary-fg` | `#FFFFFF` | `#06201D` | Text on primary |
| `--info` | `#2563EB` | `#60A5FA` | Informational |
| `--success` | `#15803D` | `#4ADE80` | Verified / delivered |
| `--warning` | `#B45309` | `#FBBF24` | Urgent |
| `--danger` | `#B91C1C` | `#F87171` | Critical / error |
| `--neutral` | `#64748B` | `#94A3B8` | Closed / inactive |

Text/background pairs must meet WCAG AA (≥ 4.5:1). Color is **never the only signal**: every status has an icon + text label.

### 2.2 Typography and spacing

- Font: `Inter` (fallback `system-ui, sans-serif`). Numbers use `font-variant-numeric: tabular-nums` (countdowns, quantities).
- Scale: 12 / 14 / 16 (base) / 18 / 20 / 24 / 30. Headings semibold. Line height 1.5.
- Spacing: 4 px grid. Card padding 16 (mobile) / 24 (desktop). Radius 12 (cards), 8 (inputs/buttons). Shadow: subtle `0 1px 2px rgba(0,0,0,.06)`.
- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Mobile-first.

### 2.3 Status and urgency vocabulary (single source in `lib/constants.ts`)

| Entity | State | Label | Icon | Color |
|---|---|---|---|---|
| Urgency | NORMAL (>2 h) | "Normal" | `Clock` | neutral |
| Urgency | URGENT (30 m–2 h) | "Urgent" | `AlertTriangle` | warning |
| Urgency | CRITICAL (<30 m) | "Critical" | `Flame` | danger |
| Urgency | EXPIRED | "Expired" | `XCircle` | danger (muted bg) |
| Site | OPEN / FULL / CLOSED | "Open" / "Full" / "Closed" | `CheckCircle2` / `Ban` / `Lock` | success / warning / neutral |
| Task | OPEN | "Available" | `CircleDot` | info |
| Task | CLAIMED | "Claimed – awaiting ack" | `Hourglass` | warning |
| Task | ACKNOWLEDGED | "Acknowledged" | `ThumbsUp` | info |
| Task | PICKED_UP / IN_TRANSIT | "Picked up" / "In transit" | `Package` / `Truck` | info |
| Task | REROUTE_PROPOSED | "Reroute proposed" | `Route` | warning |
| Task | DELIVERED | "Delivered – awaiting site confirm" | `PackageCheck` | info |
| Task | DELIVERED_VERIFIED | "Verified" | `BadgeCheck` | success |
| Task | FAILED_NO_DESTINATION | "No safe destination" | `OctagonAlert` | danger |
| Verification | VERIFIED / PENDING / REJECTED | badge | `ShieldCheck` / `Hourglass` / `ShieldX` | success / warning / danger |

### 2.4 Core components (behaviour spec)

| Component | Behaviour |
|---|---|
| `CountdownTimer` | Props `expiryUtc`. Uses `useServerClock()` offset (from `time.sync`/API `server_now`), **not** `Date.now()` alone. Format `Hh MMm` > 1 h, `MM:SS` < 1 h. Updates each second visually; `aria-live` announces only at thresholds (2 h, 30 min, 5 min, expired). Shows "Expired" at 0. |
| `UrgencyBadge` | Derived by `getUrgency(expiryUtc, serverNow)`; never stored on client. |
| `EtaBadge` | Shows minutes + source chip: "Estimated (mock)" when `source` is `mock*`. |
| `StatusBadge` | Maps status → icon + label + color from the table above. |
| `ConnectionIndicator` | Green "Live" / amber "Reconnecting…" / grey "Offline". When offline, mutating buttons show "Offline" and are disabled. |
| `EmptyState` | Icon, title, one-line help, optional CTA. |
| `ErrorState` | Message from `error.code` mapping (see §7), "Try again" button, request id in small text. |
| `SkeletonList` | Shimmer rows matching card heights; respects `prefers-reduced-motion`. |
| `ConfirmDialog` | Used for destructive/impactful actions (site FULL/CLOSED with in-flight deliveries, cancel donation). Shows affected items. |
| `DemoBanner` | Top ribbon: "DEMO MODE — simulated data" when `VITE_DEMO_MODE=true`. |

---

## 3. Navigation and Layout

### 3.1 App shell

- **Desktop (≥ lg):** left sidebar (role-based links), top bar (page title, `ConnectionIndicator`, notification bell with unread count, role switcher if multi-role, user menu).
- **Mobile (< lg):** top bar + **bottom tab bar** (4–5 items). Primary action buttons fixed above the bottom bar for riders.
- Skip-to-content link; landmarks `header`, `nav`, `main`, `footer`.

### 3.2 Menus per role

| Role | Items |
|---|---|
| Donor | Dashboard · New Donation · NGOs · Open Gate · Credits · Notifications |
| Rider | Tasks · My Tasks · Map · Credits · Notifications |
| Helper | Alerts · My Task · Map · Credits |
| NGO operator | Operations · Incoming · Profile · Notifications |
| Admin | Console · Donations · Sites · Users · Audit · Events |

### 3.3 Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing | Public |
| `/login`, `/register` | Auth | Public |
| `/donor` | Donor dashboard | DONOR |
| `/donations/new` | Create donation | DONOR |
| `/donations/:id` | Donation details | Owner / Admin |
| `/rider` | Volunteer dashboard | RIDER |
| `/tasks` | Available-task board | RIDER, HELPER |
| `/tasks/:id` | Delivery detail + timeline | Claimant / donor / site / admin |
| `/map` | Live map | Authenticated |
| `/ngos`, `/ngos/:id` | Directory, profile | Authenticated |
| `/site/:id` | Shelter operations | NGO_OPERATOR (own), Admin |
| `/open-gate`, `/open-gate/:id` | Listings | Authenticated |
| `/helper` | Emergency helper | HELPER |
| `/credits` | Credits + leaderboard | Authenticated |
| `/notifications` | Notifications | Authenticated |
| `/admin/console` | Simulation console | ADMIN / demo-admin |
| `/admin/audit` | Audit and event log | ADMIN |
| `*` | 404 page | Any |

Route guards redirect unauthenticated users to `/login?next=…` and show a 403 page for wrong role. Guards are UX only; backend authorization is authoritative.

---

## 4. Data Types (`api/types.ts`)

```ts
export type Role = 'DONOR'|'RIDER'|'HELPER'|'NGO_OPERATOR'|'ADMIN';
export type Urgency = 'NORMAL'|'URGENT'|'CRITICAL'|'EXPIRED';
export type SiteStatus = 'OPEN'|'FULL'|'CLOSED';
export type TaskStatus = 'OPEN'|'CLAIMED'|'ACKNOWLEDGED'|'PICKED_UP'|'IN_TRANSIT'|'REROUTE_PROPOSED'|'DELIVERED'|'DELIVERED_VERIFIED'|'FAILED_NO_DESTINATION'|'EXPIRED'|'CANCELLED';
export type DonationStatus = 'DRAFT'|'PUBLISHED'|'PARTIALLY_ALLOCATED'|'ALLOCATED'|'NEEDS_ASSISTANCE'|'IN_PROGRESS'|'OPEN_GATE'|'COMPLETED'|'CLOSED_WINDOW_ENDED'|'EXCEPTION'|'CANCELLED'|'EXPIRED_UNDELIVERED';
export type DistributionMode = 'VOLUNTEER'|'OPEN_GATE';
export type Capability = 'CLEAN_WATER'|'COOKING_FUEL'|'REFRIGERATION'|'INFANT_CARE_PROCEDURE'|'DRY_STORAGE';

export interface User { id:string; displayName:string; roles:Role[]; helperOptIn?:boolean }
export interface ItemCategory { code:string; label:string; requiredCapabilities:Capability[]; requiresColdChain:boolean; helperAllowed:boolean; handlingNotes?:string }
export interface Donation {
  id:string; donorId:string; category:string; description:string;
  quantity:number; unit:string; allocatedQty:number; deliveredQty:number;
  pickup:{ lat:number; lng:number; address:string };
  availableFromUtc:string; expiryUtc:string; handlingInstructions?:string;
  requiredCapabilities:Capability[]; mode:DistributionMode; status:DonationStatus;
  exceptionReason?:string; createdAtUtc:string;
}
export interface ReceivingSite {
  id:string; organizationId:string; orgName:string; name:string; address:string; lat:number; lng:number;
  status:SiteStatus; verification:'PENDING'|'VERIFIED'|'REJECTED'|'SUSPENDED';
  acceptedCategories:string[]; capabilities:Record<Capability,boolean>;
  demand:{ category:string; unit:string; demandQty:number; reservedQty:number; receivedQty:number }[];
}
export interface DeliveryTask {
  id:string; donationId:string; siteId:string; quantity:number; status:TaskStatus;
  claimedBy?:string; claimExpiresAtUtc?:string; pickupDeadlineUtc?:string;
  etaMinutes?:number; etaSource?:'provider'|'mock'|'mock_fallback';
  reroute?:{ proposalId:string; newSiteId:string; etaMinutes:number; etaSource:string; alternates:string[] };
  assignmentReason?:{ considered:number; rejections:{ siteId?:string; riderId?:string; code:string }[]; note:string };
}
export interface DeliveryEvent { id:number; taskId?:string; donationId:string; type:string; actor?:string; payload:any; createdAtUtc:string }
export interface Notification { id:string; type:string; title:string; body?:string; entityType?:string; entityId?:string; readAtUtc?:string; createdAtUtc:string }
export interface LedgerEntry { id:string; creditType:'DONOR'|'VOLUNTEER'|'HELPER'; eventType:string; amount:number; multiplier:number; subjectId:string; createdAtUtc:string; reverses?:string }
export interface OpenGateListing { id:string; donationId:string; venue:string; lat:number; lng:number; opensAtUtc:string; closesAtUtc:string; remainingQty:number; totalQty:number; unit:string; directions?:string; instructions?:string; status:'SCHEDULED'|'ACTIVE'|'CLOSED' }
export interface ApiError { code:string; message:string; fields?:{field:string;message:string}[]; requestId?:string }
```

### 4.1 `api/client.ts` interface (mirrors PRD endpoints)

```ts
export interface Api {
  serverNow(): Promise<string>;
  me(): Promise<User>;
  login(email:string, password:string): Promise<User>;
  register(input:{displayName:string; email:string; password:string; role:Role}): Promise<User>;
  setAvailability(a:{isAvailable:boolean; capacityQty:number; capacityUnit:string; hasColdBag:boolean; radiusKm:number; windowFrom?:string; windowUntil?:string}): Promise<void>;
  listDonations(q?:{mine?:boolean; status?:DonationStatus}): Promise<Donation[]>;
  getDonation(id:string): Promise<{donation:Donation; tasks:DeliveryTask[]; events:DeliveryEvent[]}>;
  createDonation(input:Omit<Donation,'id'|'status'|'allocatedQty'|'deliveredQty'|'createdAtUtc'|'donorId'>): Promise<Donation>;
  switchToOpenGate(donationId:string, input:{opensAtUtc:string; closesAtUtc:string; instructions?:string}): Promise<OpenGateListing>;
  availableTasks(): Promise<DeliveryTask[]>;
  claimTask(id:string): Promise<DeliveryTask>;            // may throw ALREADY_CLAIMED etc.
  acknowledgeTask(id:string): Promise<DeliveryTask>;
  confirmPickup(id:string, qty:number): Promise<DeliveryTask>;
  confirmDelivery(id:string, qty:number): Promise<DeliveryTask>;
  verifyReceipt(id:string, qty:number, note?:string): Promise<{task:DeliveryTask; credits:LedgerEntry[]}>;
  acceptReroute(taskId:string, proposalId:string): Promise<DeliveryTask>;
  declineReroute(taskId:string, reason:string): Promise<DeliveryTask>;
  listSites(q?:{category?:string; status?:SiteStatus}): Promise<ReceivingSite[]>;
  getSite(id:string): Promise<ReceivingSite>;
  setSiteStatus(id:string, status:SiteStatus, confirm?:boolean): Promise<{site:ReceivingSite; affectedTasks:DeliveryTask[]}>;
  setSiteDemand(id:string, d:{category:string; unit:string; demandQty:number}): Promise<ReceivingSite>;
  setSiteCapability(id:string, c:Capability, available:boolean): Promise<ReceivingSite>;
  listOpenGate(): Promise<OpenGateListing[]>;
  recordHandout(listingId:string, qty:number): Promise<OpenGateListing>;
  notifications(): Promise<Notification[]>;
  markRead(ids:string[]): Promise<void>;
  credits(): Promise<{totals:Record<'DONOR'|'VOLUNTEER'|'HELPER',number>; entries:LedgerEntry[]}>;
  leaderboard(type:'DONOR'|'VOLUNTEER'|'HELPER', period:'MONTH'|'EVENT'): Promise<{rank:number; displayName:string; score:number}[]>;
  sim: SimApi; // admin simulation, see §6.15
  audit(q?:any): Promise<any[]>;
}
```

`mockApi` must **implement the real rules** where cheap, so the demo behaves honestly: capacity check, demand check, capability compatibility, FEFO ordering, claim atomicity (single-threaded flag), claim TTL expiry via a `setInterval` worker, credit idempotency by `(eventType, subjectId, userId)`, and "expiry can never be extended". Later the backend becomes the authority; the mock simply goes away.

---

## 5. Seed Data (mock mode) — reproducible

Use fixed IDs and times relative to "now" so a reset gives the same demo.

| Entity | Seed |
|---|---|
| Users | `donor1` Wedding Host "Sharma Wedding Hall", `rider1..rider4` (capacity 40 meals each), `helper1`, `ngo1..3` operators, `admin1` |
| Item categories | COOKED_MEAL, RAW_RATION_KIT (CLEAN_WATER + COOKING_FUEL), COLD_CHAIN_FOOD (REFRIGERATION), PACKAGED_DRY_GOODS, INFANT_FORMULA (INFANT_CARE_PROCEDURE, helperAllowed=false) |
| Sites | A "Asha Shelter" demand 50 meals; B "Bright Future Camp" demand 80 meals; C "Care Home" demand 50 meals; D "Dry Relief Camp" has water+fuel for ration kits, no refrigeration. Coordinates around one city; distances produce ETA order A < B < C |
| Donation | 180 cooked meals, expiry now+3h, pickup at wedding hall |
| Helper | `helper1` opted in, capacity 20 |
| Reset | `Reset demo data` button (admin console) reloads this seed; also `localStorage` is **not** used for state |

---

## 6. Page Specifications

Each page lists: layout, content, interactions, states (loading / empty / error), mobile behaviour.

### 6.1 Landing (`/`)
- **Hero:** headline "Move surplus food and essentials before it expires." Sub: one sentence about coordination, capacity and safety. CTAs: "Donate surplus", "Volunteer to deliver", "Register your shelter" (go to `/register?role=…`).
- **How it works:** 4 steps with icons: Post → Match & split → Deliver → Verify. 
- **Live platform counters:** meals coordinated, deliveries verified, active shelters — computed from ledger/mock data and captioned "platform data (demo)". No invented real-world stats.
- **Safety note:** "LastMile Aid coordinates aid and does not certify food or medical supplies as safe."
- **Roles section:** 5 cards with 1-line value each.
- Loading: skeleton counters; error: hide counters.
- Mobile: stacked, sticky bottom CTA "Get started".

### 6.2 Register / Login
- Login: email, password, "Forgot password" (disabled in mock with tooltip), error banner on invalid credentials.
- Register: display name, email, password (strength hint), role choice (radio cards with description), helper opt-in checkbox with safety consent text, NGO shows "You will submit verification after sign-up".
- Validation inline (zod). Disable submit while pending. `429` shows "Too many attempts, try again in N s".
- Demo-mode quick-login chips: "Donor", "Rider", "Shelter", "Admin" (only when `VITE_DEMO_MODE`).

### 6.3 Donor dashboard (`/donor`)
- Top stats row: Active donations, Delivered quantity (verified), Credits, Pending exceptions.
- **Active donations list** (cards, sorted FEFO): title, qty, `UrgencyBadge`, `CountdownTimer`, status badge, progress bar (allocated / delivered / unallocated segments with text labels), "View".
- **Exception banner** at top if any donation is `EXCEPTION` or `NEEDS_ASSISTANCE` with the reason and actions: "Switch to Open Gate", "Contact an NGO".
- History table (status, date, qty, credits).
- Empty: "No donations yet" + CTA. Mobile: cards only.

### 6.4 Donation creation (`/donations/new`) and details (`/donations/:id`)
**Create form** (stepper on mobile, two-column on desktop):
1. Item: category select (shows required capabilities and handling notes live), description, quantity + unit.
2. Pickup: address text + Leaflet pin picker (click to set), available-from, **expiry/use-by** (datetime picker; min = now + 45 min; helper text "Expiry cannot be extended after posting").
3. Handling: instructions, extra required capabilities (can add, cannot remove category defaults—disabled chips).
4. Distribution: radio **Volunteer delivery** / **Open Gate**. A `ModeRecommendation` panel recommends a mode from rules (available riders nearby count, time left, quantity, cold-chain) and explains why in one sentence.
5. Review + submit.
- Errors: field-level messages; server `422` mapped to fields.
- On success: redirect to details with toast; matching starts.

**Details page:**
- Header: title, status badge, urgency badge, countdown, quantity summary.
- **Allocation table:** task, site, qty, rider (alias only), status badge, ETA badge. Expandable row "Why this assignment?" → reasons from `assignmentReason` (considered, rejections with codes in plain language).
- **Quantity bar:** segmented (verified / in progress / allocated / unallocated).
- **Timeline** of `DeliveryEvent`s.
- **Exception card** when `EXCEPTION`: reason, per-candidate rejection list, buttons "Switch to Open Gate", "Contact NGO", "Contact admin".
- Actions: Edit (only if no active tasks; expiry field only allows earlier), Cancel (confirm dialog).

### 6.5 Volunteer dashboard (`/rider`)
- **Availability card:** toggle available, capacity number + unit, cold-bag switch, radius slider (1–25 km), time window. Saves with explicit "Save" (shows saved timestamp). Changing capacity warns if it would conflict with an active task.
- **Active task card** (if any): destination, quantity, countdown to claim/pickup deadline, primary next-step button (Acknowledge / Confirm pickup / Confirm delivery), link to details.
- Credits summary and rank.
- Empty: "No active task — browse available tasks".
- Mobile: primary action pinned above bottom tabs.

### 6.6 Available-task board (`/tasks`)
- Toggle **List / Map**. Filters: category, max distance, urgency. Sort default FEFO (expiry asc).
- **TaskCard:** category + quantity, `UrgencyBadge` + `CountdownTimer` (to expiry), pickup distance, `EtaBadge`, destination name, compatibility chips (e.g. "Cold bag required"), **Claim** button.
- Claim button disabled with visible reason when ineligible (capacity too small, cold bag missing, outside radius, helper category forbidden).
- Click Claim → pending spinner → success shows "Claimed — acknowledge within MM:SS" and navigates to the task; `ALREADY_CLAIMED` shows inline "Someone else just claimed this" and removes the card (animation off if reduced-motion).
- Live updates: new tasks slide into list with an `aria-live` announcement; claimed tasks disappear.
- Empty: "No eligible tasks right now. We'll notify you." Error: retry.

### 6.7 Delivery detail (`/tasks/:id`)
- Stepper header: Claimed → Acknowledged → Picked up → In transit → Delivered → Verified (current highlighted, failed state in red).
- Panels: Pickup (address, handling instructions, contact revealed only after acknowledgement), Destination (site, capabilities check chips), Quantity, Deadlines (claim / pickup / expiry with countdowns).
- **Primary action** changes by status: `Acknowledge` → `Confirm pickup` (qty input prefilled, must be ≤ task qty) → `Confirm delivery`.
- **RerouteProposalCard** when `REROUTE_PROPOSED`: "Shelter A is now full. Suggested: Shelter B — 18 min (Estimated, mock). Arrives before deadline by 42 min." Buttons Accept / Decline; alternates listed. If none feasible: red card "No safe destination found" with next steps and admin contact. **Never auto-redirect.**
- Event timeline with UTC→local timestamps.
- Network failure: action buttons retry safely (idempotency key); show "Request pending…" state.

### 6.8 Live map (`/map`)
- Leaflet + OSM. Layers toggle: Donations, Sites, Active tasks (lines pickup→destination).
- Markers: donations use urgency icon + color + text label in popup; sites by status; legend component.
- Popups have key facts and a "View" link. Non-admin viewers see coarse locations for private pickups (rounded coordinates; label "approximate").
- Side list (desktop) / bottom sheet (mobile) mirrors markers for **keyboard and screen-reader access**.
- Tile failure: banner "Map tiles unavailable — showing list". Empty: overlay message.

### 6.9 NGO / shelter directory (`/ngos`, `/ngos/:id`)
- Search, filters (category, status, resources, distance), sort. Cards: name, verification badge, status, accepted categories chips, resource icons, "needs" summary.
- **Profile:** description, service area, current needs table (category, needed, remaining), resources, status, incoming deliveries (count + ETAs), contact instructions, history, buttons "Contact about direct collection" (opens modal → `contact request`), "Register donation intent".
- Unverified orgs show a clear "Not verified — not eligible for dispatch" badge.

### 6.10 Shelter operations dashboard (`/site/:id`)
- Big **status switch** (Open / Full / Closed). Changing to Full/Closed opens `ConfirmDialog` listing in-flight deliveries that will need rerouting.
- **DemandEditor:** table by category with demand, reserved, received, remaining; inline edit (cannot go below reserved + received — inline error).
- **CapabilityToggles:** water, fuel, refrigeration, infant care, dry storage. Toggle shows impact preview: "2 incoming deliveries need this capability."
- **Incoming deliveries:** cards with rider alias, qty, ETA, status; **Confirm receipt** form (quantity received, issue note) → verifies; shows credits awarded summary to the rider (no private data).
- Live: status/demand updates reflect immediately via events. Mobile: large toggles, sticky "Confirm receipt".

### 6.11 Open Gate listings (`/open-gate`)
- Active/Upcoming tabs. Card: venue, distance, remaining qty (progress bar with text), window countdown, instructions, "Directions" (opens external map URL), contact info after consent rules.
- Organizer view: "Record handout" with quantity stepper (cannot exceed remaining), "Close early" (confirm).
- Auto state: when remaining = 0 or window ends the card shows "Closed" and disables actions (driven by server time).
- Empty: "No active open-gate events."

### 6.12 Emergency helper (`/helper`)
- Opt-in panel with safety text: what helpers can/can't carry, handling tips, acknowledgement checkbox required before first accept.
- **Alert list:** one-time task offers with urgency, qty, ETA, bonus badge ("Emergency bonus ×1.5 after verified delivery"). Eligibility result shown with reasons (e.g. "Infant formula not available for public helpers").
- Accept → same flow as rider detail page but with simplified language and stronger safety checklist. Completion needs site verification.
- Empty: "No emergency alerts right now."

### 6.13 Credits and leaderboard (`/credits`)
- Tabs: Donor / Volunteer / Helper credits. Totals, ledger table (date, event, amount, multiplier, reference). Compensating entries are shown as "Adjustment".
- Leaderboard: monthly / event toggle, top three highlighted with a "Reward campaign" note (goodies/certificates, admin-approved). Display names only.
- Credits show as **pending** until site verification (clear explanation tooltip).

### 6.14 Notifications (`/notifications`)
- Grouped by day, filters (All / Unread / Urgent). Types: new eligible donation, urgent expiry, claim accepted/expired, pickup reminder, rider unresponsive, shelter demand change, reroute proposal, emergency assistance, delivery complete, credit awarded, Open Gate closing.
- Each item: icon, title, body, time (relative), deep link. "Mark all read". Bell shows unread count and a dropdown of 5 latest.
- Realtime toast for urgent types only (avoid noise). `aria-live="polite"`.

### 6.15 Admin simulation console (`/admin/console`)
Desktop-first, three columns: **Controls** | **Live board** | **Event log**.

| Panel | Controls |
|---|---|
| Scenario | Preset buttons: "Seed 180-meal demo", "Reset demo data" |
| Donation | Create donation with expiry in minutes (15/30/60/180), qty, category |
| Riders | Set rider capacity; mark rider unresponsive; **Zero volunteers** toggle |
| Sites | Set site Full/Closed; add direct donation (reduce demand); toggle resources (water/fuel/refrigeration) |
| Engine | "Run matching", "Run claim-expiry worker", "Run expiry sweeper" |
| Inspect | Task table with states, event log (filter by donation/task), reasons JSON viewer |

- Each action shows: spinner → result card (what changed, affected tasks, resulting states). Errors show server code.
- **Live board:** donations (urgency), tasks (state chips), sites (status) update in real time.
- Banner: "Simulation controls — demo only".
- Disabled for non-admin (redirect 403).

### 6.16 Audit and event log (`/admin/audit`)
- Table: time, actor kind (user/system/admin/simulation), action, entity, reason; expandable row shows before/after JSON diff.
- Filters: entity, actor, action, date range. Cursor pagination. "Export CSV".
- Empty: "No events match filters."

### 6.17 404 / 403 / error boundary
Friendly page with link back to dashboard; error boundary logs request id.

---

## 7. Error and Empty-State Mapping

| `error.code` | UI message |
|---|---|
| `ALREADY_CLAIMED` | "Someone else claimed this task." |
| `CAPACITY_EXCEEDED` | "This is more than your declared capacity." |
| `INCOMPATIBLE_SITE` | "This destination can't safely accept this item." |
| `ETA_EXCEEDS_DEADLINE` | "It can't arrive before the safe deadline." |
| `CLAIM_EXPIRED` | "Your claim expired and the task was returned." |
| `DEMAND_EXCEEDED` | "The shelter no longer needs this quantity." |
| `LISTING_CLOSED` / `SOLD_OUT` | "This collection window has closed." |
| `EXPIRY_EXTENSION_FORBIDDEN` | "Expiry can't be extended after posting." |
| `HELPER_CATEGORY_FORBIDDEN` | "This category is not available to public helpers." |
| `VALIDATION_ERROR` | Field-level messages |
| `RATE_LIMITED` | "Too many requests. Try again shortly." |
| network error | "You appear to be offline. Retrying…" |

---

## 8. Realtime Behaviour (mock now, Socket.IO later)

Subscribe through `useRealtimeEvent(eventName, handler)`. Events mirror the PRD: `donation.created`, `donation.updated`, `donation.urgency_changed`, `donation.exception`, `allocation.created`, `task.available`, `task.claimed`, `task.claim_expired`, `task.status_changed`, `task.rider_unresponsive`, `reroute.proposed`, `reroute.resolved`, `site.updated`, `assistance.requested`, `openGate.updated|closing|closed`, `credit.awarded`, `notification.new`, `time.sync`.

Rules: events **invalidate TanStack Query caches** (events are hints; fetched data is the truth). On reconnect refetch active queries. `time.sync` updates the clock offset used by all countdowns.

---

## 9. Accessibility and Responsiveness Checklist

- Keyboard reachable and visible focus ring on every control; dialogs trap focus and restore it.
- Labels for all inputs; error text linked via `aria-describedby`.
- Status never color-only; contrast ≥ 4.5:1; touch targets ≥ 44×44 px.
- Map has a list equivalent.
- `prefers-reduced-motion` disables transitions/shimmer.
- Tested at 360, 768, 1280 px widths. No horizontal page scroll; tables scroll inside containers or collapse into cards.

---

## 10. Performance and Quality Targets (design goals, not results)

- First contentful paint under ~2 s on a mid-range phone over fast 3G is the *goal*; measure with Lighthouse before claiming.
- Route-level code splitting (`React.lazy`) for Map and Admin pages.
- Lists virtualised only if > 100 items.

---

## 11. Build Order (frontend first)

| Step | Deliverable | Done when |
|---|---|---|
| 1 | Vite + Tailwind + shadcn setup, tokens, app shell, router, guards | Role-based nav works with mock login |
| 2 | `types.ts`, `Api` interface, `mockApi` with seed + rules, mock realtime | Console `api.listDonations()` returns seed |
| 3 | Common components (badges, countdown, states) | Storybook-style `/dev/components` page |
| 4 | Donor flows: dashboard, create, details | Create 180-meal donation shows allocations |
| 5 | Rider flows: dashboard, task board, task detail | Claim, ack, pickup, deliver, ghost-claim expiry works |
| 6 | Shelter dashboard + reroute card | Full shelter triggers proposal or "no safe destination" |
| 7 | Directory, Open Gate, helper, credits, notifications | Credits appear once after verification |
| 8 | Map | Markers, legend, list fallback |
| 9 | Admin console + audit | All simulations run against `mockApi` rules |
| 10 | Polish, a11y pass, Playwright demo script | 5–7 minute demo runs end to end |
| 11 | **Swap `mockApi` → `httpApi`** once the backend exists | Same screens pass against real API |

---

## 12. Ready-to-Paste Prompt for an AI Coding Agent

```
Build the LastMile Aid frontend exactly as specified in FRONTEND_UI_SPEC.md.
Stack: React 18 + TypeScript + Vite, Tailwind, shadcn/ui, React Router, TanStack Query, Zustand, React Hook Form + zod, Leaflet, Recharts.
Do steps 1–3 first (shell, types/Api/mockApi with seed and real business rules, common components), then pages in the order of section 11.
Rules: no backend required; all data via the Api interface; countdowns use the server-clock offset; status is never color-only; mock ETAs are labelled "Estimated (mock)"; no fake payments; expiry can never be extended; claims are atomic; credits are awarded once after site verification.
After each step, run type-check and tests, and summarise what works and what is not implemented.
```

---

## 13. Known Limitations (frontend phase)

- Mock mode is single-user in one browser tab; multi-user realtime needs the backend.
- Mock ETAs are deterministic estimates, not live routing.
- No real notifications beyond in-app; no payments.
