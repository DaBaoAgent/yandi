# 项目长期记忆（yandi）

> **权威规格文档（2026-10-25 两集定版固化，任何一集开工前先读）**
> - 技能：`.workbuddy/skills/yandi-video-spec/SKILL.md` — **两集定版规范**（12 章：成片参数两集实例/密度三指标/手机可读/构图/字幕/音频/**2.6 段落停顿**/**2.7 四查门禁**/**2.8 音画同步**/背景+运镜/封面 ImageGen 口径/发布信息/双线生产流程/BGM 七步/交付契约/**16 条避坑**/脚本清单/开工清单/终版自检命令）
> - 文档：`yandi-video/README.md` — 系列级说明书（两集成片参数、段落结构、复现步骤、双管线目录、坑）
> 二者与下述记忆冲突时，以技能文件为准。
>
> **两集定版状态**：女娲 427.2s（`render/nuwa/`，-16.0 LUFS，145.9MB）｜炎帝 385.5s（`render/yandi/`，98 镜/163 音效/-16.1 LUFS，164.5MB，五轮整改后四查全过）｜帝辛待开工
> **交付硬门禁**：密度三指标 + 四查（`audit_yandi.js`：类型覆盖/字幕区越界/空渲染/坏文本）+ 响度复测，缺一不可交付

## 素材源目录：全部迁入 `D:/@kaifa/yandi/output/`（2026-10-25 用户迁移，重要）

三集的初始素材（口播稿 / 配音 / 角色图 / 背景图 / 素材包）已从项目根目录搬到 `output/` 下，**旧路径 `D:/@kaifa/yandi/006_女娲`、`007_炎帝`、`008_帝辛` 已不存在**，任何读写素材一律走新路径：

| 集 | 新路径 | 顶层内容 |
|---|---|---|
| 女娲 | `D:/@kaifa/yandi/output/006_女娲/` | `口播稿.md`、`配音.json`、`配音.wav`、`narration-chunks/`、`nuwa_front/side/back.png`、`女娲故事常用素材_透明PNG_v1/`、`背景图_v1/`、`封面生成_v1/` |
| 炎帝 | `D:/@kaifa/yandi/output/007_炎帝/` | `口播稿.md`、`配音.json`、`配音.wav`、`narration-chunks/`、`素材_像素Q版_v1/`、`素材_精致逼真_v1/`、`封面生成_v2/` |
| 帝辛 | `D:/@kaifa/yandi/output/008_帝辛/` | 仅 `口播稿.md`（配音未合成，待开工） |

- `output/` 是**素材源目录**，与成片交付目录 `yandi-video/out/` 是两套不同目录，不要混用
- **路径已全量修正（2026-10-25 19:50 执行完）**：`yandi-video/render/` 下 18 个脚本 30 处硬编码、3 个规范文档 16 处引用，全部改为 `output/00X_…` 前缀；JS 语法全过、13 条引用路径全存在、配音轨时长与 json duration 逐帧对齐（女娲 427.211066s / 炎帝 385.468481s）
- 回滚备份：`.workbuddy/backup/render_pathfix_20261025_1948/`（**已瘦身 4.2MB / 77 文件**：42 js + 18 json + 11 html + 6 txt，均为改前旧路径版本；wav/mp4/jpg 副本已删，因原件在 `render/` 完好且与本次改动无关）+ `.workbuddy/backup/{README.md,女娲_成片规则_v1.md,SKILL.md}.bak`
- `yandi-video/out/` 下历史核验报告仍保留旧路径字样（历史存档，不改）

## 克隆配音模块（2026-10-25 从 tushuo 复制落地）

- 入口 `tools/tts.cmd`（调 `vendor/gpt-sovits/.venv` + `tools/dabao_batch_tts.py` → 127.0.0.1:9880 服务）；转写用 `tools/transcribe_dabao.cmd`（faster-whisper-small）；读音修正按 `docs/读音规范.md` 进 dabao_batch_tts.py 的 SPEAK_FIXES
- 音色定稿 dabao 26E（LOCKED：cut1/speed1.0/rp1.35/temp0.80/top_p0.95/top_k15/seed666，≤78字/段）；服务 9880 全局单例与 tushuo 共用；写完口播稿先给用户审，再合成配音

## 产物交付规范（用户 2026-10-25 确认，必须遵守）

所有视频项目产出的文件统一放到：

```
D:/@kaifa/yandi/yandi-video/out/<序号> <标题>/
```

目录内**顶层只允许 4 项**（用户 2026-10-25 二次确认）：
- `<名称>_全片.mp4` — 成片（1920×1080 / 30fps / H.264 CRF19 / AAC 192k，含 BGM）
- `cover_4x3.png` — 1440×1080 封面
- `cover_3x4.png` — 1080×1440 封面
- `发布信息.txt` — 【标题备选·5选1】5 条编号标题 + 推荐/次选 + 【话题】1 行 4 个标签
- `源文件/` — 其余全部（样片、核验报告、标题详版等）必须移入此子目录，不得散在顶层

序号从 1 递增，标题用中文项目名（如 `1 炎帝`）。不要再把成片散放在 out/ 根目录。

## 项目：炎帝视频（007_炎帝 → yandi-video）

- 素材：`output/007_炎帝/口播稿.md` + `配音.json`（40 段配音时间轴）+ `narration-chunks/*.tight.wav`
- 流水线：Playwright + Canvas 逐帧 → ffmpeg 合成，零生图 API
- 核心脚本：`yandi-video/render/gen_storyboard.js`（分镜+字幕对齐）、`page_full.html`（渲染）、`capture_full.js`、`audio/make_audio_full.js`
- 成片：102 分镜 / 333 字幕 / 386.9 秒

## 用户偏好（视频类）

- **全片密度规则（2026-10-25 确认，最高优先级）**：全片所有幕的动效密度必须对齐前 30 秒样片——动画多、动态多，严禁"大部分画面是动态文字撑场"
- **密度硬指标（三项同时满足）**：文字面积 ≤30%｜每 2 秒一个新动效点｜同屏 ≥5 个运动元素；纯文字画面（章节标题/片头片尾/金句）豁免 ≤20% 时长
- 转场必须温和，禁止全屏色块扫屏/高频闪白（明确返工过两次）
- 字幕：无标点、一次一句、大字号、时间轴必须来自音频停顿检测；**2026-10-25 用户裁定用炎帝样式底部字幕条+关键词金色高亮**（覆盖此前"参与场景"方案），场景元素底部避让 924px 线
- **手机可读性规则（2026-10-25，与密度指标同级）**：视频主要手机端观看——标签文字 ≥60px、内容文字 ≥64px、角色/关键图形 ≥170px 高、单镜主要元素 ≤5；禁止小排+小字桌面构图
- **素材补齐规则（2026-10-25）**：缺失形象由我方 ImageGen 生成——图生图（image1=nuwa_front.png + input_fidelity=high）+ 素材包生成记录.json 的提示词模板；注意 ImageGen 的 background:transparent 不写 Alpha 通道，输出是 rgb24，必须用 render/nuwa/rgb2rgba.js 转 RGBA（该编码器 CRC 必须大端 writeUInt32BE，且禁止二次转换）
- 风格：概念段 = 图标卡片（平涂图标）；故事段 = 剪影/皮影场景演绎；名场面强制剪影大场面
- 背景四层：静态深底 + 微动氛围元素 + 分段主题背景 + 动态场景舞台；全片一套主色系 + 段落点缀色
- 音频：复用现有配音，仅关键动效点加少量点缀音效；**BGM 规则（2026-10-25 用户裁定，覆盖此前"无 BGM"）**——每部片子都必须从无版权库 `D:/@kaifa/@/BGM/`（15 个分类：历史/史诗/部落/自然/阿拉伯/埃及/战争/悬疑/宇宙/人文/乡村/搞笑/未解/非洲/抖音最火BGM）优选配乐，按题材匹配；混音口径见"BGM 混音工艺"
- 验收：先出 30 秒密度样片 + 逐幕量化核验报告（文字占比/动效点数/同屏元素数 + 关键帧截图），达标后才全量
- 需要 4:3 与 3:4 双封面 + 标题 + 4 标签，随成片一起交付

## 女娲视频（006_女娲 → out/2 女娲）

- 完整需求规格：`yandi-video/docs/女娲_成片规则_v1.md`（2026-10-25 采访 16 问确认，新规则首次落地）
- 段落分配表：`yandi-video/docs/女娲_段落分配表_v1.md`（8 大段时间码+范式+名场面清单）
- 素材：`output/006_女娲/口播稿.md` + `配音.json`（chunks 42 段，427.2s，注意键名是 chunks 非 segments）+ `配音.wav` + narration-chunks
- 角色资产：`output/006_女娲/nuwa_front/side/back.png`（1254×1254 RGBA，Q版像素人首蛇身）+ `女娲故事常用素材_透明PNG_v1/`（17 张：伏羲/共工/部落母亲/男子/儿童/撑天神龟 + 11 道具）；混合风格=角色全彩像素 PNG + 群众/环境剪影；front=正面定格，side=行走位移，back=离去眺望；imageSmoothingEnabled=false
- 背景图：`output/006_女娲/背景图_v1/`（炎帝片亦复用其中 `bg10_layeredpeaks.png`）
- 样片已交付：`out/2 女娲/女娲样片_密度验证.mp4`（43.8s）+ `核验报告.md`——三指标全过（文字max15.68%/运动元素min7/22窗口无空窗/14幕全PASS）
- 新管线：`render/nuwa/`（gen_sample.js 分镜生成、page_nuwa.html 渲染页含QC仪表、capture_nuwa.js 逐帧、make_sfx.js 音效、qc_nuwa.js 全帧核验）
- 样片范围：A段0-30.1s（概念）+ 0.6s接点 + B段38.87-51.55s（故事，含造人setup句）
- 后续剧集角色/素材三视图由我方 ImageGen 生成

## BGM 混音工艺（2026-10-25 定稿，后续所有片子照此执行）

1. 选曲：`D:/@kaifa/@/BGM/<分类>/` 内按题材优选，与口播稿情绪段落对齐；用户可指定曲目
2. 测量：`ffmpeg -i mix.wav -af ebur128=peak=true -f null -` 取人声轨 LUFS
3. BGM 轨：`-stream_loop -1` 循环 + `-t <成片时长>` + `highpass=f=38,volume=<系数>,afade in 3s/out 7s`；目标比人声低约 19 dB（女娲实例：人声 -19.1 LUFS → BGM -38.4 LUFS，volume=0.084）
4. 混音：`amix=inputs=2:duration=first:normalize=0`（人声先 aformat 成 stereo）
5. 归一化：loudnorm **两遍法** I=-16 LUFS / TP=-1.5 dBTP（第一遍 print_format=json 取 measured_* 值，第二遍带入）；单用 alimiter 会出现真峰值溢出
6. 封装：`-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest`——**必须显式 -map**，否则 ffmpeg 默认会选到原视频自带的旧音轨（女娲实例踩过）
7. 验收：成片直接 `loudnorm=print_format=summary` 复测，须 ≈ -16.0 LUFS / ≤ -1.4 dBTP
