# 项目长期记忆（yandi）

> **权威规格**：`.workbuddy/skills/yandi-video-spec/SKILL.md`（13 章两集定版）+ `yandi-video/README.md`（成片清单/参数/段落结构）。冲突以技能文件为准。
> **定版状态**：女娲 427.2s（`render/nuwa/`，-16.0 LUFS）｜炎帝 385.5s（`render/piying/`，98镜/163音效/-16.1 LUFS，五轮整改后四查全过）｜帝辛待开工（口播稿钩子已改为悬疑版"妲己到底长什么样"）。
> **交付硬门禁**：密度三指标 + 四查（`audit_yandi.js`：类型覆盖/字幕越界/空渲染/坏文本）+ 响度复测，缺一不可交付。

## 目录约定
- **素材源**：`output/{006_女娲,007_炎帝,008_帝辛}/`（旧根目录 00X_ 已不存在）；**成片交付**：`yandi-video/out/<序号> <标题>/`，顶层只允许 4 项（全片mp4 / cover_4x3 / cover_3x4 / 发布信息.txt），其余进 `源文件/`。
- 脚本引用已全量改 output/ 前缀（2026-10-25）；回滚备份 `.workbuddy/backup/render_pathfix_20261025_1948/`。
- 管线命名：新管线用风格拼音代号（xiangsu=像素风）；炎帝管线代号 **piying**（皮影/剪影卡片风，2026-10-29 用户命名，目录已由 render/piying 改为 render/piying，脚本文件名保留 _yandi 后缀不动）。工作区根路径 `D:/@kaifa/yandi/` 本身不改。

## 用户偏好（视频类，最高优先级）
- **密度三指标**：文字面积≤30%｜每2秒≥1新动效｜同屏运动≥5；纯文字画面豁免≤20%时长。
- **手机可读**：标签≥60px、内容≥64px、关键图形≥170px高、单镜元素≤5。
- 转场温和，禁扫屏/闪白（返工两次的教训）；字幕无标点一次一句、炎帝底部条样式+关键词金色高亮、避让 924px 线。
- 概念段=图标卡片（平涂），故事段=剪影/皮影场景，名场面强制剪影大场面；背景四层+一套主色系+段落点缀色。
- 缺素材用 ImageGen 图生图（image1=参考图+input_fidelity=high）；输出 rgb24 必须 rgb2rgba.js 转 RGBA（CRC 大端，禁二次转换）。
- 验收流程：先 30s 密度样片+逐幕量化报告 → 达标才全量；每片配 4:3+3:4 双封面（ImageGen+tushuo 口径+delogo）+标题5选1+4标签。

## BGM 混音七步（详见 SKILL；项目侧已固化 `tools/mix_voice.mjs` 代手打）
选曲 `D:/@kaifa/@/BGM/`（15 分类）→ 测人声 LUFS → BGM 循环+highpass/volume 低人声约 19dB → amix normalize=0 → loudnorm 两遍法 -16 LUFS/-1.5 dBTP → 封装**必须显式 -map** → 成片复测 ≈-16.0 LUFS。

## 克隆配音（GPT-SoVITS v5turbo）
- `vendor/gpt-sovits`（带 .git 可 pull）；入口 `tools/tts.cmd`；配置 `voices/dabao/preset.json` + `tts_infer.yaml` custom 块。
- v5turbo 语速 6.68 字/秒（旧 v3 约 4.8），保原节奏需 speed_factor≈0.72；seed -1 非确定；92 条全局+分幕读音纠错。
- **读音冲突待用户裁定**：项目侧与服务端 4 条同源不同目标（单于/阏氏/降将/降卒）。
- v3 全量备份 `vendor/_gpt-sovits_v3_backup`，v5 稳定后可删。

## sprite 表使用边界（SKILL 2.9，硬规则）
只给"逐帧变性"元素做帧表（骚动/机械臂/棺开/情绪微动作）；静态元素单张图；位置变化用整像素位移+stepEase，不做 tween；拆件=静态主体单图+动态部件帧表。

## xiangsu 管线（像素风，2026-10-28 用户命名）
- 代码在 `vendor/mg-styles-15/demos/xiangsu/`（必须留 harness 仓内）；项目侧入口 `yandi-video/render/xiangsu/README.md`。
- **硬规格**：1920×1080、栅格 640×360（×3 最近邻）、30fps、H.264 CRF14、-16 LUFS/-1.5 dBTP；栅格（W/H）与成片（window.DEMO）两常量分开控制。
- sprite 四铁律：CHR '.':-1 与 k:0 必须分开；关节链 L1/L2= sprite 实长；旋转矩形相接用 boss() 铰点盘；液压缸吸附臂上下缘。
- 颜色映射：机械 MAP_MACH、石材铜活 MAP_STONE、纯色人物 MAP_PAL；受光弧以光源方向为中心（atan2）。
- 量化工具（勿手打）：密度 `vendor/mg-styles-15/tools/density.mjs`、sprite 自查 `sheet.mjs`（0 告警才过）、字幕同步 `tools/check_sync.mjs` **必带 --asr**（VAD 单独不可信：比例法偏差 p50 13.3s 仍能过 VAD；词级字符重合 90.1% 才可信）。
- 已交付 `out/6 仁德天皇陵/`。

## 20-pixel 支线（rinoku20，上游标准）
- 复刻=整目录换皮不重写；中文 logo 用上游 `buildLogo5`（须在 C5 声明后调用，否则 TDZ）；勿为中文 logo 开 V5（会多画圆球道具）。
- 上游口径 **-14 LUFS**（本项目其他片 -16，别混）；Windows 跑 WebGL 必须 `MG_GPU_ARGS="--use-angle=d3d11 --no-sandbox"`（默认 Linux EGL 会 NetworkError）。
- `Press Start 2P` 字体不在仓库，已把该字族指向 Fusion Pixel 12 拉丁子集。
- **renderAt 是整帧采样**：zoom 会把字幕放大成巨字；推镜需 UI 层挪到放大后画，否则放弃 zoom 用主体画大补偿。
- 12px 点阵限制：0/8 难分（日期写中文）、印章内只塞单字、前景草 4-7px 才看得出人物跑动。
- 内容层之外的改动（如 MID 层岩壁开关 CL0/CL1）不随内容段迁移，必须回填基座。
- 固化脚本：`splice_film.mjs`（内容段+基座拼接，含契约检查）、`mix_voice.mjs`、`check_sync.mjs`（中文数字先归一化）。
