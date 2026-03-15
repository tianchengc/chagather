#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

required_vars=(
  PROJECT_ID
  REGION
  SERVICE_NAME
  NEXT_PUBLIC_GEMINI_API_KEY
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}" >&2
    exit 1
  fi
done

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI is required. Install it from https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n 1)"
if [[ -z "${ACTIVE_ACCOUNT}" ]]; then
  echo "No active gcloud account found. Run: gcloud auth login" >&2
  exit 1
fi

echo "Using gcloud account: ${ACTIVE_ACCOUNT}"
echo "Enabling required Google Cloud services in project ${PROJECT_ID}..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project "${PROJECT_ID}"

echo "Deploying ${SERVICE_NAME} to Cloud Run in ${REGION}..."
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-build-env-vars "NEXT_PUBLIC_GEMINI_API_KEY=${NEXT_PUBLIC_GEMINI_API_KEY}"

SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format='value(status.url)')"

echo
echo "ChaGather is live on Cloud Run:"
echo "${SERVICE_URL}"
