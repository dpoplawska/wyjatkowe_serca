# Mobile app — future ideas

Things considered but not done now. Living list; weight against shipping needs before picking up.

## Maybe — UX polish

### Swipe-to-delete + long-press menus on lists
Replace the per-row trash icon on Leki / Pomiary / INR history with a swipe gesture (Android & iOS native pattern). Long-press could show a contextual menu (rename, duplicate, share). Library: `react-native-gesture-handler`'s `Swipeable`. Combined with the existing `Alert.alert` confirmation, this is the most native delete UX. Skipped now because the icon button + confirm already works.

### Larger fonts / accessibility audit
This app is built for kids with heart conditions and primarily their parents (mostly 25–45). The standard MD3 defaults are reasonable for that audience. Worth a one-off audit for: touch targets ≥ 48dp, contrast on chip / status colors, support for system font-size scaling. Not a primary concern for the target users.

## Settings screen (doesn't exist yet)

A future Settings tab would consolidate:

### Dark mode
Paper supports it out of the box if we provide a dark color set. `userInterfaceStyle: "automatic"` in `app.json` plus a `paperThemeDark` mirror. The color tokens in `theme/colors.ts` are already centralized, so the lift is mostly defining dark equivalents.

### Other potential settings
- Notification preferences (per-medication, default reminder lead time)
- Default chart range (currently hardcoded 3M)
- Language (PL only today)
- Account: sign-out (move from header), delete account, list of co-carers (currently no UI)

## Future — bigger investments

### PDF export of patient card
"Eksportuj kartę pacjenta" → PDF with current profile + last N measurements + last N INR results + active medications. Useful for doctor visits — many patients still bring printouts. Library: `expo-print` (HTML → PDF) + `expo-sharing` to email/print.

### Server-pushed notifications via FCM
Currently all notifications are scheduled locally on-device. Server-pushed would enable:
- Reminders that survive across devices (e.g. parent + child both notified)
- Doctor-initiated reminders ("Time for INR test")
- Marketing/announcements from the foundation

Cost: requires `@react-native-firebase/messaging` + backend FCM integration + token registration endpoint.

### Apple Sign-in
Required by App Store review when Google sign-in is offered. Not blocking until iOS submission, but worth wiring early so the iOS-first review goes smoothly.

### Native iOS testing path
Requires Apple Developer Program ($99/yr) for device testing, or a Mac for free-Apple-ID sideload. Currently Android-only by necessity.

### Translation / multilingual
Currently Polish-only. Could externalize strings to `i18n-js` or `react-intl` if foundation expands beyond Poland. Low priority.

### Onboarding flow
Multi-step welcome that walks new users through filling in the profile, optionally adding medications, etc. Currently first launch dumps the user into an empty form. Empty-state hints (just added) partially address this; a real onboarding flow would be more guided.
