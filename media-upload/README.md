# Media upload drop zone

Drop new media files here, then run `bash scripts/upload-media.sh` from the repo root to sync them to Firebase Storage.

## Structure

Mirror the Storage bucket layout:
- `beneficiaries/` — beneficiary photos
- `nerka/` — Medibelt/Ratujka product images
- `polaczeni_w_kryzysie/` — gallery images
- root — logos, PDFs, team photos

## After uploading

Add the new URL(s) to `frontend/app/src/app/mediaUrls.ts`.

## Notes

- Media files in this directory are gitignored — only this README is tracked.
- The script uses `gsutil rsync` (no `-d`), so it never deletes files from Storage.
