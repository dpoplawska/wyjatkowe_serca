// Adds a <queries> entry for application/pdf so Android 11+ can resolve
// our IntentLauncher.ACTION_VIEW call. Without this the intent fails
// silently on some OEMs (Samsung A34 in particular) instead of throwing,
// which means the share-sheet fallback never fires.
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withPdfQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest.queries) manifest.queries = [{}];
    const queries = manifest.queries[0];
    if (!queries.intent) queries.intent = [];

    const already = queries.intent.some((i) =>
      (i.data ?? []).some(
        (d) => d?.$?.['android:mimeType'] === 'application/pdf',
      ),
    );
    if (!already) {
      queries.intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        data: [{ $: { 'android:mimeType': 'application/pdf' } }],
      });
    }
    return cfg;
  });
};
