Production website: https://wyjatkoweserca.pl/

## Testing the mobile app on a physical device (Android, via WSL)

The dev machine is WSL2; the phone (Pixel 8) plugs into Windows. App package:
`pl.wyjatkoweserca.pacjent` (React Native, sources in `mobile/`).

**Connection — usbipd-win + root adb server.**
- On Windows: `usbipd bind --busid <X>` (once), then `usbipd attach --wsl --busid <X>`
  (every reconnect/reboot). Enable **USB debugging** on the phone first — the USB product
  id must be `18d1:4ee7` (adb present), not `4ee1` (MTP only). After enabling debugging,
  re-attach so WSL re-enumerates.
- Attach keeps dropping (`vhci_hcd: connection reset by peer`) if **Phone Link /
  Android Studio** on Windows grabs the device, or on a USB-3 port. Fix: close Phone Link
  and use a **USB 2.0 port**.
- This WSL runs legacy `init` (no systemd → **no udevd**), so usbipd device nodes are
  root-only (`crw------- root root`). The adb *server* must run as root or `adb devices`
  is empty: `sudo adb kill-server; sudo adb start-server`. The client (`adb devices`,
  `adb install`, …) stays as your user. Re-run after each reboot/attach.
  (`ADB_SERVER_SOCKET` bridging to the Windows adb server does **not** work here —
  NAT networking can't route to the Windows LAN IP.)

**Build & install.**
- Debug APK: `mobile/build-android.sh` (auto-fetches `google-services.json` via gcloud;
  `CLEAN=0` to skip the clean, `RELEASE=1` for a release build).
- Install: `adb install -r mobile/android/app/build/outputs/apk/<variant>/app-<variant>.apk`.
- Launch: `adb shell monkey -p pl.wyjatkoweserca.pacjent 1` (or tap the icon).
- Long operations (a ~15 min local build) drop the usbip attach when the phone sleeps —
  enable Developer options → "Stay awake", and re-`usbipd attach` before installing.

**Driving the UI headlessly.**
- Screenshot: `adb exec-out screencap -p > shot.png` (use `exec-out`, not
  `shell screencap`, to avoid CRLF corruption).
- Precise taps: `adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml`
  gives element `bounds="[x1,y1][x2,y2]"` — tap the center. RN `EditText`s show their
  value as `text=`.
- Input: `adb shell input tap X Y` / `input text "25"` /
  `input keyevent KEYCODE_DEL|KEYCODE_MOVE_END|KEYCODE_BACK`. Fields that commit on blur:
  after typing, `KEYCODE_BACK` to close the keyboard, then tap another control to force
  the commit.
- App structure: Google sign-in on first launch (needs a real Google account on the
  device), then drawer/tab navigation between **Profil pacjenta / Leki / Pomiary / INR**,
  plus PDF export and account-sharing flows. Logcat: `adb logcat -d` (RN logs under
  `ReactNativeJS`).

**Screenshots for documents / store listings.**
- Log into a **demo account with fictional data only** — never screenshot a real
  patient profile (health data, RODO).
- `adb exec-out screencap -p > screen.png`, then crop/scale as needed; the PDF
  generator (`docs/generate_opis_aplikacji.py`) can embed them.
