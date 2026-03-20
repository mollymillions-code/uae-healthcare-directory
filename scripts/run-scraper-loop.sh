#!/bin/bash
# Runs the scraper in a loop, restarting on crash with a cooldown.
# Progress is saved to google_enrichment.json after each entry.

START_IDX=${1:-646}
BATCH_SIZE=${2:-2854}
COOLDOWN=${3:-30}  # seconds between restarts

echo "Starting scraper loop: startIdx=$START_IDX batchSize=$BATCH_SIZE cooldown=${COOLDOWN}s"
echo "Press Ctrl+C to stop."

attempt=0
while true; do
  attempt=$((attempt + 1))
  echo ""
  echo "--- Attempt $attempt at $(date '+%H:%M:%S') ---"
  node scripts/scrape-gmaps-playwright.js "$START_IDX" "$BATCH_SIZE"
  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    echo "Scraper finished successfully!"
    break
  fi

  echo "Scraper exited with code $EXIT_CODE. Cooling down for ${COOLDOWN}s..."
  sleep "$COOLDOWN"
done
