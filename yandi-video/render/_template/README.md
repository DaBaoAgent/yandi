# 新一集开工模板指南

下一集（第5集）按这个流程走，不要重新搭管线。

## 开工步骤

```bash
# 1. 复制周幽王目录作为骨架
cd D:\@kaifa\yandi\yandi-video\render
Copy-Item -Recurse zhouwang <新人物名>

# 2. 改名关键文件
#    page_full_zhouwang.html  → page_full_<人物名>.html
#    capture_full_zhouwang.js → capture_full_<人物名>.js
#    make_sfx_full_zhouwang.js → make_sfx_full_<人物名>.js
#    gen_full_zhouwang.js → gen_full_<人物名>.js
```

## 必须改的地方

| 文件 | 改什么 |
|---|---|
| `page_full_<人物>.html` | ① ASSETS 里的素材路径换成新人物素材目录；② 场景函数里的人物 key（baosi/king/rong...）换成新人物；③ 主题色 COL（金红/蓝绿/...）；④ script src 换成新 sb.js |
| `gen_full_<人物>.js` | ① subs 数组换成新口播稿的字幕（时间戳用 whisper 转写）；② scenes 数组换成新叙事段；③ events 音效点 |
| `capture_full_<人物>.js` | OUT 目录、SB json 路径、page html 文件名 |
| `make_sfx_full_<人物>.js` | 配音 wav 路径、输出 mix 文件名 |

## 字幕对齐流程（不要跳）

```bash
# 1. faster-whisper 词级转写配音
D:\@kaifa\yandi\vendor\gpt-sovits\.venv\Scripts\python.exe `
  D:\@kaifa\yandi\tools\transcribe_faster.py `
  -a "D:\@kaifa\yandi\output\<新人物>\配音.wav" `
  -o "D:\@kaifa\yandi\yandi-video\render\<人物>\transcript_full.json" `
  --initial-prompt "关键人名地名关键词"

# 2. 对照口播稿逐句校准 subs 时间戳（在 gen_full.js 里手写）
# 3. 跑 _tighten.js 收紧场景边界到字幕首尾
```

## 样片先行（不要直接跑全片）

1. 先截前20.5秒配音 → 捕获615帧 → 出样片 mp4
2. 用户验收：人物比例 / 字幕对齐 / 背景风格
3. 验收通过再跑全片（约5400帧/4.5分钟）

## 验收前检查清单（踩过的坑）

- [ ] 人物立绘是等比绘制（不压扁）
- [ ] 字幕时间戳来自 whisper 原生（不是手填）
- [ ] 场景边界收紧到字幕首尾
- [ ] 背景是 bg10 群峰叠嶂（不是代码画黑块）
- [ ] 转场温和（没有全屏色块扫屏/高频闪白）
- [ ] eob(0) 有 `if(t<=0)return 0`
- [ ] 所有场景 type 都注册到渲染页分发链
- [ ] 中文路径 file:// 已 encodeURIComponent
- [ ] ffmpeg 多输入显式 -map

## 成片归档

```
D:\@kaifa\yandi\out\<序号> <人物名>\
├── <人物名>_全片.mp4
├── cover_3x4.png
├── cover_4x3.png
├── 发布信息.txt
└── 源文件/
```

已发项目移入 `out/@已发/`。
