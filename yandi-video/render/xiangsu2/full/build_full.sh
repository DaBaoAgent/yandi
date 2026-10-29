#!/usr/bin/env bash
# xiangsu2 full · 一键构建全片 1920×1080（像素密度 640×360，272.05 s / 58 镜 / 195 条字幕）
#
#   bash build_full.sh              # 拼装 film.js + 重做音轨 + 渲染 + 验收
#   bash build_full.sh --no-audio   # 复用 full/out/audio.wav，只重渲画面
#   bash build_full.sh --no-render  # 只拼装 + 音轨 + 验收（复用已有视频）
#
# 环境变量（都有默认值）：
#   XIANGSU2_REPO  渲染仓库（harness 所在，必须是 mg-styles-15 克隆）
#   XIANGSU2_PROJ  项目目录（成片落盘位置）
#   MG_CHROME      Chrome 可执行文件
#   XIANGSU_WORKERS 并行渲染进程数（默认 4）
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="${XIANGSU2_REPO:-D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15}"
PROJ="${XIANGSU2_PROJ:-D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音}"
CHROME="${MG_CHROME:-C:/Program Files/Google/Chrome/Application/chrome.exe}"
DEMO="$REPO/demos/xiangsu2-eden-full"
OUT="$PROJ/全片_波斯湾伊甸园_272秒_1920x1080.mp4"
DUR=272.05

mkdir -p "$DEMO/out" "$PROJ" "$HERE/out"

# 1) 拼装 film.js：demo/film.js 前半段 + full/parts/*.js
node "$HERE/assemble.mjs"

# 2) 音轨（272 s chiptune + SFX + 配音 → 两遍 loudnorm）
if [ "${1:-}" != "--no-audio" ]; then
  bash "$HERE/make_audio.sh"
fi
[ -f "$HERE/out/audio.wav" ] || { echo "缺少 $HERE/out/audio.wav，先跑 bash make_audio.sh"; exit 1; }
cp "$HERE/out/audio.wav" "$DEMO/out/audio.wav"

# 3) 渲染：1920×1080 @30fps，CRF 14，界面与 10 s 样片同一管线
if [ "${1:-}" != "--no-render" ]; then
  (cd "$REPO" && MG_CHROME="$CHROME" node harness/render.mjs demos/xiangsu2-eden-full \
    --w 1920 --h 1080 --fps 30 --duration "$DUR" --crf 14 --workers "${XIANGSU_WORKERS:-4}" \
    --out "$DEMO/out/video_full.mp4")
fi
[ -f "$DEMO/out/video_full.mp4" ] || { echo "缺少 $DEMO/out/video_full.mp4，先跑完整渲染"; exit 1; }
cp "$DEMO/out/video_full.mp4" "$OUT"

# 4) 验收
node "$HERE/verify_full.mjs" "$OUT"
