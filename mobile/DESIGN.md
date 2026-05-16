# Mobile app — design system

Single source of truth for color, typography, and component rules. Read this
before changing visuals.

## Why this exists

The foundation's brand color is **red** (heart imagery). That made it tempting
to use red everywhere in the UI. The problem with red-everywhere in a medical
app: users start reading red as "danger" by default, and the actually-dangerous
things (out-of-range INR, missed doses) lose their signaling.

So we split red into two roles and made **blue** the working primary.

## Color roles

Each color has exactly one job. Don't mix them.

### Brand red (`colors.red` — `#EC1A3B`)

**Identity moments only.** Used to say "this is the foundation."

- App icon
- Splash screen
- LoginScreen page title ("Wyjątkowe Serca")
- Marketing surfaces (about, support)

Do not use brand red as an accent for navigation, headers, or general UI chrome.

### Destructive red (same `colors.red`)

**"This removes or exits."** Same color, different role.

- Delete IconButtons (`delete-outline` icon → red)
- LogoutButton icon
- `Alert.alert` "destructive" button style (system-provided on iOS, we wire
  it on Android with `style: 'destructive'`)

Never use destructive red for actions a user *expects* to take routinely
(Save, Add, Calculate, Submit — those are primary).

### Primary blue (`colors.blue` — `#2383C5`)

**Everything the user is supposed to interact with.** This is the workhorse.

- All primary buttons (Save, Add, Calculate, Accept, Submit) — flows from
  Paper `theme.colors.primary`
- FABs
- Tab bar active tint
- TextInput focused outline (Paper default off `theme.colors.primary`)
- Switch active tint (when on)
- Header icon buttons that aren't destructive (e.g. account-plus on Profil)
- Pull-to-refresh tint
- EmptyState icon
- Chart line for Saturacja (we treat it as a "normal" health metric)
- Pomiary reminder Switch when on

**Not blue:** card titles and section headings. They're text labels, not
interactive things. Use `colors.grey1`. The "section" feel in `SectionCard`
comes from a thin neutral underline, not a colored heading. Mixing
blue-as-action with blue-as-heading made the design feel random.

### Status: success (`colors.successFg` / `colors.successBg`)

**Medical value is in range, course is complete.**

- Chip color when SaO₂ ≥ 95, tętno 60–100, ciśnienie normal, INR 2.0–3.5
- "Zakończony" pill on Leki harmonogram
- "Zapisane ✓" autosave indicator

### Status: warning (`colors.warningFg*` / `colors.warningBg*`)

**Borderline value, needs attention but not urgent.**

- Chips for borderline medical values
- INR interpretation bands "Dolna granica" / "Powyżej zakresu"
- The "Uwaga: masz już własne dane" notice on AcceptInvite (not danger,
  not destructive — just a heads-up before a non-reversible action)

### Status: danger (`colors.dangerFg` / `colors.dangerBg`)

**Out of range, urgent action needed.** Same hex as brand red — but used
through status tokens to carry the meaning.

- Chip color for low SaO₂, abnormal heart rate, hypertensive crisis, INR
  out of safe band
- INR card left border in the danger zone

### Status: info (`colors.infoFg` / `colors.infoBg`)

**Neutral information, no medical valence.**

- Diureza chip (it's a measurement we don't grade)
- Info banner background (INR explainer)
- Chart line for diureza

### Status: amber (`colors.amberFg` / `colors.amberBg`)

**Above-range value that needs attention but not as urgent as danger.**

- INR "Powyżej zakresu — skontaktuj się z lekarzem"

### Purple (`colors.purpleFg` / `colors.purpleFgAlt`)

**Ciśnienie tętnicze charts only.** Chosen because skurczowe + rozkurczowe
need to be visually distinct from each other and from other vitals on the
same screen. Two purple shades for the two pressure axes.

### Neutrals (`colors.grey1` / `grey2` / `grey3` / `greyBg` / `borderLight*`)

- `grey1` — body text, headings (non-section)
- `grey2` — secondary text, hints, captions
- `grey3` — disabled/placeholder
- `greyBg` — screen background
- `borderLight*` — dividers, card edges, skeleton blocks
- `cardBg` — `#fff` for cards

## Theme integration (Paper)

`paperTheme.colors.primary = colors.blue`. This is the lever that flips most
of Paper's defaults to blue without per-component overrides:

- `<Button mode="contained">` → blue background
- `<TextInput mode="outlined">` focused outline → blue
- `<Switch>` active tint → blue
- `<FAB>` → blue (unless `color` override)
- `<ActivityIndicator>` → blue
- `<Checkbox>` checked → blue

`paperTheme.colors.error = colors.dangerFg`. Validation/error states get red.

Components that need a different color (e.g. delete icon, brand title) opt
in via explicit prop. We don't sprinkle `buttonColor={colors.blue}` on
every save button — that's redundant once primary is blue.

## When in doubt

If you're adding a new UI element and asking "what color?":

1. Is it destructive (deletes / signs out)? → red, via the icon or button color
2. Is it about the foundation's identity? → red, on a static moment (title, logo)
3. Is it a medical value indicator? → status token (success/warning/danger/info)
4. Otherwise → blue or neutral

If you'd use a hex literal anywhere, stop and add a token to `theme/colors.ts`
first.
