#!/usr/bin/env bash
set -euo pipefail

WATCH_DIR="/var/www/email-core-data/md5offeroptout"
SCRIPT="/var/www/email-core/scripts/prepare_md5.sh"
LOG="/var/www/email-core/logs/md5scan.log"

mkdir -p "$(dirname "$LOG")"

echo "🔁 MD5 scanner running on: $WATCH_DIR" | tee -a "$LOG"

while true; do
  shopt -s nullglob

  # =========================
  # PROCESS NEW TXT FILES
  # =========================
  for FILE in "$WATCH_DIR"/*.txt; do
    [[ "$FILE" == *.sorted.txt ]] && continue
    [[ "$FILE" == *.cleaned.txt ]] && continue

    SORTED="${FILE%.txt}.sorted.txt"

    # Already processed → skip
    [[ -f "$SORTED" ]] && continue

    echo "📂 New MD5 file detected: $(basename "$FILE")" | tee -a "$LOG"

    if bash "$SCRIPT" "$FILE" >> "$LOG" 2>&1; then
      echo "✅ Prepared: $(basename "$SORTED")" | tee -a "$LOG"

      # 🔥 Delete original .txt after successful processing
      rm -f "$FILE"
      echo "🗑️ Deleted original: $(basename "$FILE")" | tee -a "$LOG"
    else
      echo "❌ Failed: $(basename "$FILE")" | tee -a "$LOG"
    fi
  done

  # =========================
  # DELETE OLD .sorted.txt (24+ hours)
  # =========================
  find "$WATCH_DIR" -type f -name "*.sorted.txt" -mmin +1440 -print -delete 2>/dev/null | while read OLD; do
    echo "🗑️ Auto-deleted (24h old): $(basename "$OLD")" | tee -a "$LOG"
  done

  sleep 5
done