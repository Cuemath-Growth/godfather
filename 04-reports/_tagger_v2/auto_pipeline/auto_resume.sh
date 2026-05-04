#!/bin/bash
# Polls Meta rate limit until clear, then builds caches and runs a 10-ad test.
set -u
LOG=/tmp/vision_tagger/auto_resume.log
exec >"$LOG" 2>&1

ACCOUNTS=(act_5215842511824318 act_888586384639855 act_925205080936963)

probe() {
  local acct="$1"
  curl -sS -X POST https://godfather-4t4.pages.dev/api/proxy-meta \
    -H "Content-Type: application/json" \
    -d "{\"endpoint\":\"$acct/ads\",\"params\":{\"fields\":\"name\",\"limit\":\"1\"}}" \
    | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('error'):
  msg = d['error'].get('message','')
  print('RATE_LIMITED' if 'too many calls' in msg.lower() else f'ERR: {msg[:120]}')
  sys.exit(2)
print('OK')
"
}

echo "[$(date)] starting auto-resume polling"
TRIES=0
while : ; do
  TRIES=$((TRIES+1))
  ALL_OK=1
  for a in "${ACCOUNTS[@]}"; do
    R=$(probe "$a") || ALL_OK=0
    echo "[$(date)] try=$TRIES acct=$a -> $R"
  done
  if [ $ALL_OK -eq 1 ]; then
    echo "[$(date)] all accounts clear, proceeding"
    break
  fi
  echo "[$(date)] still rate-limited, sleeping 240s"
  sleep 240
  if [ $TRIES -gt 30 ]; then
    echo "[$(date)] giving up after 30 tries (~2hrs)"
    exit 1
  fi
done

echo "[$(date)] === BUILDING NAME->ID CACHE PER ACCOUNT ==="
cd /tmp/vision_tagger
python3 - <<'PY'
import sys, json, time
sys.path.insert(0, '/tmp/vision_tagger')
from vision_tagger import load_or_build_name_to_id
for acct in ('act_5215842511824318', 'act_888586384639855', 'act_925205080936963'):
    print(f'cache for {acct} ...', flush=True)
    m = load_or_build_name_to_id(acct, force=True)
    print(f'  {len(m)} ads cached', flush=True)
PY

echo "[$(date)] === RUNNING 10-AD TEST (5 STATIC + 5 VIDEO) ==="
echo "-- 5 statics --"
python3 vision_tagger.py --no-write --limit 5 --creative-type Static
echo
echo "-- 5 videos --"
python3 vision_tagger.py --no-write --limit 5 --creative-type Video

echo "[$(date)] auto-resume done."
