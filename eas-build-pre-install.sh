#!/usr/bin/env bash
# EAS pre-install hook — copy google-services.json file secret into place.
# GOOGLE_SERVICES_JSON is set by EAS to the path of the uploaded file secret.
if [ -n "$GOOGLE_SERVICES_JSON" ] && [ -f "$GOOGLE_SERVICES_JSON" ]; then
  cp "$GOOGLE_SERVICES_JSON" ./google-services.json
  echo "[hook] google-services.json written from EAS file secret."
else
  echo "[hook] WARNING: GOOGLE_SERVICES_JSON secret not found — build may fail."
fi
