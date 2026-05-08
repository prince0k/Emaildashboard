#!/usr/bin/env bash
set -euo pipefail

INPUT="$1"

# Only handle real .txt files
[[ "$INPUT" != *.txt ]] && exit 0

# HARD BLOCK: never reprocess generated files
case "$INPUT" in
  *.cleaned.txt|*.sorted.txt)
    echo "⏭️  Skipping generated file: $INPUT"
    exit 0
    ;;
esac

DIR="$(dirname "$INPUT")"
BASE="$(basename "$INPUT" .txt)"

CLEAN="$DIR/$BASE.cleaned.txt"
SORTED="$DIR/$BASE.sorted.txt"

# Already prepared → exit
[[ -f "$SORTED" ]] && exit 0

echo "🔹 Preparing MD5: $INPUT"

# Wait until file is stable (copy finished)
PREV_SIZE=0
while true; do
  CUR_SIZE=$(stat -c%s "$INPUT" 2>/dev/null || echo 0)
  [[ "$CUR_SIZE" -eq "$PREV_SIZE" ]] && break
  PREV_SIZE="$CUR_SIZE"
  sleep 1
done

# Normalize CRLF → LF, lowercase, strict MD5 validation
sed 's/\r$//' "$INPUT" \
| tr 'A-Z' 'a-z' \
| grep -E '^[a-f0-9]{32}$' \
> "$CLEAN"

# Sort (disk-safe)
LC_ALL=C sort "$CLEAN" > "$SORTED"

# Cleanup intermediate ONLY
rm -f "$CLEAN"

echo "✅ DONE: $SORTED"
