---
name: yandi-video-spec
description: 炎帝/女娲系列历史神话口播视频的成片规格与生产流程（Playwright + Canvas 逐帧渲染 + ffmpeg 合成）。当需要制作或返工该系列任意一集（女娲 427.2s 已定稿、炎帝 385.5s 已定稿、帝辛待做）、查询成片参数、做密度/门禁验收、调整字幕构图背景运镜、生成双封面与发布信息、混 BGM、或整理交付目录时使用。触发词：女娲、炎帝、帝辛、成片参数、密度核验、门禁、封面、发布信息、BGM、交付目录。
---

# 炎帝/女娲系列 · 成片规格与生产流程（两集定版）

两集均已按本规格定稿交付：**女娲 427.2s（nuwa 线）**、**炎帝 385.5s（yandi 线）**。本文件是**硬规格**：参数、阈值、路径、口径不得凭经验改；返工先读第九节避坑清单。

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
| 炎帝 | 385.5s | 11565 | 164.5MB | 8 段 / 98 镜 / 320 字幕 / 163 事件 | `render/yandi/` |

---

## 二、内容规范（验收硬指标）

### 2.1 密度三指标（同时满足，全帧仪表采集，非抽样）

1. **文字面积 ≤ 30%**（女娲 max 19.59%，炎帝 max 23.02%，均值 6-8%）
2. **同屏运动元素 ≥ 5**（女娲 min 6，炎帝 min 7，均值 11-13）
3. **每 2 秒至少 1 个新动效点**（两集均全窗口覆盖）
4. 纯文字画面（章节标题/片头片尾/金句）豁免，合计 **≤20% 时长**（女娲 11.5%，炎帝 3.3%）

核验脚本：`qc_full.js`（女娲）/ `qc_full_yandi.js`（炎帝）。渲染页内嵌仪表：`QC.moving` / `QC.acts` / `QC.textRects` / `QC.subRect` / `QC.fgRects`。

- 5% 透明度装饰大字**不得计入 textRects**（否则文字覆盖率虚高）
- 卡片与精灵已接入 `QC.fgRects`，参与越界审查

### 2.2 手机可读性（与密度同级）

视频主要手机端观看：标签文字 ≥60px、内容文字 ≥64px、角色/关键图形 ≥170px 高、单镜主要元素 ≤5 个。禁止"一小排+小字"桌面构图。

### 2.3 构图

- **人物默认居中于画面中线**；例外：三人横排（第一幕）、VS 对峙以中线为轴对称
- 场景元素底部避让 **918px** 红线（字幕区 924-1024），卡片/文字/chips 底边 ≤918

### 2.4 字幕

炎帝样式：深色通栏底（alpha 0.62）+ 金色左边条 + 白字黑描边 + 64px；关键词金色高亮（逐字检测，词库 `ACC_KEYS`）。时间轴**必须**来自音频停顿检测：`silencedetect=noise=-35dB:d=0.06`，短语按标点切分后向停顿点吸附（±1.2s），合并 <0.3s 碎句。

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

`render/nuwa/cover_nuwa_v2.js`：Canvas 合成（bg10 aspect-fill + 主角 + STXingkai 金色渐变标题）。系统书法字体：`STXINGKA`(行楷) / `STXKAITI` / `STXLITI`(隶书) / `STXINWEI`(新魏) / `FZSTK`。

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

### 6.1 炎帝线（`render/yandi/`，最新，推荐作为后续剧集模板）

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

### 6.2 女娲线（`render/nuwa/`，历史定稿）

`gen_full.js` → `page_full_nuwa.html` → `probe_targets.js`（探针）→ `scan_empty.js`（空画面扫描）→ `capture_full_nuwa.js` → `make_sfx_full.js` → BGM → 封装 → `qc_full.js`（8 段汇总）。

### 6.3 样片（30 秒密度验证，两线同法）

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

```
out/<序号> <标题>/
├── <名称>_全片.mp4      # 含 BGM 成片
├── cover_4x3.png        # 1440×1080
├── cover_3x4.png        # 1080×1440
├── 发布信息.txt          # 5 选 1 + 推荐 + 话题
└── 源文件/              # 样片、核验报告、旧版成片等全部其余文件
```

**顶层只允许 4 项**；序号从 1 递增；女娲=out/2，炎帝=out/1。

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

---

## 十、脚本清单

### `render/yandi/`（炎帝线 · 后续剧集模板）
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

### `render/nuwa/`（女娲线）
```
gen_full.js / page_full_nuwa.html / capture_full_nuwa.js / make_sfx_full.js
qc_full.js / probe_full.js / probe_targets.js / scan_empty.js
gen_backgrounds.js / render_bgtest.js / cover_nuwa_v2.js / rgb2rgba.js
gen_sample.js / page_nuwa.html（历史留档）
```

### 素材库

> **素材源根目录（2026-10-25 迁移后）：`D:/@kaifa/yandi/output/`**。三集初始素材（口播稿/配音/角色图/背景图/素材包）全部在此，项目根下已无 `006_女娲`、`007_炎帝`、`008_帝辛` 目录。注意与成片交付目录 `yandi-video/out/` 区分，不要混用。

- `output/007_炎帝/素材_像素Q版_v1/`：22 张 1254² RGBA（人物 7 + 道具 15），粗像素 Q 版
- `output/007_炎帝/素材_精致逼真_v1/成品图/`：米饭/白菜/萝卜/猪肉/神农架野人/修仙道士（1024² RGBA 实拍风）
- `output/006_女娲/`：nuwa_front/side/back.png + `女娲故事常用素材_透明PNG_v1/`（17 张）
- `output/006_女娲/背景图_v1/bg10_layeredpeaks.png`：全片统一背景

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
cd D:/@kaifa/yandi/yandi-video/render/yandi
node gen_full_yandi.js            # 分镜（含 chunk 间隙与过短镜审计）
node qc_full_yandi.js | grep -E "文字覆盖率|同屏运动|2秒|纯文字|FAIL"
node audit_yandi.js full          # 四查门禁（exit≠0 禁止封装）
node capture_full_yandi.js        # 捕获（串行，勿与编码并发）
node make_sfx_full_yandi.js       # 音效混音
# BGM 七步见第七节；封装必须 -map 0:v:0 -map 1:a:0
ffmpeg -i 成片.mp4 -af ebur128=peak=true -f null -   # 复测 ≈-16.0 LUFS
node delivery_gate_yandi.js       # 交付总门禁：四查(full+sample)+密度+响度+目录合规，exit≠0 禁止交付
```
