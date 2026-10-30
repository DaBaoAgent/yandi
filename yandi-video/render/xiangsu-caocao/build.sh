#!/usr/bin/env bash
# xiangsu-caocao · 一键构建（1920×1080，栅格 640×360）
#
#   bash build.sh                # 30 秒样片：重做音轨 + 渲染 + 验收
#   bash build.sh --no-audio     # 复用已生成的 audio.wav
#   bash build.sh full           # 全片 187 s（demos/caocao-full）
#   bash build.sh full --no-audio
#
# 环境变量：
#   XIANGSU_REPO  渲染仓库（harness 所在）默认 output/020_曹操/render/mg-styles-15
#   XIANGSU_PROJ  成片落盘目录（默认 out/5 曹操）
#   XIANGSU_VOICE 旁白 wav 路径
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="${XIANGSU_REPO:-D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15}"
PROJ="${XIANGSU_PROJ:-D:/@kaifa/yandi/out/5 曹操}"
CHROME="${MG_CHROME:-C:/Program Files/Google/Chrome/Application/chrome.exe}"
CRF="${XIANGSU_CRF:-14}"

MODE=sample
NO_AUDIO=0
for a in "$@"; do
  case "$a" in
    full) MODE=full ;;
    --no-audio) NO_AUDIO=1 ;;
    *) echo "未知参数: $a"; exit 2 ;;
  esac
done

if [ "$MODE" = full ]; then
  DEMO="$REPO/demos/caocao-full"
  INDEX_SRC="$HERE/demo/index-full.html"
  CUES_SRC="$HERE/demo/cues-full.json"
  DUR=187
  OUT="$PROJ/源文件/xiangsu曹操_全片_1920x1080.mp4"
else
  DEMO="$REPO/demos/caocao-sample"
  INDEX_SRC="$HERE/demo/index.html"
  CUES_SRC="$HERE/demo/cues.json"
  DUR=29.4
  OUT="$PROJ/源文件/样片_前30秒_xiangsu_1920x1080.mp4"
fi

[ -f "$INDEX_SRC" ] || { echo "缺少 $INDEX_SRC"; exit 1; }
[ -f "$CUES_SRC" ] || { echo "缺少 $CUES_SRC"; exit 1; }

# 1) 拼装内容层：parts/*.js → demo/film.js（与 xiangsu 全片同一做法）
PARTS=(00-engine.js 10-helpers.js 20-scenes.js)
[ "$MODE" = full ] && PARTS+=(40-scenes-full.js)
PARTS+=(90-tail.js)
mkdir -p "$HERE/tmp"
: > "$HERE/demo/film.js"
for p in "${PARTS[@]}"; do cat "$HERE/parts/$p" >> "$HERE/demo/film.js"; done
cp "$HERE/demo/film.js" "$HERE/tmp/_film_check.mjs"
node --check "$HERE/tmp/_film_check.mjs" || { echo "film.js 语法错误"; exit 1; }
rm -f "$HERE/tmp/_film_check.mjs"

mkdir -p "$DEMO/out" "$PROJ/源文件"
cp "$INDEX_SRC" "$DEMO/index.html"
cp "$CUES_SRC" "$DEMO/cues.json"
cp "$HERE/demo/film.js" "$HERE/demo/sprites.js" "$HERE/demo/audio.py" "$HERE/demo/audio_full.py" "$DEMO/"

if [ "$NO_AUDIO" = 0 ]; then
  bash "$HERE/make_audio.sh" "$DEMO" "$MODE"
fi
[ -f "$DEMO/out/audio.wav" ] || { echo "缺少 $DEMO/out/audio.wav，先跑 bash make_audio.sh"; exit 1; }

(cd "$REPO" && MG_CHROME="$CHROME" MG_GPU_ARGS="--use-angle=d3d11 --no-sandbox" \
  node harness/render.mjs "demos/$(basename "$DEMO")" \
  --w 1920 --h 1080 --fps 30 --duration "$DUR" \
  --audio "demos/$(basename "$DEMO")/out/audio.wav" --crf "$CRF" --out "$OUT")

node "$HERE/verify.mjs" "$OUT" "$DUR"
