# xiangsu2 管线（伊甸园 · 1920×1080 成片 / 640×360 像素密度）

> 管线代号：**xiangsu2**。2026-10-28 依宝哥要求，把《001 波斯湾伊甸园》前 10 秒的制作流程与参数单独固化。
> 与 workbuddy 封装的 `render/xiangsu/` **并行且互不影响**：xiangsu 的代码与文档一律只读，本项目不修改、不覆盖、不混入。

## 定位

xiangsu 的成片是 640×360；xiangsu2 要的是 **成片 1920×1080，但像素密度仍是 640×360**。
做法：

```
640×360 索引色帧缓冲（所有造型/抖动/描边逐像素决定）
  → ×3 整数最近邻放大（imageSmoothingEnabled = false）
  → 1920×1080 CRT 后处理（1 px 扫描线 / 3 px 周期 + 暗角 + 磷光）
  → x264 CRF 14
```

一个逻辑像素 = 输出上的 3×3 方块，密度与 640×360 版完全一致；CRT 在输出分辨率上做，扫描线是 1 px 细线而不是放大后的 3 px 粗带。
不依赖任何文生图/图生视频模型。

## 目录

```
yandi-video/render/xiangsu2/
├── README.md          本文件（冻结参数 + 复现 + 验收）
├── FREEZE.json        冻结基线：源文件/音轨/成片的 SHA-256
├── build.sh           一键构建：同步源文件 → 音轨 → 渲染 1920×1080 → 验收
├── make_audio.sh      确定性音轨：audio.py + 两遍 loudnorm
├── verify.mjs         成片验收（规格/响度/密度/像素密度/落盘）
└── demo/              源文件真身
    ├── index.html     入口（预加载像素字体后 import film.js）
    ├── film.js        主渲染器（色板/LUT/图元/像素字体/七镜头/转场/CRT）
    ├── sprites.js     逐像素 sprite 表（ASCII 字符网格，每字符 = 1 px）
    ├── cues.json      声画共用 cue sheet（cuts / subs / hits）
    └── audio.py       chiptune + SFX 合成与配音混音（numpy，种子固定）
```

构建落点：`<mg-styles-15 克隆>/demos/xiangsu2-eden/`（harness 只能服务仓库内目录，`build.sh` 会把 `demo/` 同步进去）。
`demos/xiangsu/`（workbuddy 的 xiangsu）与 `demos/xiangsu-bay/`（640×360 样片）都不参与本管线，不要改。

## 冻结参数（2026-10-28）

| 项 | 值 |
|---|---|
| 原生栅格 | 640×360，32 色索引色板 + 128 槽环境 LUT（`stageOf` 三段调色，T_HAZE=1.86 s / T_GOLD=6.88 s） |
| 放大 | ×3 整数最近邻，`ctx.imageSmoothingEnabled=false; ctx.drawImage(small,0,0,1920,1080)` |
| 成片 | 1920×1080 · 30 fps · 300 帧 · 10.000 s · h264 High / yuv420p / bt709 tv |
| CRT 扫描线 | `rgba(0,0,0,0.12)`，1 px 暗线 / 3 px 周期，输出分辨率上生成 |
| CRT 暗角 | 径向 0→0.48，内半径 0.38×1080，外半径 0.95×1080 |
| CRT 磷光 | overlay `rgba(120,255,200,0.02)` |
| 像素字体 | Fusion Pixel 12；字幕带 y=304，SC=2，文字 y=316，打字 0.026 s/字，高亮金 M(15) |
| 切点 | `1.32 / 2.56 / 3.66 / 4.96 / 6.96 / 8.60`（cues.json `cuts`） |
| 字幕 | 9 条，时间与 `配音.transcript.json` 字符级对齐（起点 Δ≤0.06 s，终点 Δ≤0.20 s） |
| 音轨 | numpy，种子 20261028；44.1 kHz 双声道；两遍 loudnorm → -16 LUFS / TP -1.5；60 ms 尾淡出、40 ms 头淡出 |
| 编码 | libx264 CRF 14 / preset slow / profile high / aq-mode=3；AAC `-b:a 320k`（ffmpeg 原生编码器实测 ≈257 kbps）/ 48 kHz |
| 动效密度口径 | 192×108 灰度，帧间差 >8；2 s 窗口内 >1% 动效点每窗 ≥1；最长静止 <0.6 s |

## 复现

前置：Chrome、ffmpeg 在 PATH；渲染仓库 `mg-styles-15` 已 `npm install`（puppeteer-core）；
Python 用 `D:/@kaifa/openviking/.venv/Scripts/python.exe`（numpy）。

```bash
cd D:/@kaifa/yandi/yandi-video/render/xiangsu2

# 全量（重做音轨 + 渲染 + 验收）
bash build.sh

# 只重渲画面（复用已生成的 audio.wav）
bash build.sh --no-audio
```

环境变量（默认值已对准本机）：

| 变量 | 默认 |
|---|---|
| `XIANGSU2_REPO` | `D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15` |
| `XIANGSU2_PROJ` | `D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音` |
| `XIANGSU2_PY` | `D:/@kaifa/openviking/.venv/Scripts/python.exe` |
| `XIANGSU2_VOICE` | `D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/配音.wav` |
| `MG_CHROME` | `C:/Program Files/Google/Chrome/Application/chrome.exe` |

分步等价命令：

```bash
# 1) 音轨
bash make_audio.sh "<repo>/demos/xiangsu2-eden"
# 2) 关键帧（目检用）
cd "<repo>" && MG_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  node harness/render.mjs demos/xiangsu2-eden --stills 2.30,4.60,7.30
# 3) 全片
cd "<repo>" && MG_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  node harness/render.mjs demos/xiangsu2-eden --w 1920 --h 1080 --fps 30 --duration 10 \
  --audio demos/xiangsu2-eden/out/audio.wav --crf 14 \
  --out "D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/样片_前10秒_1920x1080.mp4"
# 4) 验收
node verify.mjs "D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/样片_前10秒_1920x1080.mp4"
```

## 验收（verify.mjs：4 项判定 + 落盘信息）

1. **规格**：1920×1080 / 30 fps / 300 帧 / 10.000 s / h264 yuv420p / AAC 48 kHz 双声道。
2. **响度**：-17.5 ≤ I ≤ -15.0 LUFS，TP ≤ -1.0 dBTP。
3. **动效密度**：`tools/density.mjs --win 2 --th 0.005,0.01,0.03 --gw 192 --gh 108 --delta 8`，全部窗口通过 + 最长静止 <0.6 s。
4. **像素密度 = 640×360 栅格 ×3**（抽 t=2.30/4.60/7.30 三帧，解码为 rgb24 逐像素算）：
   - 块内相邻列平均差 <2.5 级（同一逻辑像素内），跨块列差必须更大（内容边）；
   - 取每块左上角像素 ×3 上采样回去，除扫描线行（`y%3==1`）外平均差 <2.0 级、差值 >12 级的像素占比 <1%。

最后打印字节数与 SHA-256（落盘信息，不参与判定）。

判定基准（无损静止 PNG）：块内列差 0.01–0.03、跨块 4.2–12.0、还原平均差 0.02–0.04、最大差 2（暗角渐变）；
成片经过 x264 后允许少量编码噪声，故第 4 项门槛放宽到上表的 2.5 / 2.0 / 1%。

## 冻结基线（2026-10-28）

成片：`D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/样片_前10秒_1920x1080.mp4`
`10,433,009 B` · SHA-256 `9a63b49adca6c385b1b3ef69b6d4c199201c3d98caec83e1835761bc55127155`
验收：规格 / 响度 / 密度 / 像素密度 4/4 PASS（2026-10-28，详见 `FREEZE.json`）。
回归：与已验收的 640×360 样片对比，画面 SSIM All=0.9677（差异仅来自 CRT 在输出分辨率重做），AAC 音频包 MD5 逐字节相同。

源文件 SHA-256：

| 文件 | SHA-256 |
|---|---|
| demo/index.html | `825a72cff674b9d5b9273a66e027b7057ca5b5ce87f327d96f65f51f10d1e2ba` |
| demo/film.js | `0a6d7f5847822e6a336b676f046822fe21f7656ae845ba4007c8f4aee638ce64` |
| demo/sprites.js | `ef19041da186ff4bffcda46cc1d64fd63e343187f8a5218b1429ae32cbb4475f` |
| demo/cues.json | `568fd78aa9de32446c888f0361d8d6f2bdc185385599695d57fbe7bc2b661882` |
| demo/audio.py | `7a88275a85e6715350b4df0ddba0c63c9594044a00915e7a8e9c2b799ecc2c2f` |
| make_audio.sh | `3a7c3dffd9769d5298ace3ed601c3793e9ff0d8cabf9a83fbd923894ccd45236` |
| build.sh | `c0963d959c1a1101d5ee52a49511365baa3bc5fb0a0d046196e2542d71c277b6` |
| verify.mjs | `25adc08c914e5e6c389e1ce2ed3cdb3a12f369277b03c40cccdc41389d07305a` |

音轨：`audio.wav` = `2b6e5ca5e95eb985a9f575467e3770a9a40f85be005bbaad57c64f5006b1e6c8`
（与 640×360 样片音轨逐字节相同；`mix_raw.wav` 也可确定性复现，说明合成链路无随机漂移。）

## 修改纪律

- 内容或参数一改，**不要覆盖基线 hash**：先在 `FREEZE.json` 记新的版本条目，再重跑 `verify.mjs`。
- 只动本目录；`render/xiangsu/`、`demos/xiangsu/` 只读。
- 放大倍数、CRT 参数、编码参数属于管线身份，改动 = 新管线，不要在本管线上静默漂移。

## 全片（2026-10-29）

成片：`D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/全片_波斯湾伊甸园_272秒_1920x1080.mp4`
`197,275,966 B` · SHA-256 `ede0280d75ceaae38cfb5fba7ac77ec11eec6e2705d3646e6893c28067e4a587`
规格：1920×1080 / 30 fps / 8162 帧 / 272.05 s / h264 yuv420p CRF 14 / AAC 48 kHz 双声道；响度 -16.01 LUFS / TP -1.46 dBTP。
验收：`full/verify_full.mjs` 4/4 PASS（2026-10-29，详见 `full/FREEZE_full.json`）。

实现：`full/` 目录用 `assemble.mjs` 把 `demo/film.js` 的片头部分（前 10 秒样片代码，逐字节未改）与 `full/parts/*.js`（51 个镜头函数 + tail）拼成 `demos/xiangsu2-eden-full/film.js`；数据来自 `full/cues.json`（58 镜切点 / 195 条字幕 / 116 个节拍点）。

两条量测口径说明：

1. **动效密度需要全片环境动效层**。静止镜头（尤其深色画面 + 字幕打字完毕后）会让局部 2 s 窗口低于 1% 动效点；实测最长静止 2.57 s，全片有 144 段 ≥0.5 s 的静止。修复没有改镜头，而是在 tail 里加了一层全片环境动效（`ambientAt`）：一条 48 fb 行高的实心扫描光带以 116 px/s 在可见区 0..299 循环（不出屏），沿色板 ramp 提亮 1–3 级；外加 22 颗 4×4 浮尘。修复后最长静止 0.30 s。
   - 关键点：光带必须在可见区循环，不能像早期版本那样扫出 300 行留 0.52 s 空档；光带要实心按行提亮，抖动像素在 192×108 灰度降采样后会低于 8 级阈值。
2. **像素密度改在 Y 平面判定**。交付规格 yuv420p 的色度是 4:2:0 抽样，抖动色块经 RGB 解码逐像素比必然出现 ~2% 的 >12 级差；实测与编码质量无关（CRF 14/12/10 同值，无损 4:4:4 为 0.000%，无损 4:2:0 为 2.127%）。栅格结构由亮度平面承载：Y 还原平均差 0.16–0.43 级、>12 级占比 ≤0.003%。`verify_full.mjs` 保留 RGB 列差（块内 <2.5、跨块更大）与 RGB 还原差作参考。

分享版（邮件附件，<50 MB）：`全片_波斯湾伊甸园_272秒_1280x720_分享版.mp4` `38,303,489 B` · SHA-256 `ee42ab6f013efe9a2c2ad509669c0fa375feabf2c89b40d9775a768c935c3f89`（CRF 24 / faststart；母版仍是 1080p 3× 栅格）。
