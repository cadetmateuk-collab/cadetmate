# Play Billing / IAP compliance plan

Before publishing CadetMate on Google Play (and later App Store) with **in-app digital goods** (Premium subscription, flashcard packs), store policies generally require using the platform billing system — not only Stripe Checkout in a WebView.

This doc is the compliance milestone from the mobile strategy. No Play Billing SDK is wired yet; Capacitor/Expo can keep using web Stripe for **internal / closed testing** only.

## What is at risk

| Product | Today (web) | Play production risk |
|---------|-------------|----------------------|
| Premium subscription | Stripe Pricing Table / Checkout | High — digital entitlement |
| Flashcard pack one-offs | Stripe Checkout + webhook ownership | High — digital content |
| Physical / offline goods | N/A | Low |

Google’s Payments policy: apps that sell digital content/services consumable in the app typically must use Google Play’s billing system. Opening an external browser to Stripe can still be scrutinized depending on how the purchase is framed.

## Recommended path

### Near term (now → closed testing)

1. Ship Capacitor / Expo builds as **internal testing** or **closed testing** tracks.
2. Keep Stripe Checkout for purchases initiated from the website or clearly “manage subscription on web” flows.
3. Do **not** submit a production listing that sells Premium/packs only via embedded Stripe WebView until billing is decided.

### Production Android (before public Play listing with IAP)

1. **Choose model**
   - **A. Play Billing primary:** Implement Google Play Billing Library (or `expo-in-app-purchases` / RevenueCat) for Premium + packs; grant entitlements via webhook/RTDN → same `profiles.role` / `flashcard_pack_ownership` tables.
   - **B. Reader / external account:** If eligible, use Play’s external offers / account linking programmes where users buy on the web; app only unlocks after login. Confirm eligibility with current Play policy counsel.
2. **Unify entitlements**
   - Single source of truth in Supabase (`profiles.role`, pack ownership).
   - Add `billing_provider` metadata (`stripe` | `play` | `app_store`).
   - Complete missing Stripe → `premium` role automation as part of the same epic.
3. **Server validation**
   - Verify Play purchase tokens server-side; never trust the client alone.
4. **Restore purchases** UX on Account screen.

### iOS (later)

- Apple IAP required for digital goods in-app.
- Prefer **RevenueCat** (or similar) to mediate Play + App Store + keep Stripe for web-only.

## Engineering checklist (when starting IAP)

- [ ] Product IDs in Play Console matching Premium + each paid pack (or subscription tiers)
- [ ] Backend endpoint to verify purchases and write Supabase entitlements
- [ ] Disable or gate Stripe Checkout buttons inside store-distributed builds (`Capacitor.getPlatform()` / Expo `Application`)
- [ ] Legal: Terms, privacy, subscription cancellation copy for stores
- [ ] QA: sandbox purchases, refund/revoke, account restore

## Decision owner

Product + engineering should pick **Play Billing vs external-offers** before the first **production** Play release that monetises. Until then, treat store builds as content/study clients and complete purchases on the website where possible.
