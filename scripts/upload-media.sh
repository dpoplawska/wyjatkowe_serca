#!/usr/bin/env bash
set -e
source frontend/app/.env
echo "Syncing to gs://$REACT_APP_FIREBASE_STORAGE_BUCKET/"
gsutil -m rsync -r media-upload/ gs://$REACT_APP_FIREBASE_STORAGE_BUCKET/
gsutil -m acl ch -r -u AllUsers:R gs://$REACT_APP_FIREBASE_STORAGE_BUCKET/**
echo "Done."
