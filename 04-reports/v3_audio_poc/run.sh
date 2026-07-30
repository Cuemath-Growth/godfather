#!/usr/bin/env bash
# v3 audio-layer POC trigger.
# Pulls queued ad_names from poc_v3_audio_results and POSTs them in batches
# to the Cloudflare Pages Function /api/v3-rebuild-poc.
#
# Prereqs (Naina runs once before this):
#   1. Commit + push functions/api/v3-rebuild-poc.js (triggers CF Pages deploy)
#   2. Add OPENAI_API_KEY to Cloudflare Pages env vars (Dashboard > Pages > godfather > Settings > Env vars)
#   3. Trigger a redeploy (or wait for the auto-deploy from step 1)
#
# Usage: bash run.sh
# Logs:  ./batch_NN.json (one file per batch), ./progress.log

set -euo pipefail

ENDPOINT="https://godfather-4t4.pages.dev/api/v3-rebuild-poc"
SUPA_URL="https://lcixlyyzlnzeiqjdbxfh.supabase.co"
SUPA_KEY="sb_publishable_3vFEM4zGI7Rx9z7H4cLmhw_xt6nkw4u"
BATCH=3

cd "$(dirname "$0")"
: > progress.log

echo "[$(date +%H:%M:%S)] Fetching queued POC ads from Supabase..." | tee -a progress.log
QUEUED=$(curl -sS \
  -H "apikey: $SUPA_KEY" \
  -H "Authorization: Bearer $SUPA_KEY" \
  "$SUPA_URL/rest/v1/poc_v3_audio_results?status=eq.queued&select=ad_name,market,spend_inr&order=spend_inr.desc")

COUNT=$(echo "$QUEUED" | jq 'length')
echo "[$(date +%H:%M:%S)] Got $COUNT queued ads. Batching $BATCH per call." | tee -a progress.log

if [[ "$COUNT" == "0" ]]; then
  echo "Nothing queued. Exiting."
  exit 0
fi

# Health check: confirm endpoint is alive and env vars are set
echo "[$(date +%H:%M:%S)] Health checking $ENDPOINT ..." | tee -a progress.log
HEALTH=$(curl -sS -X POST "$ENDPOINT" -H "Content-Type: application/json" -d '{}' || echo "{}")
if echo "$HEALTH" | jq -e '.missing' > /dev/null 2>&1; then
  echo "ENV CHECK FAILED. Missing vars:" | tee -a progress.log
  echo "$HEALTH" | jq '.missing' | tee -a progress.log
  echo ""
  echo "Add the missing vars to Cloudflare Pages > Settings > Environment Variables, redeploy, then re-run." | tee -a progress.log
  exit 1
fi
echo "[$(date +%H:%M:%S)] Endpoint reachable. Env vars look set." | tee -a progress.log

# Iterate batches
i=0
N=0
while [ "$i" -lt "$COUNT" ]; do
  N=$((N + 1))
  AD_NAMES=$(echo "$QUEUED" | jq --argjson i "$i" --argjson b "$BATCH" '[.[$i:$i+$b][].ad_name]')
  MARKET=$(echo "$QUEUED" | jq -r --argjson i "$i" '.[$i].market')
  SPEND=$(echo "$QUEUED" | jq -r --argjson i "$i" '.[$i].spend_inr')

  PAYLOAD=$(jq -n --argjson n "$AD_NAMES" --arg m "$MARKET" --argjson s "$SPEND" '{ad_names:$n,market:$m,spend:$s}')

  echo "[$(date +%H:%M:%S)] Batch $N ($i+$BATCH of $COUNT) market=$MARKET" | tee -a progress.log
  RESP=$(curl -sS -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    --max-time 90)
  echo "$RESP" > "batch_${N}.json"
  OK=$(echo "$RESP" | jq -r '.ok // 0')
  STAT=$(echo "$RESP" | jq -r '.static // 0')
  ERR=$(echo "$RESP" | jq -r '[.results[]? | select(.status != "ok" and .status != "static_no_audio") | .status] | length // 0')
  echo "[$(date +%H:%M:%S)]   -> ok=$OK static=$STAT err=$ERR" | tee -a progress.log

  i=$((i + BATCH))
done

echo "" | tee -a progress.log
echo "[$(date +%H:%M:%S)] All batches complete. Summary from Supabase:" | tee -a progress.log
curl -sS \
  -H "apikey: $SUPA_KEY" \
  -H "Authorization: Bearer $SUPA_KEY" \
  "$SUPA_URL/rest/v1/poc_v3_audio_results?select=status&order=status" | \
  jq -r 'group_by(.status) | map("  \(.[0].status): \(length)") | .[]' | tee -a progress.log

echo "" | tee -a progress.log
echo "Next: Claude will pull poc_v3_audio_results, compute mismatch %, and write the report." | tee -a progress.log
