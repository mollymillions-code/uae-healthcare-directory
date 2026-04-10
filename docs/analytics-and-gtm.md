# Analytics & GTM — Mandatory Rules

**Read this before touching Google Tag Manager, the `gtag` shim, `dataLayer`, or any analytics script on zavis.ai.**

One mistake in this area took the homepage down for roughly half a day. This document exists so it does not happen again.

---

## TL;DR — The Hard Rules

1. **Never write a GTM Custom HTML tag whose body calls `gtag("event", X, ...)` with the same event name as its firing trigger.** This creates infinite recursion. See [§ The Anti-Pattern](#the-anti-pattern) below.
2. **Never add new event names to the `gtag-shim` inline script in `src/app/layout.tsx` without reading [§ The gtag Shim](#the-gtag-shim).** The shim has a recursion guard that drops four specific event names; it is load-bearing.
3. **Prefer native GA4 Event tags (`gaawe` type) over Custom HTML tags.** GA4 Event tags send directly to the GA4 endpoint and cannot feed back into `dataLayer`. Custom HTML tags are only acceptable when you need logic GTM cannot express declaratively.
4. **Never put a `setInterval`, `setTimeout` > 500ms, `requestAnimationFrame`, or `MutationObserver` inside a GTM Custom HTML tag without explicit review.** GTM tags run on every page; long-lived timers compound across navigations.
5. **When you add or delete GTM tags, you MUST publish the container version.** Deleting tags in the workspace is not the same as making them go away. The live container at `https://www.googletagmanager.com/gtm.js?id=GTM-T9N3FDMQ` only updates on publish.
6. **Test any GTM change on the live homepage for at least 60 seconds before walking away.** If `chrome://task-manager` shows the zavis.ai tab climbing past 100% CPU or 500 MB RAM, you broke something. Revert immediately.

---

## Incident 2026-04-10: Homepage crashed every browser tab

**Symptom.** Opening `https://www.zavis.ai/` caused the browser tab's renderer process to hit 334% CPU and 2.6 GB RAM within ~35 seconds of load, then freeze or crash. Reproduced on every platform, on fresh tabs, on any network condition.

**Root cause.** Four Custom HTML tags in GTM container `GTM-T9N3FDMQ` were wired into an infinite recursion loop with the inline `gtag` shim in `src/app/layout.tsx`:

| Tag ID | Name | Firing trigger (custom event) | Body (simplified) |
|---|---|---|---|
| 68 | GA4 Event - engaged_session | `engaged_session` | `gtag("event","engaged_session",{...})` |
| 71 | GA4 Event - scroll_milestone | `scroll_milestone` | `gtag("event","scroll_milestone",{...})` |
| 72 | GA4 Event - outbound_click | `outbound_click` | `gtag("event","outbound_click",{...})` |
| 73 | GA4 Event - contact_click | `contact_click` | `gtag("event","contact_click",{...})` |

The shim at the time was:

```js
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
window.gtag = gtag;
```

So `gtag("event","engaged_session",{...})` did `dataLayer.push(["event","engaged_session",{...}])`. GTM recognizes the gtag-shape array push and normalizes it back into a `{event: "engaged_session"}` dataLayer entry, which re-fires the `engaged_session` custom event trigger, which fires Tag 68 again, which calls `gtag(...)` again — forever.

**Detonator.** Tag 60 "HTML - Page Classification Data Layer Push" (fires on All Pages) contained:

```js
setTimeout(function(){
  window.dataLayer.push({event:"engaged_session", time_on_page_bucket:"30s+", ...});
}, 3E4);
```

Every page load, 30 seconds in, that `setTimeout` fired the first `engaged_session`, and the recursion started. Tags 71/72/73 only blew up on user scroll / outbound link click / contact click, but Tag 68 blew up on idle — on every page.

**Why dataLayer grew unboundedly.** Every gtag call appended a new entry to the `dataLayer` array. The array is never garbage collected because it is a global. Each recursion added to it, fast, forever → GB-scale memory growth in seconds.

**How it got missed.** Someone added the four Custom HTML tags to GTM at some point between 2026-04-05 and 2026-04-10 without realising the `gtag` shim would loop the event back into `dataLayer`. There is no test environment for GTM; changes go straight to production. Lint and type-check do not run inside GTM container JSON.

**Fix (two layers of defense).**

1. **Code-level recursion guard** in [src/app/layout.tsx](../src/app/layout.tsx). The `gtag-shim` now hard-drops `gtag("event", X, ...)` calls for the four poisoned event names. `gtag_report_conversion()` (event name `"conversion"`) and all other event names still pass through. See [§ The gtag Shim](#the-gtag-shim).
2. **GTM workspace deletion** of tags 68/71/72/73, published as a new container version.

---

## The Anti-Pattern

**Do not write this, ever.**

```html
<!-- GTM Custom HTML tag, firing trigger: "CE - my_event" -->
<script>
  gtag("event", "my_event", { some: "param" });  // ← BOOM
</script>
```

Why: `gtag` is the shim defined in `src/app/layout.tsx`. It calls `dataLayer.push(arguments)`. GTM normalizes that push back into `{event: "my_event"}`. The custom event trigger `CE - my_event` fires the tag again, which calls `gtag(...)` again, which pushes again, which fires the trigger again, which...

**The same anti-pattern in other forms:**

```html
<!-- Also infinite loop (via dataLayer directly) -->
<script>
  window.dataLayer.push({ event: "my_event", params: {...} });
</script>
```

```html
<!-- Also infinite loop (via a helper) -->
<script>
  trackEvent("my_event", {...});  // trackEvent in src/lib/gtag.ts pushes to dataLayer
</script>
```

If the tag's firing trigger is a custom event X, **the tag's body must not cause any new `{event: "X"}` dataLayer entry**, directly or indirectly.

---

## The Right Way to Track Events

### Option A (preferred): native GA4 Event tag

In GTM, use tag type **Google Analytics: GA4 Event** (`gaawe`), not Custom HTML. Configure:

- Measurement ID: your GA4 config variable
- Event Name: `my_event`
- Event Parameters: set via map

These tags post directly to `google-analytics.com`. They cannot re-enter `dataLayer` and cannot recurse. Tags 28–33 in the container are good examples.

### Option B: fire from application code, not GTM

If the event carries React state, user input, or anything else only the app knows, fire it from the app with the `trackEvent` helper:

```ts
// src/lib/gtag.ts
import { trackEvent } from "@/lib/gtag";

trackEvent("cta_click", { location: "hero", variant: "B" });
```

Then in GTM, create a **GA4 Event tag** (not HTML) that fires on a **Custom Event trigger** matching `cta_click`. The tag reads the parameters from Data Layer Variables. This is safe because the GA4 Event tag does not push anything back into `dataLayer`.

### Option C (rare): Custom HTML tag

Only when the GA4 Event tag type genuinely cannot express what you need. If you must use Custom HTML:

- **Do not call `gtag("event", X, ...)` if `X` is your firing trigger's event name.**
- **Do not call `dataLayer.push({event: X})` at all.**
- **Prefer `fetch`-ing directly to GA4 Measurement Protocol** over going through `gtag` / `dataLayer`. Example:
  ```js
  navigator.sendBeacon(
    "https://www.google-analytics.com/mp/collect?measurement_id=G-XXX&api_secret=YYY",
    JSON.stringify({ client_id: "...", events: [{ name: "X", params: {...} }] })
  );
  ```
- **Have someone review the tag before you publish it.**

---

## The gtag Shim

Defined inline in [src/app/layout.tsx](../src/app/layout.tsx) with `<Script id="gtag-shim" strategy="afterInteractive">`. Current form:

```js
window.dataLayer = window.dataLayer || [];
function gtag() {
  var a = arguments;
  if (a[0] === "event") {
    var n = a[1];
    if (n === "engaged_session"
     || n === "scroll_milestone"
     || n === "outbound_click"
     || n === "contact_click") return;
  }
  dataLayer.push(a);
}
window.gtag = gtag;
```

**Why it exists.** The shim lets `gtag_report_conversion()` in `src/lib/gtag.ts` push Google Ads conversion events into `dataLayer` for GTM to pick up. It is also used by any third-party snippet that calls `gtag(...)`.

**The recursion guard.** The four `if` names are a permanent denylist — they exist because of [Incident 2026-04-10](#incident-2026-04-10-homepage-crashed-every-browser-tab). **Do not remove them.** If you rename one of those events in GTM, update the shim at the same time.

**When to add more names to the guard.** If you (or a future agent) deliberately adds a GTM Custom HTML tag that fires on event `X` and somehow needs to call `gtag("event", X, ...)`, add `X` to the shim's denylist at the same time. Better: restructure to not need it (see [Option A/B](#the-right-way-to-track-events)).

**Do not change the shim's signature.** It must remain `function gtag(){ dataLayer.push(arguments); }` semantics for anything not in the denylist, or you will break `gtag_report_conversion()` (Google Ads) and Meta Pixel's internal calls.

---

## Current Analytics Surface

All initialized from [src/app/layout.tsx](../src/app/layout.tsx):

| Script | Strategy | Purpose | Known risk |
|---|---|---|---|
| Google Tag Manager (`GTM-T9N3FDMQ`) | afterInteractive | Loads GA4 + Google Ads + all event tags | Container HTML tags can recurse — see above |
| gtag-shim | afterInteractive | Lets `gtag_report_conversion()` work | Recursion guard is load-bearing |
| Microsoft Clarity | lazyOnload | Session recording | Fine in isolation |
| LinkedIn Insight | lazyOnload | B2B retargeting | Fine |
| Meta Pixel | afterInteractive | FB/Instagram ads | Initialized with PageView |
| Reb2b | lazyOnload | Visitor identification | Fine |
| Chatwoot (`crm.zavis.ai`) | Deferred 5s via `ChatwootWidget` | Customer chat | Fine; runs in iframe |

Route-change tracking lives in `src/components/analytics/RouteChangeTracker.tsx` and pushes `page_view` events on App Router navigation. That is safe because `page_view` has no recursive tag listening for it.

---

## How to Debug a Runaway Page (Playbook)

If the zavis.ai site is ever crashing browser tabs again, follow this playbook. It is how Incident 2026-04-10 was diagnosed in roughly 30 minutes.

1. **Confirm the runaway.** Open `https://www.zavis.ai/` in `agent-browser` (headless). Wait. Then watch the renderer process:
   ```bash
   ps aux | grep "agent-browser-chrome" | grep Renderer | grep -v grep
   ```
   CPU above 100% or memory climbing past 500 MB = runaway.
2. **Bisect third-party scripts** via `agent-browser network route '<url>' --abort`. Block half at a time. If blocking `**googletagmanager.com**` fixes it, the bug is in GTM.
3. **Inspect the live GTM container directly.** It is served publicly:
   ```bash
   curl -s "https://www.googletagmanager.com/gtm.js?id=GTM-T9N3FDMQ" > /tmp/gtm.js
   ```
   All Custom HTML tag bodies are embedded as `"vtp_html"` strings. Search for `setInterval`, `requestAnimationFrame`, `MutationObserver`, and any `gtag("event"` / `dataLayer.push` call that could recurse.
4. **Use the MCP tools.** `mcp__zavis-ads-analytics__gtm_list_tags` and `gtm_list_triggers` give you a structured view. `gtm_delete_tag` can remove a tag from the workspace (publishing still requires a dashboard action or wider OAuth scope).
5. **Deploy the fix.** Two layers:
   - Code-level guard in `src/app/layout.tsx` if the bug is in the shim. Commit, push to `live`, let the EC2 blue-green deploy swap.
   - GTM workspace deletes + **publish** from the dashboard at tagmanager.google.com → Workspace → Submit.
6. **Verify against the live site.** Re-open in `agent-browser`, watch the renderer process for at least 60 seconds through the t=30s mark. CPU and memory must stay flat.

---

## Related Files

- [src/app/layout.tsx](../src/app/layout.tsx) — inline `<Script>` tags including the gtag-shim
- [src/lib/gtag.ts](../src/lib/gtag.ts) — `trackEvent`, `gtag_report_conversion`, Meta/LinkedIn/Twitter helpers
- [src/components/analytics/RouteChangeTracker.tsx](../src/components/analytics/RouteChangeTracker.tsx) — App Router page_view events
- [zavis-gtm-import.json](../zavis-gtm-import.json) — historical GTM import template (not authoritative; the live container is)
