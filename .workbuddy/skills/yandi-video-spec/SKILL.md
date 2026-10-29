---
name: yandi-video-spec
description: 炎帝/女娲系列历史神话口播视频的成片规格与生产流程（Playwright + Canvas 逐帧渲染 + ffmpeg 合成），并含像素风 xiangsu 管线的 sprite 表与密度口径。当需要制作或返工该系列任意一集（女娲 427.2s 已定稿、炎帝 385.5s 已定稿、帝辛待做）、查询成片参数、做密度/门禁验收、调整字幕构图背景运镜、生成双封面与发布信息、混 BGM、整理交付目录、或画/改像素 sprite 表与跑动效密度时使用。触发词：女娲、炎帝、帝辛、成片参数、密度核验、门禁、封面、发布信息、BGM、交付目录、像素风、xiangsu、sprite 表、逐像素、动效密度。
---

# 炎帝/女娲系列 · 成片规格与生产流程（两集定版）

两集均已按本规格定稿交付：**女娲 427.2s（nuwa 线）**、**炎帝 385.5s（yandi 线）**。像素风线 **xiangsu**（640×360 栅格 + 逐像素 sprite 表）已承载第一个全片作品：**波斯湾伊甸园 272.1s（out/3，2026-10-29 定稿，规格见第十节 xiangsu 小节）**；仁德天皇陵 10 秒样片同为该线产物。本文件是**硬规格**：参数、阈值、路径、口径不得凭经验改；返工先读第九节避坑清单。

---

## 一、成片参数（固定值）

| 项 | 值 |
|---|---|
| 分辨率 / 帧率 | 1920×1080 / 30fps |
| 视频编码 | H.264, CRF 19, preset medium, yuv420p, `+faststart` |
| 音频编码 | AAC 192k, 44100Hz, stereo |
| 响度 | **-16.0 LUFS / 真峰值 ≤ -1.5 dBTP**（loudnorm 两遍法；成片复测 ≤ -1.4） |
| 音频构成 | 配音（主体）+ 关键点点缀音效（events 对轨）+ BGM（库内优选，低 19dB） |
| 字幕 | 底部字幕条（924–1024px 安全区），64px，无标点、一次一句、时间轴来自停顿检测 |
| 转场 | 温和（dip/veil/softFlash/softWipe/softIris），**禁全屏色块扫屏与高频闪白** |
| 水印 | 正片右上角 `@徐艾伦`；封面不带任何水印 |

| 集 | 时长 | 帧数 | 大小 | 结构 | 管线 |
|---|---|---|---|---|---|
| 女娲 | 427.2s | 12816 | 145.9MB | 8 段（S0-S7） | `render/nuwa/` |
| 炎帝 | 385.5s | 11565 | 164.5MB | 8 段 / 98 镜 / 320 字幕 / 163 事件 | `render/piying/` |
| 波斯湾伊甸园 | 272.07s | 8162 | 195.8MB | 640×360 栅格 ×3，58 条真实音效 | `out/3`（xiangsu 规格全片，2026-10-29 定稿 rev4） |

---

## 二、内容规范（验收硬指标）

### 2.1 密度三指标（同时满足，全帧仪表采集，非抽样）

1. **文字面积 ≤ 30%**（女娲 max 19.59%，炎帝 max 23.02%，均值 6-8%）
2. **同屏运动元素 ≥ 5**（女娲 min 6，炎帝 min 7，均值 11-13）
3. **每 2 秒至少 1 个新动效点**（两集均全窗口覆盖）
4. 纯文字画面（章节标题/片头片尾/金句）豁免，合计 **≤20% 时长**（女娲 11.5%，炎帝 3.3%）

核验脚本：`qc_full_yandi.js`（炎帝；女娲的 `qc_full.js` 已随 nuwa 管线删除，历史指标见下表）。渲染页内嵌仪表：`QC.moving` / `QC.acts` / `QC.textRects` / `QC.subRect` / `QC.fgRects`。

- 5% 透明度装饰大字**不得计入 textRects**（否则文字覆盖率虚高）
- 卡片与精灵已接入 `QC.fgRects`，参与越界审查

### 2.2 手机可读性（与密度同级）

视频主要手机端观看：标签文字 ≥60px、内容文字 ≥64px、角色/关键图形 ≥170px 高、单镜主要元素 ≤5 个。禁止"一小排+小字"桌面构图。

### 2.3 构图

- **人物默认居中于画面中线**；例外：三人横排（第一幕）、VS 对峙以中线为轴对称
- 场景元素底部避让 **918px** 红线（字幕区 924-1024），卡片/文字/chips 底边 ≤918

### 2.4 字幕

**文本规则（2026-10-28 用户定，全系列适用）**：字幕**不含任何标点**；一条里若有多个小句，小句之间**空一格**（渲染时用固定宽度 gap，不要依赖字体对角色的 advance）。

炎帝样式：深色通栏底（alpha 0.62）+ 金色左边条 + 白字黑描边 + 64px；关键词金色高亮（逐字检测，词库 `ACC_KEYS`）。时间轴**必须**来自音频停顿检测：`silencedetect=noise=-35dB:d=0.06`，短语按标点切分后向停顿点吸附（±1.2s），合并 <0.3s 碎句。

**时间轴精度硬要求（2026-10-28 增补，xiangsu 实证）**：只靠「字数比例 + 停顿吸附」不够——002 首版吸附率 78%，剩余靠比例估算，观众能听出不同步。有转写条件时必须做**词级强制对齐**：`tools/transcribe_faster.py` 出词级 `transcript.json` → opencc `t2s` 转简体（whisper 中文默认输出繁体，不转会掉到 80% 命中）→ 稿子字流与 ASR 字流做**字符级 LCS** 对齐（数字统一掩成 `#`，`二零一八` 与 `2018` 等长）→ 每字取实际发声时刻。验收口径：字符命中率 ≥85%、字幕窗静音占比 >35% 的条数 = 0。

### 2.5 音频

- 配音复用现有 wav，严格对齐，不改写
- 音效只在关键动效点，由分镜 `events` 对轨；**第一幕起卡片弹出与音效必须逐句对齐口播词**（见 2.8）
- BGM 见第七节

### 2.6 段落间停顿（硬规则）

- **样片两段式接点：≤0.25s**（0.6s 被打回"停顿过大"）
- 每次分镜生成后必须打印 **chunk 间隙审计**（>0.15s 列表）；炎帝实测最大 0.02s（连续紧排），无需剪音频
- 场景边界用 `snapCut()` 吸附停顿点（±0.6s）；禁止 >1.2s 的无字幕空镜

### 2.7 交付前四查门禁（封装前必跑，全过才允许交付）

`node audit_yandi.js full|sample`（女娲线对应改 SB/页面参数）：

1. **场景类型覆盖（静态）**：sb 每个 type 必须在分发链或 TYPE_CFG——未注册 = 整段空渲染
2. **字幕区越界（全帧运行时）**：textRect/fgRect 底边 >930 且顶 <1024；**持续越界（场景内 >50% 帧）才 FAIL**，入场动效瞬时穿越输出 WARN
3. **空渲染疑似（全帧）**：非豁免场景 moving≤6
4. **坏文本（全帧）**：bigText 收到非字符串（渲染成 `[object Object]`）记入 `__badText`

### 2.8 音画同步（硬规则，炎帝整改定稿）

- 入场动画时序参数必须对齐**字幕句首时间**（如第一幕四卡：米饭 0.15 / 白菜 1.70 / 萝卜 2.24 / 猪肉 2.73s，取自停顿检测）
- 对应 `events` 音效点与卡片弹出点同值
- **缓动函数必须过边界单测**：`eob(0)` 必须精确为 0（`if(t<=0)return 0`），否则 `p<=0` 判断失效 → 所有元素从场景首帧全量显示（炎帝五轮返工的真正根因）
- 单测要求：`eob(0)=0`、`eob(1)=1`、区间单调；`eoe(0)=0`、`eio(0)=0`

### 2.9 sprite 表 vs 单张像素图的判定（2026-10-28 用户裁定，硬规则）

**只给"有连续动作或形态变化"的元素画 sprite 表；静态元素一律单张像素图。** 判据是元素在镜头内**逐帧变性**（形状/姿态/部件关系变了），而不是"重要"或"复杂"。

必须 sprite 表（逐帧不同形态）：

| 类别 | 实例 |
|---|---|
| 人群/群众骚动 | 宣布挖陵的人群骚动：13 人姿态帧（站/低头/举手/转头）、集体举手帧、抖动位移帧 |
| 机械作业 | 考古现场挖掘机作业：大臂-小臂-铲斗联合角度帧（5–6 帧）、铲斗空/满土两态、履带行走进帧 |
| 开启与显现 | 棺木开启露出文物：棺盖闭合/半开/全开帧、甲胄浮起帧、铜镜反光帧 |
| 传说场面 | 徐福传说里工匠造船出海：锯木/钉板/推船/扬帆分帧、海浪翻滚帧 |
| 人物情绪 | 疑惑→震惊的微动作：眉/眼/口分帧（至少 3 帧：常态→微动→定住） |

禁止 sprite 表（单张像素图即可，最多加整像素位移/旋转作为运动）：

- 固定的仁德天皇陵全景、封土轮廓、远山天际线
- 单帧文字标题、日期戳、案号牌、RPG 弹窗
- 静止的文物特写、甲胄/铜镜/陪葬品本体
- 无动态的背景建筑：石室墙壁、石门框、柱、地面
- 机械的静态部件：挖掘机机身与履带（单张），只有臂组需要帧
- 门扇/棺盖的**位置**变化用单张图整像素平移，不改形态就不做帧

执行细则：
- 一个元素若既有静态主体又有动态部件，**拆开**：静态主体单张图 + 动态部件 sprite 表（例：挖掘机 = 机身单图 + 履带单图 + 臂组 6 帧）
- sprite 表帧数取"动作关键姿态数"，不做 tween（补间靠整像素位移+`stepEase` 阶梯量化）
- 静态单张图也必须按 640×360（或该片原生栅格）**逐像素**画，禁止放大缩放、禁止在 1080p 上描线
- 帧表命名 `<对象>_F0..Fn`，帧内尺寸必须完全一致（同宽同高），否则整像素位移会抖

---

## 三、背景

### 3.1 全片统一背景

**`output/006_女娲/背景图_v1/bg10_layeredpeaks.png`**（群峰叠嶂，1920×1080），两集共用。

接入：`render()` 最底层 `bgBase(t)` → bg10 **aspect-fill 居中裁切** + 运镜；其上 `bgParticles / bgTheme / bgStage` 三层动态。

### 3.2 背景库（10 版，`output/006_女娲/背景图_v1/`）

bg01 星雾深空 / bg02 黄土泥沼 / bg03 天裂 / bg04 五色补天 / bg05 篝火暖夜 / bg06 青绿层峦 / bg07 金殿香火 / bg08 归星夜幕 / bg09 远山水意 / **bg10 群峰叠嶂（全片采用）**。生成：`gen_backgrounds.js`（代码绘制 8 版，零积分）。

### 3.3 背景硬约束

- 近黑深底 `#0E1518`–`#1D1910`，低饱和低对比，无亮斑/光晕
- 视觉元素集中四缘/顶/底，**中心 60% 近黑留空**给人物与字幕；山景峰顶 ≤画面高 45%
- 主色系：金 `#E8B84B` / 玉 `#4E9E8A` / 米 `#F3EAD3` / 赭红 `#D9534F` / 土 `#8A5A3B`
- **图片铺底必须 aspect-fill 裁切**，禁止拉伸

### 3.4 背景运镜（全片必带）

`camAt(t)`：横移 `panX=sin(tπ/26)×42px`（全周期 52s）+ 纵漂 `panY=sin(tπ/47+1.2)×14px` + 推拉 `zoom=1.09+cos(tπ/19)×0.03`（38s）。左右/推拉缓慢交替（周期错拍、正弦缓动无跳变）；zoom 基线 1.09 保证不出界；相机只作用于图片层，pan/zoom 在 clamp 内收口。

---

## 四、封面（ImageGen + tushuo 口径）

### 4.1 规格

| 项 | 值 |
|---|---|
| 尺寸 | `cover_4x3.png` 1440×1080 ｜ `cover_3x4.png` 1080×1440 |
| 生成 | 内置 ImageGen，`1536x1024`（横）/ `1024x1536`（竖）→ 裁切缩放 |
| 标题 | **金色毛笔行楷**，模型直接画入，恰好 N 个汉字（炎帝/女娲 = 2 字；横版横排、竖版竖排） |
| 画面 | 上方 1/3 深色标题区；Q版像素主角居中；青绿山峦分层；暖金逆光 |
| 禁止 | 引号、副标题、字母数字、logo、水印、现代物品、清晰人脸 |

### 4.2 tushuo 提示词结构（逐段不可省）

`史诗/竖版海报定位 → 远近分层场景（远/中/近）→ 色调光影 → 上方1/3深色标题区 → 金色毛笔行楷「恰好N个汉字」+ 笔画完整清晰 → 负面约束清单`

参考模板：`D:/@kaifa/tushuo/content/liuxiu-4min/covers/prompt-4x3.txt` / `prompt-3x4.txt`。

### 4.3 后处理（ImageGen 必带「AI生成 WORKBUDDY」角标）

```bash
# 4:3：delogo 消印 → 居中裁 1364×1024 → 1440×1080
ffmpeg -y -i src_4x3.png -vf "delogo=x=1380:y=938:w=150:h=80,crop=1364:1024:86:0,scale=1440:1080:flags=lanczos" cover_4x3.png
# 3:4：底部裁 172px（水印在裁切线以下）→ 1080×1440
ffmpeg -y -i src_3x4.png -vf "crop=1024:1364:0:0,scale=1080:1440:flags=lanczos" cover_3x4.png
```

- `delogo` 贴边报 `Logo area is outside of the frame`：x+w 必须 < 图宽、y+h < 图高
- 裁切不得切标题笔画（竖版从底部裁）
- 原图留档 `<集目录>/封面生成_v2/`（炎帝实例：`output/007_炎帝/封面生成_v2/src_4x3.png|src_3x4.png`）

### 4.4 备用方案（代码合成）

Canvas 合成法（原 `render/nuwa/cover_nuwa_v2.js`，脚本已删，方法留档）：bg10 aspect-fill + 主角 + STXingkai 金色渐变标题。系统书法字体：`STXINGKA`(行楷) / `STXKAITI` / `STXLITI`(隶书) / `STXINWEI`(新魏) / `FZSTK`。

---

## 五、发布信息（`发布信息.txt` 固定格式）

```
【标题备选 · 5 选 1】

1. <标题1>
2. <标题2>
3. <标题3>
4. <标题4>
5. <标题5>

【推荐】N（一句理由）
【次选】M（一句理由）

【话题】
#炎帝 #神农氏 #中国神话 #涨知识
```

标题规范：每条 **≤27 字**、两段式强钩子、前 8 字抓注意力；至少含反常识/数字/揭秘/身份认同/中西冲突/设问之一；推荐位放与片头咬合的那条；标签固定 1 行 4 个。

---

## 六、生产流程

### 6.1 炎帝线（`render/piying/`，最新，推荐作为后续剧集模板）

| 步 | 动作 | 脚本 | 实跑耗时 |
|---|---|---|---|
| 1 | 配音与时间轴 | 复用 `output/007_炎帝/配音.json`（**键名 chunks**，40 段）+ `配音.wav` | — |
| 2 | 停顿检测 | `silencedetect=noise=-35dB:d=0.06` → `sil_full.txt`（342 点） | 秒级 |
| 3 | 分镜生成 | `node gen_full_yandi.js` → `yandi_full_sb.json`（98 镜/320 字幕/163 事件，边界 snapCut） | 秒级 |
| 4 | 渲染页 | `page_full_yandi.html`（样片场景 + TYPE_CFG 通用引擎 + 10 剪影变体 + 运镜 + 分段主题色） | — |
| 5 | 密度核验 | `node qc_full_yandi.js`（三指标全帧） | 1.5 min |
| 6 | **四查门禁** | `node audit_yandi.js full`（必过，否则不封装） | 45 s |
| 7 | 全量捕获 | `node capture_full_yandi.js` → `frames_yandi_full/` 11565 帧 | ≈12 min |
| 8 | 音频 | `node make_sfx_full_yandi.js` → `full_mix_yandi.wav`；BGM 七步 | 3–5 min |
| 9 | 封装 | `-map 0:v:0 -map 1:a:0 -c:v libx264 -crf 19 ...` | 3 min |
| 10 | 复核与交付 | ****（四查+qc+响度+目录 一条命令）→ 封面、发布信息、目录整理 | 3 min |

### 6.3 样片（30 秒密度验证，同法）

`gen_sample_yandi.js`（A段 0-32.35 + 0.25s 接点 + B段）→ `page_yandi.html` → `capture_yandi.js` → `audit_yandi.js sample` → 封装进 `源文件/`。

### 验收门槛

- 密度三指标逐段达标（女娲 8 段 / 炎帝 98 幕全 PASS）
- **四查全过**（无 FAIL；WARN 只允许入场动效瞬时穿越）
- 响度复测 -16.0±0.3 LUFS / TP ≤ -1.4

---

## 七、BGM 混音工艺（七步）

1. **选曲**：`D:/@kaifa/@/BGM/<分类>/`（15 类），按题材优选；女娲=阿拉伯 Desert_Caravan，炎帝=历史 古文明 Hidden_Wonders
2. **测人声**：`ffmpeg -i mix.wav -af ebur128=peak=true -f null -` 取 I 值（女娲 -19.1 / 炎帝 -18.9）
3. **BGM 轨**：`-stream_loop -1` + `highpass=f=38,volume=<系数>,afade in 3s/out 7s`；目标比人声低 19dB（女娲 0.084 / 炎帝 0.0813）
4. **混音**：人声先 `aformat=channel_layouts=stereo`，再 `amix=inputs=2:duration=first:normalize=0`
5. **归一化**：loudnorm **两遍法**，I=-16 / TP=-1.5（该 ffmpeg 不支持 `target_offset` 参数，勿传）
6. **封装**：显式 `-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest`
7. **复测**：成片跑 `ebur128=peak=true`，须 ≈ -16.0 / TP ≤ -1.4

**关键坑**：不写 `-map` 会选回旧音轨；volume 公式为 `10^((-人声LUFS-19+16.1)/20)`（写反会得到 501 量级）。

---

## 八、交付目录契约

**根目录：`D:/@kaifa/yandi/out/`（项目根下，不在 yandi-video 内；2026-10-27 由 `yandi-video/out/` 迁此，旧路径勿再用）。**

```
out/<序号> <标题>/
├── <名称>_全片.mp4      # 含 BGM 成片
├── cover_4x3.png        # 1440×1080
├── cover_3x4.png        # 1080×1440
├── 发布信息.txt          # 5 选 1 + 推荐 + 话题
└── 源文件/              # 样片、核验报告、旧版成片等全部其余文件
```

**顶层只允许 4 项**；序号从 1 递增；已发布成片归档到 `out/@已发/<序号> <标题>/`。当前：炎帝=out/@已发/1，女娲=out/@已发/2，波斯湾伊甸园=out/3。

---

## 九、避坑清单（两集全部血泪，返工前必读）

1. **配音.json 键名**：本系列一律 `chunks`（女娲 42 段 / 炎帝 40 段）——"炎帝=segments" 为作废记录
2. **缓动函数浮点边界**：`eob(0)` 浮点计算为 +2.22e-16 而非 0，导致 `p<=0` 判断全部失效、入场动画从首帧全量显示（炎帝五轮返工根因）——所有缓动必须 `if(t<=0)return 0` 并做边界单测
3. **场景类型未注册**：gen 发类型但渲染页无分支 → 整段空渲染（女娲 globe、炎帝 11 处）。新增类型必须同步 TYPE_CFG/分发链；TYPE_CFG 用 `^ 'key':{` 正则自检
4. **gen 数据结构与渲染页约定**：items/nodes 传 `{lb:..}` 对象数组时渲染端必须取 `.lb`，否则渲染出 `[object Object]`（用户看到"英文"）
5. **越界审查必须含卡片与精灵**：只查 textRects 会漏掉卡片越线（fourbig 迷你卡事故）；card()/sprite() 已接入 QC.fgRects
6. **局部重捕遗漏**：改布局后必须核对**全部同类场景**的帧段是否都在重捕清单（hardendure 段曾漏捕 30 分钟）
7. **重捕不要用 `rm -rf frames/`**（安全策略拦截）；直接覆写同名帧
8. **内存压力**：全量捕获 + 编码并发会 `x264 malloc failed` / node 崩溃；捕获与编码必须**串行**，且失败后先确认帧完整性再重跑
9. **色板缺键**：`COL.blue` 等未定义 → `fillStyle=undefined` 黑块
10. **文字覆盖率虚高**：5% 透明度装饰大字若计入 textRects 会假性爆表，必须绕开 bbox
11. **ImageGen 无 Alpha**：`background:transparent` 输出 rgb24；纯品红底 + `chroma2rgba.js`（品红键控+despill）+ `refine_main.js`（BFS 主体保护）最优；暗紫渐变背景用 `purplish2rgba.js`（阈值按实测背景 RGB 定，炎帝实例 T0=2/T1=16）
12. **delogo 贴边**：x+w 等于图宽即报错
13. **ffmpeg 默认选流**：多输入必须显式 `-map`
14. **中文路径**：`file://` 逐段 `encodeURIComponent`
15. **图片铺底拉伸**：必须 aspect-fill
16. **SB.gap 空引用**：样片页复制为全片页时，`SB.gap.*`（样片接点）全片不存在，必须改分段判断，否则首帧即崩
17. **配音可能跳过口播稿整句**（波斯湾伊甸园实例：配音没念"是一片夹在沙漠里的巨大绿洲"，空窗 2.04s 导致 53s 后所有字幕滞后 2s，呈拱形累积漂移）。**不要**信任停顿检测出来的旧字幕时间窗作为最终时间轴——必须用 `配音.transcript.json`（ASR 词级时间戳）逐句重锚：对每句旧窗 [a,b]±5s 范围内滑动找 transcript 相似度最高的词位置（阈值 0.35），匹配上就用真实词 start/end；匹配不上（真没念/ASR 错识）压缩到 0.05s 空窗。9 句被压缩属正常（短词数字"你品品/搁今天/二零二一年"等 ASR 错识）。
18. **ASR transcript 是繁体且有同音字错识**（"考古界压根"→"考古皆鸭"、"海湾"→"海灣"）：直接全局 difflib 对齐 S(简体 subs) vs T(繁体 transcript) 会因繁体+错字累积偏移（波斯湾实例把"波斯湾以前根本不是海"错锚到 56.9s）。**必须**先建繁简映射表（约 150 字）转简体，再用"以旧窗为锚±5s 局部搜索"而非全局顺序消耗；pip install opencc 可能因 SOCKS 代理失败，手写映射表更稳。
19. **交付目录已迁**：成片根目录是 `D:/@kaifa/yandi/out/`（项目根下），不再是 `yandi-video/out/`；渲染中间产物仍在 `yandi-video/render/<集名>/`，两者勿混。
20. **sprite 表滥用**：把静态元素（全景/标题/文物本体/门框/机身）也画成多帧 sprite 表是白费工且更难看——判据见 2.9，只有"逐帧变性"的元素才做帧表；静态的用单张逐像素图。
21. **关节链长度必须等于 sprite 实际像素长度**（xiangsu 实例：大臂 61 宽锚点 2 → `L1=56`；小臂 44 宽锚点 1 → `L2=40`）。按"看着差不多"给 40/23，画出来的臂尖比销轴远 18–19 px，末端铲斗悬空 18 px——放大后才看得见，640 栅格下这是最常见的一类错。
22. **两块旋转矩形相接必漏三角空洞**：`blitRot` 拼臂组时，外侧边缘会漏出一个三角，读作"风筝"。必须用铰点盘 `boss(x,y,r,rim)` 盖住接缝，且 rim 只比机身亮一档（`M(2)`）——用 `M(6)` 会在夜色里变成一个扎眼的白环。
23. **受光方向必须跟着光源算**：受光弧的起止角 = `atan2(光源y-物体y, 光源x-物体x)` 为中心展开。xiangsu 实例把圆丘受光弧写成 `-0.35..0.95`（扫到右下），而月亮在右上（≈-0.46），结果剪影像被咬了一口。凡是"边缘光/轮廓光"都先算方向再画。
24. **三套字符映射选错，整套图变味**：机械走 `MAP_MACH`（不提亮则夜色里全黑）、石材与铜活走 `MAP_STONE`（走 `MAP_PAL` 会变钢蓝"胶囊"）、纯色人物走 `MAP_PAL`。判据：这物件在现实里是什么材质、在片里受不受灯光影响。
25. **密度不能靠手感、也不能手打脚本**：一律 `node tools/density.mjs <video>`（三阈值 0.5%/1%/3% + 最长无变化段 + 逐窗口过/不过）。手打 `node -e` 每次阈值和采样尺寸都会漂，前后不可比；脚本是纯函数口径，数字才可回归。
26. **像素字体二值化阈值取 alpha > 200**（xiangsu 实例用 118）：118 会把 1 px 抗锯齿半透明边一起写进索引缓冲，放大 3 倍后笔画发虚、出现错位残影。
27. **字幕时间轴不能只靠字数比例**：比例法默认匀速（本项目实测 6.58 字/秒），但数字、专名、语气停顿处语速差很多，误差会累积到观众可感知。有转写就走词级 LCS 强制对齐（见 2.4），验收看「字符命中率 ≥85%」与「字幕窗静音占比 >35% 的条数 = 0」两项。
28. **whisper 中文默认输出繁体**：不转简体直接与简体稿子对齐，字符命中率只有 79.7%（002 实例：開/开、國/国、墳/坟全不匹配）。必须 opencc `t2s` 先转，转后升到 89.6%。

---

## 十、脚本清单

### `render/piying/`（炎帝线 · 后续剧集模板）
```
gen_sample_yandi.js / gen_full_yandi.js     样片/全片分镜（停顿吸附+snapCut）
page_yandi.html / page_full_yandi.html      样片/全片渲染页（TYPE_CFG 通用引擎+剪影变体+运镜）
capture_yandi.js / capture_full_yandi.js    逐帧捕获
qc_yandi.js / qc_full_yandi.js              密度三指标核验
audit_yandi.js                              四查门禁（full|sample，exit code 非零拦截）
delivery_gate_yandi.js                      交付总门禁（四查+密度+响度+目录，一条命令）
make_sfx_yandi.js / make_sfx_full_yandi.js  音效+配音混音
chroma2rgba.js / purplish2rgba.js / refine_main.js   ImageGen 素材抠图工具链
```

### `render/nuwa/`（女娲线 · 2026-10-29 已删除）

女娲 427.2s 成片在 `out/@已发/2`。制作脚本（gen_full / capture / make_sfx / qc_full / rgb2rgba 等）已随管线删除；素材包 `output/006_女娲/` 保留（bg10_layeredpeaks 背景两集共用）。若需返工女娲片，从 git 历史或 `.workbuddy/backup/` 找回脚本。

### `render/posiwan/`（⚠️ 已废弃 · 2026-10-29 被 xiangsu 规格全片取代）

> 旧 16:9 版波斯湾线（73 镜/198 字幕/131 事件）。2026-10-29 波斯湾伊甸园以 xiangsu 规格（640×360）重跑并定稿（`out/3`，FREEZE_full_rev4.json 为准），本目录不再使用；脚本留档未删。
```
page_full_posiwan.html / capture_full_posiwan.js / audit_full_posiwan.js
posiwan_full_sb.json / .js（分镜数据，73 镜/198 字幕/131 事件）
subs_new.json（ASR 词级重锚后的字幕时间轴）
final_mix_posiwan.wav（配音+音效+阿拉伯 BGM，-16.0 LUFS/TP-1.4）
BGM：D:/@kaifa/@/BGM/阿拉伯/Desert_Caravan.mp3（volume=0.079，highpass=38，afade in 3s/out 7s）
ffmpeg 全路径：D:/@kaifa/yandi/vendor/gpt-sovits/runtime/ffmpeg.exe（PATH 里找不到）
```

### `render/xiangsu/`（像素风线 · 2026-10-28 用户命名 `xiangsu`）

**已交付全片：波斯湾伊甸园 272.1s（`out/3`，2026-10-29 定稿 rev4）**。管线源码**已完整保留**在项目侧 `yandi-video/render/xiangsu/`（2026-10-29 由 xiangsu2 改名接管这个名字；现行身份与 41 文件逐 SHA-256 见 `render/xiangsu/FREEZE_PIPELINE.json`）。渲染仓库里的 `demos/xiangsu-eden-full/`、`demos/xiangsu-cover/` 是可再生副本，定稿后删除，`node full/assemble.mjs` 会重建。做下一部 xiangsu 全片时**直接用这条冻结管线**改内容层（`demo/film.js` 头部 + `full/parts/*.js` + `full/cues.json`），不要去 `demos/xiangsu/` 捡旧 workbuddy 像素线骨架。开工与片级必填参数见 `render/xiangsu/README.md`「新片参数（2026-10-30）」；音频与验收仍按 FREEZE 配方，规范如下：
- 规格：1920×1080（640×360 栅格 ×3 整数最近邻）· 30fps · 8162 帧 · −16.0 LUFS / TP ≤ −1.0 dBTP
- 混音：voice + bed×0.20 + **sfx×0.55**（58 条真实音效，源 `D:/@kaifa/@/音效`）→ **两遍 loudnorm**；真峰超限时 ffmpeg 退回 dynamic 模式（rev4 实测与线性差中位 0.04 dB）
- 像素密度验证（FREEZE 口径）：块内列差 <1.4 / 跨块列差 >8 / Y 通道还原差 <0.4 / >12 级异常 0.00% / RGB 还原差（4:2:0 色度抽样）<2 —— 比 PSNR 更能抓"栅格被改"
- 封面：从成片选最有戏剧张力的镜头（如 t=42.4s 日出逆光半人半鱼），关字幕关 HUD，×4~×5 最近邻取窗放大，顶部深色标题区 + 华文行楷金色标题；无副标题/水印

管线代号固定为 **xiangsu**。源码在项目侧 `yandi-video/render/xiangsu/`，由构建脚本同步进克隆的渲染仓库（harness 自带无头 Chrome + ffmpeg）；渲染仓库里的 `demos/xiangsu-eden*/` 是生成物，不要当源改。
```
yandi-video/render/xiangsu/（源）→ <repo>/demos/xiangsu-eden/、xiangsu-eden-full/（生成）
  demo/index.html 预加载 Fusion Pixel 12 后 import film.js，置 window.__ready
  demo/film.js    640×360 索引色帧缓冲：色板/LUT、图元、像素字体、六镜头、band wipe、CRT
                  （全片 film.js = 本文件头部 + full/parts/*.js，由 full/assemble.mjs 拼装）
  demo/sprites.js 逐像素 sprite 表（ASCII 网格，每字符 = 1 px；空格仅人眼计数，构建时剥离）
  demo/cues.json  10 s 样片 cue sheet；full/cues.json 是全片 cut/sub/hit
  demo/audio.py   样片配乐；full/audio.py 是全片配乐 + 音效 + 配音混音，两遍法 loudnorm
<repo>/tools/sheet.mjs   sprite 表放大检查图（行宽/未知字符告警，逐像素自查用）
<repo>/tools/density.mjs 动效密度度量（三阈值 + 最长无变化段，口径唯一）
```
关键实现：`CHR` 里 **`'.'→-1 透明，`k`→0 不透明黑**（写成 `'.':0` 会让 `k` 全变透明，整张图只剩描边外的高光点）；
`buildSpr(name,rows,map,rim)` 构建时做 `rimLight`（右上月光边）；`rotSpr/ blitRot` 提供 5° 档旋转帧缓存；
三套字符映射不可混用：**机械走 `MAP_MACH`**（整档提亮，否则夜色里全黑看不清）、**石材与铜活走 `MAP_STONE`**（env 槽，随镜头分级变色且可被灯打亮；门环走 `MAP_PAL` 会变钢蓝"胶囊"）、**纯色人物走 `MAP_PAL`**（靠 `PALT` ramp 提亮）。
**成片规格（硬规格，不许改）**：输出 **1920×1080**、像素栅格 **640×360**（1 逻辑像素 = 3 屏幕像素）、**×3 最近邻**、30 fps、H.264 yuv420p CRF14、AAC 192 kbps/48 kHz，响度 **−16 LUFS / ≤ −1.5 dBTP**（20-pixel 支线是 −14，别混）。栅格与成片由两个不同常量控制，不得混改：

```
film.js:10   const W = 640, H = 360                            // 栅格：决定"像素有多粗"
film.js:12   window.DEMO = { width: 1920, height: 1080 }        // 成片：决定"画布有多大"
```

改成 320×180 会让像素粗一倍（那是 20-pixel 支线的密度，不属于本线）；把 DEMO 改成 640×360 则成片不到 1080p，平台二次拉伸会破坏像素格。

**验收密度是否还是 640×360**（只看分辨率查不出密度被改粗）：抽一帧降采样回 640×360 再 ×3 最近邻放大，与原帧比 PSNR——本线实测 **41.8 dB**（差值只来自 H.264）；若密度其实掉了 320×180，同法只有 **24.4 dB**。

```bash
ffmpeg -v error -i "$F" -vf "select=eq(n\,120)" -vsync 0 -frames:v 1 /tmp/a.png -y
ffmpeg -v error -i /tmp/a.png -vf "scale=640:360:flags=area,scale=1920:1080:flags=neighbor" /tmp/b.png -y
ffmpeg -hide_banner -nostats -i /tmp/a.png -i /tmp/b.png -filter_complex "[0][1]psnr" -f null -
```

光栅 ×3 最近邻放大；文字按"版面比例不变"换算：320 版 scale 1 → 640 版 scale 2，标题 scale 2 → 4；像素字体 alpha 二值化阈值取 **>200**（118 会留 1 px 抗锯齿渗边，放大后发虚）。
CHROME 路径：`C:/Program Files/Google/Chrome/Application/chrome.exe`（`MG_CHROME` 环境变量）。

**sprite 表四条铁律**（2026-10-28 v2 逐条踩过，新画表前先读）：
1. `CHR` 的 `'.'` 与 `k` 不能同为 0——透明与不透明黑必须分开；
2. 关节链的 `L1/L2` **必须等于 sprite 实际长度**（大臂 61 宽锚点 2 → 56；小臂 44 宽锚点 1 → 40）。按"看着差不多"给 40/23，画出来的臂尖会比销轴远 18–19 px，末端物件（铲斗）悬空；
3. 两块旋转矩形相接**必定漏出三角空洞**，用 `boss(x,y,r,rim)` 铰点盘盖住；rim 只比机身亮一档（`M(2)`），`M(6)` 会在夜里变成一个扎眼的白环；
4. 液压缸/连杆的端点要**吸附到臂的上下缘**（大臂轴线到表缘仅 5–6 px），按轴线 +n*7 算就会悬空成"细铁丝"。
另：手写表右边缘常漏 1–2 格纯透明列，`sprites.js` 尾部统一补 `.` 到本表最大宽度即可（w 不变、像素零变化，但消掉整屏 `[spr] 行宽不一致` 告警）。

**交付自检（xiangsu 线）**：
```bash
# 当前全片：一条命令出结论（规格 / 响度 / 动效密度 / 像素密度 / 落盘）
cd D:/@kaifa/yandi/yandi-video/render/xiangsu/full
node verify_full.mjs "$XIANGSU_PROJ/全片_${XIANGSU_FILM}_<秒>秒_1920x1080.mp4" --duration "$XIANGSU_DUR"

# 下列为分项口径（路径按当前片替换；<repo> = D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15）
cd <repo>
export MG_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe"
node tools/sheet.mjs out/sheet.png 6                        # ① sprite 表：必须 0 条行宽/未知字符告警
node tools/density.mjs demos/xiangsu-eden-full/out/video_full.mp4   # ② 密度：逐窗口 >1% ≥1 帧 + 最长无变化段
ffmpeg -hide_banner -nostats -i demos/xiangsu-eden-full/out/video_full.mp4 \
  -af loudnorm=print_format=summary -f null -               # ③ 响度：−16.0 LUFS / ≤ −1.4 dBTP
ffmpeg -hide_banner -nostats -i demos/xiangsu-eden-full/out/video_full.mp4 \
  -vf blackdetect=d=0.05:pix_th=0.10 -f null - | grep black_start | wc -l   # ④ 黑帧：应为 0
node tools/check_sync.mjs --cues D:/@kaifa/yandi/yandi-video/render/xiangsu/full/cues.json \
  --audio D:/@kaifa/yandi/yandi-video/render/xiangsu/full/out/audio.wav \
  --asr "<当前片项目目录>/配音.wav.transcript.simp.json"   # ⑤ 字幕同步：必须带 --asr
```
黑帧那行**不要写 `grep -c`**：计数为 0 时 `grep -c` 返回退出码 1，会被误判成自检失败；用 `grep … | wc -l` 恒返回 0。
密度脚本的阈值口径固定为「192×108 灰度、帧间差 |Δ|>8、变动像素占比」；换采样尺寸或阈值必须在报告里写明，否则与历史片不可比。

**第 ⑤ 条不能只用 VAD**：本片配音几乎连续（最大停顿 0.11 s），任何 1–2 秒窗口都落在有声段——比例法时间轴实际偏差 p50 13.3 s 时，「窗内有声占比」仍报 **87.9% 通过**。只有 `--asr` 的内容级比对（字幕文字 vs 该时段实际念的字，字符级 LCS）才抓得出来：词级对齐 **90.1%** vs 比例法 **13.9%**。判据：窗内有声均值 ≥80%、字符重合均值 ≥80%、弱条（<50%）≤8%，三项同时满足。中文数字必须先归一化（「二零一八」↔「2018」、「二百八十九」↔「289」），脚本已内置，不归一化会误报 4 条。本线基线（`full48.mp4`，102 条）：窗内 87.1%、间隙 29.5%、起点对准 99/102（平均偏移 109 ms）、字符重合 90.1%、弱条 0。

### `youxi` 游戏跑酷管线（2026-10-29 用户命名定稿，原名 rinoku20 / 20-pixel 换皮）

上游标准：`D:/BaiduSyncdisk/MG 动画/videos/20-pixel.md`；实现：`vendor/mg-styles-15/demos/20-pixel/`；**本片管线：`vendor/mg-styles-15/demos/youxi/`**（2026-10-29 由 rinoku20 改名固化）。
**管线定位**：第四条渲染管线，与 piying（剪影卡片）/ xiangsu（像素风 640×360）并列。形态 = 320×180 点阵 + 7 关跑酷世界 + 检查点事件制，口播驱动分镜。规格 −14 LUFS（注意与系列 −16 区分）。
**开工次序**：改 `cues_game_full.json`（subs/事件/子场景）→ `patch_events_round2.mjs` → `check_events.mjs --fix-coins` → `build_full.mjs`（一键合并 + splice + 打补丁，产物 `_content_full.js`/`film_full_game.js`）→ `audio_full.py` → `mix_voice.mjs` → harness 渲染 → 四查。样片线（前 10 秒三镜）入口 `index.html`，全片入口 `index_full_game.html`，封面 `cover.html`（`--w/--h` 切 4:3 / 3:4）。

**做法**：整目录复制后只换内容层，不重写。保留 320×180×6、32 色板、day→afternoon→golden→sunset→flash→dusk→night 六段调色、4 层视差（0.125/0.30/0.55/1.0）、24×26 精灵合成器、cue 驱动的推镜与震动、WebGL2 CRT（扫描线+桶形+磷光+暗角）。
**换皮点**：`LOGO0 = buildLogo5('中文')`（必须在 `C5` 常量之后）、条幅文案、对话框台词与说话人、HUD 标签、主角头美术。
**不要开 `V5=true`**：那是 reel 版式，会多画一个跟随主角的圆球。
**规格**：10.000 s / 1920×1080 / 30 fps / **−14 LUFS** / ≤ −1 dBTP（注意与系列其他片的 −16 区分）。
**运行前提**：Windows 必须 `MG_GPU_ARGS="--use-angle=d3d11 --no-sandbox"`；`assets/fonts/latin/pressstart2p/` 需有 `PressStart2P-Regular.ttf`，缺失会导致字体加载 reject、整页不渲染（当前用 Fusion Pixel 拉丁子集顶替）。
**音频**：`demos/*/audio.py` 依赖 `pyloudnorm`；venv 无 pip 时用 numpy 版 BS.1770 替身（K 加权 + 双门限）放进 site-packages，实测与 ffmpeg ebur128 差 <0.1 LU。

#### 用该引擎承载自有内容（2026-10-28 三镜样片，`film2.js`）

当片子**有旁白、有字幕、分镜要对口播**时，不能只换皮——要重写内容层。做法：复制 `film.js` → `film2.js`，按锚点把 `world state (closed-form)` 到 `WebGL2 CRT` 之间的代码整段替换，前面的色板/精灵工具/字体/背景层、后面的 `renderAt` 保持原样（`renderAt` 引用的 `lightAt`/`waveR` 在新段里补空函数 `() => null`）。

四条硬约束：

1. **`renderAt` 对整帧采样，zoom 会把 UI 一起放大**。上游 8–12 倍 punch-in 时画面里没有字幕，本管线字幕条常驻，实测 8 倍时 12 px 字变 96 px 高、字幕条吃掉画面 1/4（最近邻放大不糊，是尺寸失控）。要么把 UI 挪到放大之后画，要么放弃 zoom，用「主体画大 + 现场道具 + 光效」补景别。
2. **环境槽 `E.*` 随调色阶段变色，剪影/道具必须用固定 `M(i)`**。远景陵墓用 `E.mD` 在 DAY 段是蓝色（SM `[5,5,29,10,9,1]`），会画成蓝蘑菇。
3. **12 px 点阵的阿拉伯数字 0 与 8 难分**（「2018」读成「2818」）：日期写中文。**印章内塞 12 px 双字必糊**：改单字 + 装饰纹。
   字幕排版另有一条硬规则：**字宽不能用 `glyph().adv`**。Fusion Pixel 12 对部分汉字（剩 / 雄 / 略…）返回半宽度量 `adv=6`，而字形是满格 12~14 px，按 adv 推进下一个字就压上来（320 栅格里实测「只剩雄略」糊成一团）；`min(adv,12)` 也只是从"压一半"变成"压一点"。正解是**等宽常数**：中文 `12+2`、ASCII `6+2`、词间空格 7，测量（total / 框宽）与绘制（逐字 x 累加）共用同一个 `subCharW()`。整句与金色高亮词**必须在同一个循环里画**——分两次画（先白底整句、再金色覆盖）会因两套定位产生双影。`glyph().w` 是 canvas measureText 原始值，个别字能到数百，任何用到它的地方都要 clamp。
   另有一条**缺字坑**（2026-10-29 实测）：页面只在 `index.html` 里预热了「样片用到的几十个字」，其余汉字照样渲染，但个别字（本片是「测」）会画成 `.notdef` **实心白方块**——字体文件本身含该字（fontTools 查 cmap 有、轮廓 62 点），是 canvas 字形缓存里拿到的是缺字位图。查法：看到某字变成整齐的白方块，先用 `fontTools` 确认字体有没有这个字，再判断是不是预热不足。**正解是把全片用字一次性预热**（从 cues 里抽 subs/bigs/signs/bubbles/stages/events 的所有字符，本片 459 字），并 `await document.fonts.ready`。救急办法是换字（本片把「测」换成「验」，关名「开棺实测」→「开棺定年」）。
4. **前景草 `FG` 高度决定角色可见性**：9–13 px 时人物只剩头露出，4–7 px 才看得出跑动姿态。

有旁白时的混音口径（上游是纯 chiptune，不含人声）：旁白裁到片长 → `loudnorm=I=-16` → chiptune `volume=-12dB` → `amix=inputs=2:duration=first:normalize=0` → 两遍法到 −14 LUFS；封装必须显式 `-map 0:v:0 -map 1:a:0`，否则会留下中间文件的旧音轨。

#### 六个固化工具（2026-10-29，这些事不再手打命令）

| 脚本 | 作用 | 判据 |
|---|---|---|
| `tools/splice_film.mjs` | 内容段 + 基座 → 渲染器；检查「被删函数仍被 `renderAt` 引用」这类语法查不出的运行期炸点 | 契约无缺口 + 语法通过；往返逐字节一致 |
| `tools/mix_voice.mjs` | 旁白 + 底乐混音（两遍法 loudnorm） | 响度偏差 ≤0.5 LU、真峰值不超目标 |
| `tools/check_sync.mjs` | 字幕 / 旁白同步（VAD + ASR 内容级） | 窗内有声均值 ≥80%、字符重合均值 ≥80%、弱条 ≤8% |
| `tools/check_events.mjs` | 检查点事件校验（2026-10-29 加）：撞踩怪 / 撞金币 / 屏幕重叠 / 事件数量 / 子场景切换点 | 无阻断；`--fix-coins` 可顺手删窗口内金币（先备份 `.bak`） |
| `demos/youxi/build_full.mjs` | 全片渲染器一键重建：`_content2` + `_full_new` 合并 → splice → 打时长补丁（`duration`、`NFULL-1` 钳制） | splice 契约无缺口 + 语法通过 + 两处补丁都命中 |
| `demos/youxi/patch_events_round2.mjs` | 全片检查点布点（幂等，可重复执行），含既有 cue 让位（踩怪/路牌/气泡挪时间） | 跑完必须接 `check_events --fix-coins` |

```bash
cd vendor/mg-styles-15
# ⓪ 改完内容段 / cues 之后的标准顺序
node demos/youxi/patch_events_round2.mjs
node tools/check_events.mjs demos/youxi/cues_game_full.json --fix-coins   # 清特写窗口内金币
node demos/youxi/build_full.mjs                                            # 重建 film_full_game.js

# ① 拼渲染器（首次 --base 指基座；之后指产物自身）
node tools/splice_film.mjs --base demos/youxi/film.js --content demos/youxi/_content2.js \
  --out demos/youxi/film2.js --cues demos/youxi/cues2.json
# ② 混音
node tools/mix_voice.mjs --voice "<配音.wav>" --bed demos/youxi/out/audio.wav \
  --out demos/youxi/out/mix_final.wav --dur 10
# ③ 字幕同步（必须带 --asr）
node tools/check_sync.mjs --cues demos/youxi/cues2.json --audio "<配音.wav>" \
  --asr "<配音.wav.transcript.simp.json>"
```

**VAD 单独不可信**：连续配音（停顿 <0.2 s）时任何 1–2 s 窗口都落在有声段，比例法时间轴偏差 p50 13.3 s 仍能过 VAD（实测 87.9% 通过）。必须带 `--asr` 做内容级比对；中文数字要先归一化才能比（字幕「二零一八」↔ ASR「2018」，不归一化会误报 4 条）。

**`splice` 的正确用法**：内容层之外的改动（保留区，例如 MID 层的岩壁开关 `CL0/CL1`）不会随内容段迁移，必须回填基座，否则下次重建会丢。首次 `--base` 指基座、之后指产物自身，往返可逐字节重建。

#### 检查点事件制（2026-10-29 第三关样片通过，全片标准）

跑酷段不能"一路只跑 + 捡币"，必须按口播内容布事件。事件全部写在 `cues_game_full.json` 的 `stages[k].events[]`，渲染器只读数据、不写死时间。

**两类事件**

| 类型 | 行为 | 数据结构 | 画面 |
|---|---|---|---|
| `minor` | **不停跑**，路过即触发 | `{t, kind:'minor', sign:'≤6字', obj:'mounds'}` | 路边语义物件画在 `heroXG(t)+42`，其上方 17 px 弹出文字卡（金边黑底），`t-0.2s` 出现、`t+1.4s` 消失 |
| `major` | **全屏特写**，主角停 1.3–1.6 s | `{t, kind:'major', dur:1.6, title:'≤6字', sub:'≤12字', obj:'office'}` | `t-0.5` 预备（主角 flinch 一惊）→ `t..t+dur` 特写 → `+0.5` 收势；`SEGS` 自动插入 `v=0` 段，闪白切入切出 |

**布点规则**
- 时长 ≥25 s 的关：4–6 个事件（minor : major ≈ 2:1）；12–25 s：2–3 个；**<6 s 的过渡关不设事件**，靠远景生长（`farTomb` 迎面变大）+ 路牌承担。
- 每 6–8 s 至少 1 个事件；两个 major 之间必须留 ≥2.5 s 跑动。
- 事件 `t` 必须落在**字幕句首 0.1–0.35 s 后**（念到那句才触发），不要落在句中。
- 每关再配 2–3 套子场景：`scenes:['village','office','graves'] + sceneSwitch:[32.05,41.5]`（`sceneSwitch[i]` 是切到 `scenes[i+1]` 的时刻）。远景层按场景换装，地面材质跟着换（`groundStone` / `groundDeck` / `drawGround`）。

**四条硬约束（`tools/check_events.mjs` 自动查，不过不许渲）**
1. major 窗口 `[t-0.6, t+dur+0.6]` 内**不得有 stomps**（踩怪要跑动，停下跳会变成原地蹦）；`±2.0 s` 内不得有 signs，`±1.5 s` 内不得有 bubbles（都被特写盖住，白丢一次 cue）。
2. **窗口内的金币必须从 `cues.coins` 删掉**。金币音效与画面同源，特写把它盖住 → 观众听见叮的一声却什么都没捡到。删完检查该关金币最大空档 ≤2.4 s，超了就补一枚在窗口外。
3. minor 与 signs / bubbles / 另一个 minor 的时间差 ≥2.2 s（都画在 `hero+42~54` 同一片区域，叠加就是一团糊）。
4. 特写内部**必须自带动效**：浮尘 6 颗（22 px 扫光带 `(f*7)%(W+80)`）。1.3 s 静止画面直接踩密度红线（实测 1.30 s 那段只有 6 px 位移，密度 0.4%）。

**文字入框**：`text()` 的 `y` 是**基线**（字形画在 `y-12..y`），居中要 `base = 框顶 + (框高-12)/2 + 12`；横向用 `textW(str,'Fusion Pixel 12',12)` 算宽，框宽 = `tw+10~12`。写死坐标必溢出（第三关首版匾额、路牌全踩过）。

**新增特写 / 物件时的落点**
- 新特写分支加在 `drawCloseup` 的 `if (m.obj===...)` 链里，物件超过 3 个就抽函数；
- 新路边物件加在 `drawMinorObj`，只用**固定 `M(i)`**（环境槽 `E.*` 随调色变色，`E.dD` 只剩土色系可用）；
- 新子场景远景加在 `zoneBG`，道具世界坐标必须落在 `[cx·pf, cx·pf+320]` 内（`cx` 最大约 8500），拍脑袋写 7000/5600 会让大鸟居永远在屏外。

### 素材库

> **素材源根目录（2026-10-25 迁移后）：`D:/@kaifa/yandi/output/`**。各集初始素材（口播稿/配音/角色图/背景图/素材包）全部在此。注意与成片交付目录 `D:/@kaifa/yandi/out/`（项目根下）区分，不要混用。

- `output/007_炎帝/素材_像素Q版_v1/`：22 张 1254² RGBA（人物 7 + 道具 15），粗像素 Q 版
- `output/007_炎帝/素材_精致逼真_v1/成品图/`：米饭/白菜/萝卜/猪肉/神农架野人/修仙道士（1024² RGBA 实拍风）
- `output/006_女娲/`：nuwa_front/side/back.png + `女娲故事常用素材_透明PNG_v1/`（17 张）
- `output/006_女娲/背景图_v1/bg10_layeredpeaks.png`：全片统一背景
- `output/001_波斯湾伊甸园_口播稿+配音/`：口播稿 + 配音.wav（271.96s）+ 配音.transcript.json（ASR 词级，1473 词，繁体）

---

## 十一、新一集开工清单（以帝辛为例）

1. 读 `output/008_帝辛/` 口播稿 + 配音.json（键名 chunks；打印 chunk 间隙审计）
2. 出《段落分配表》交用户确认（概念段/故事段/名场面）
3. 素材：ImageGen 生成（图生图；透明底走 chroma2rgba 工具链）；缺失形象由我方生成
4. 背景：bg10 + 运镜（守 3.3/3.4）
5. 30 秒样片 + 逐幕核验 + 四查 → 用户确认（接点 ≤0.25s）
6. 全片分镜（吸附停顿点）→ qc → audit 四查 → 捕获 → 音效+BGM → 复测 → 封装
7. 封面（ImageGen + tushuo 口径 + delogo）→ 发布信息（5 选 1）→ 目录整理（顶层 4 项）

---

## 十二、终版自检命令速查（复制即用）

```bash
cd D:/@kaifa/yandi/yandi-video/render/piying
node gen_full_yandi.js            # 分镜（含 chunk 间隙与过短镜审计）
node qc_full_yandi.js | grep -E "文字覆盖率|同屏运动|2秒|纯文字|FAIL"
node audit_yandi.js full          # 四查门禁（exit≠0 禁止封装）
node capture_full_yandi.js        # 捕获（串行，勿与编码并发）
node make_sfx_full_yandi.js       # 音效混音
# BGM 七步见第七节；封装必须 -map 0:v:0 -map 1:a:0
ffmpeg -i 成片.mp4 -af ebur128=peak=true -f null -   # 复测 ≈-16.0 LUFS
node delivery_gate_yandi.js       # 交付总门禁：四查(full+sample)+密度+响度+目录合规，exit≠0 禁止交付
```

xiangsu 线（像素风）：

```bash
cd D:/@kaifa/yandi/vendor/mg-styles-15
node tools/sheet.mjs out/sheet.png 6                          # sprite 表：0 告警
node tools/density.mjs demos/xiangsu/out/video640.mp4         # 密度：逐窗口 + 最长无变化段
ffmpeg -hide_banner -nostats -i demos/xiangsu/out/video640.mp4 -af loudnorm=print_format=summary -f null -
ffmpeg -hide_banner -nostats -i demos/xiangsu/out/video640.mp4 -vf blackdetect=d=0.05:pix_th=0.10 -f null -
```

---

## 十三、项目清理与归档（每集交付后必做）

### 13.1 一键清理

```bash
cd yandi-video/render/piying
node clean_workspace.js            # dry-run：列出将删内容与可释放空间
node clean_workspace.js --apply    # 实际删除
```

### 13.2 可删（全部可重跑再生）

| 类别 | 说明 | 再生成本 |
|---|---|---|
| `frames*/` 帧目录 | 女娲 12816 + 炎帝 11565 + 样片 2657 + 旧管线 11607 | 12-15 min/片 |
| `probe*/` `qc/` | 探针/抽帧 jpg | 1-2 min |
| `render/*/*_draft*.mp4` | 草稿成片（每片 130-160MB） | 3 min |
| `render/*/` 中间 wav | pre_ / full_mix / mix_with_bgm / bgm_track / final_mix / sample_ / a_seg / b_seg / gap | 3-5 min |
| `audio/*.wav` | 旧管线中间音频（68MB 级） | — |

实测一次清理释放 **6.7GB**（38,700 帧图 + 31 个中间文件 + 80 张探针帧）。

### 13.3 必须保留

- 全部 `.js / .html / .json / .txt`：管线脚本、分镜数据（`*_sb.js/json`）、`sil_full.txt`、`qc_report*.json`（核验凭证，约 2.4MB）
- `out/` 交付物；已发布成片归档到 `out/@已发/<序号> <标题>/`
- `node_modules/`（运行依赖）、`docs/`、README
- 素材源与配音（在项目根 `006_女娲/ 007_炎帝/ 008_帝辛/`，不在 yandi-video 内，勿动）

### 13.4 下一集开工前检查

```bash
node health_check.js   # 管线健康检查：脚本引用的资产/配音是否齐全
```

- 检查范围：render 下全部 js/html 的外部引用（output/00X_…）+ 关键输入清单；缺失项会逐条列出
- 素材源目录统一在 `D:/@kaifa/yandi/output/00X_<集名>/`（006_女娲 / 007_炎帝 / 008_帝辛），脚本一律用该前缀，勿写项目根相对路径

1. 工作区已用 `clean_workspace.js` 清干净（无 `frames*` 残留）
2. 输入齐备：`<集目录>/口播稿.md` + `配音.json`（键名 chunks）+ `配音.wav` + `narration-chunks/*.tight.wav`
3. 复制 `render/piying/` 为模板，改 SB 路径与素材目录即可复用（TYPE_CFG 通用引擎 + 10 剪影变体 + 运镜）
