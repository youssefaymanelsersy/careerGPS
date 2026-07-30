#!/bin/sh
set -e

# Generate env.js
cat <<EOF >/usr/share/nginx/html/env.js
window.__ENV__ = {
  VITE_SERVER_URL: "${VITE_SERVER_URL}",
  VITE_VAPID_PUBLIC_KEY: "${VITE_VAPID_PUBLIC_KEY}"
};
EOF

# Pass control back to the CMD in the Dockerfile
exec "$@"
