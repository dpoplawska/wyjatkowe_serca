# Backup Strategy

Firestore native scheduled backups — managed by GCP, no custom infrastructure required.

## Setup (one-time)

```bash
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=14d \
  --project=wyjatkowe-serca
```

This creates a daily backup with 14-day retention. Run once; GCP handles everything after that.

## Check schedule

```bash
gcloud firestore backups schedules list \
  --database='(default)' \
  --project=wyjatkowe-serca
```

## List available backups

```bash
gcloud firestore backups list \
  --project=wyjatkowe-serca
```

## Restore from backup

1. Find the backup ID from the list above (format: `projects/wyjatkowe-serca/locations/europe-central2/backups/<ID>`)
2. Run:

```bash
gcloud firestore databases restore \
  --source-backup='projects/wyjatkowe-serca/locations/europe-central2/backups/<BACKUP_ID>' \
  --destination-database='(default)' \
  --project=wyjatkowe-serca
```

> **Warning:** Restoring overwrites the destination database. Make sure to use the correct backup ID and destination.

## Cost

Backup storage is billed at ~$0.10/GB/month. For this app's data size, cost is negligible (< $0.01/month).
