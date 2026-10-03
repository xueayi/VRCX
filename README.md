<div align="center">

# <img src="https://raw.githubusercontent.com/vrcx-team/VRCX/master/images/VRCX.ico" width="64" height="64"> </img> VRCX (community fork)

[![GitHub release](https://img.shields.io/github/release/xueayi/VRCX.svg)](https://github.com/xueayi/VRCX/releases/latest)
[![Upstream](https://img.shields.io/badge/upstream-vrcx--team%2FVRCX-6451f1)](https://github.com/vrcx-team/VRCX)
[![GitHub Workflow Status](https://github.com/xueayi/VRCX/actions/workflows/github_actions.yml/badge.svg)](https://github.com/xueayi/VRCX/actions/workflows/github_actions.yml)

</div>

> [!IMPORTANT]
> **English** | [简体中文](#简体中文)

This repository is a **community fork of [vrcx-team/VRCX](https://github.com/vrcx-team/VRCX)**, maintained by [xueayi](https://github.com/xueayi). VRCX itself is an assistant/companion application for VRChat — for the full feature list, official documentation (wiki), screenshots and the upstream project, see the **[upstream README](https://github.com/vrcx-team/VRCX#readme)**. That documentation is not duplicated here.

## What this fork changes

All changes are on top of upstream `master` (currently based on `2026.09.16`):

### Fixed — Linux/macOS memory leaks and crashes

- **`LogWatcher`**: game-log buffer grew unbounded for the whole session (tens of MB/day); now drained incrementally and capped.
- **VR overlay queue**: unbounded state-snapshot queue when the overlay window is absent or stalled (macOS can never have one) — previously up to GB/day (upstream issue #1660 class); now coalesced per function and hard-capped.
- **`SetupTextures()`**: unhandled exception on the overlay thread killed the whole process (macOS + SteamVR); now caught and retried with backoff.
- **Renderer stores**: notification table, `seenIds`, photon event tables and gallery queue timers now bounded / always cleaned up.
- **Electron main**: overlay frames written straight to shared memory via a seqlock (removes a ~6 MB copy per frame at 48 fps), shm error log throttled, `/dev/shm` file no longer orphaned on in-app restart.
- **GameHandler**: macOS native `VRChat` process detection (was `VRChat.exe` only — game state never detected on macOS), throttled full process-table scans, WiVRN scan skipped on macOS.
- **`ScreenshotHelper`**: metadata cache bounded.

### Fixed — macOS arm64 packaging

- `System.Data.SQLite` switched to the 2.x line on `osx-arm64` (1.x ships no arm64 native library → app crashed on startup with `Unable to load shared library 'SQLite.Interop.dll'`).
- `patch-node-api-dotnet.js` now handles the macOS `.app` bundle layout (the .NET host path patch was silently skipped → .NET failed to initialize).

### Added

- **Automated releases**: pushing a `v*` tag runs the full multi-platform build on GitHub Actions and publishes a GitHub Release automatically (including the macOS Gatekeeper bypass instructions — these builds are unsigned, see the release notes).
- In-app links (GitHub button, changelog dialog, About section in Settings) point to this fork; upstream attribution kept everywhere.

### Not changed

- All upstream features, settings and behavior. Nothing is removed relative to upstream `2026.09.16`.

## Downloads

Grab the latest build from [Releases](https://github.com/xueayi/VRCX/releases/latest):

| File | Platform |
|---|---|
| `VRCX_*_arm64.dmg` | macOS Apple Silicon (M1/M2/M3/M4) |
| `VRCX_*_x64.dmg` | macOS Intel |
| `VRCX_*_Setup.exe` / `VRCX_*.zip` | Windows |
| `VRCX_*_arm64/x64.AppImage` | Linux |

**macOS first launch (unsigned build)**: Gatekeeper will report *"VRCX is damaged and can't be opened"*. Move VRCX to `/Applications`, then run once:

```bash
xattr -cr /Applications/VRCX.app
```

(or System Settings → Privacy & Security → Open Anyway).

## Building from source

```bash
npm ci                 # Node.js >= 24.15
npm run prod           # build renderer (build/html)
npm run build-electron-arm64   # or build-electron (x64) — macOS
# Linux: build-electron-arm64 / build-electron inside the repo (AppImage)
```

The .NET backend (net10.0) is built and bundled automatically by the electron-builder scripts. Pushing a `v*` tag to GitHub runs the same pipeline for all platforms and publishes a release.

## License

MIT — same as upstream. All credit for VRCX goes to the upstream authors ([pypy](https://github.com/pypy-vrc), [Natsumi-sama](https://github.com/Natsumi-sama), [Map1en](https://github.com/Map1en) and [contributors](https://github.com/vrcx-team/VRCX/graphs/contributors)).

---

<div align="center">

# 简体中文

</div>

> [!IMPORTANT]
> 本仓库是 **[vrcx-team/VRCX](https://github.com/vrcx-team/VRCX)** 的社区 fork，由 [xueayi](https://github.com/xueayi) 维护。VRCX 是 VRChat 的辅助应用 —— 完整功能列表、官方文档（Wiki）与上游项目请见 **[上游 README](https://github.com/vrcx-team/VRCX#readme)**，此处不再重复上游说明。

## 本 fork 的改动

基于上游 `master`（当前 `2026.09.16`）：

### 修复 — Linux/macOS 内存泄漏与崩溃

- **`LogWatcher`**：游戏日志缓冲区整个会话只增不减（每天数十 MB），现改为增量排水并设上限。
- **VR overlay 队列**：overlay 窗口缺失或消费停滞时状态快照队列无限增长（macOS 上永远没有消费窗口），最坏可达 GB 级/天；现已按函数名合并 + 硬上限。
- **`SetupTextures()`**：overlay 线程未捕获异常导致整个进程崩溃（macOS + SteamVR 场景），现捕获并退避重试。
- **渲染层**：通知表、`seenIds`、photon 事件表、gallery 队列定时器等全部加上限/保证清理。
- **Electron 主进程**：overlay 帧改为 seqlock 直写共享内存（48fps 下消除每帧 ~6MB 复制）、shm 错误日志限流、应用内重启不再孤儿化 `/dev/shm` 文件。
- **GameHandler**：支持 macOS 原生 `VRChat` 进程名（原先只找 `VRChat.exe`，macOS 上游戏状态永远检测不到）、进程表扫描节流、macOS 跳过 WiVRN 扫描。
- **`ScreenshotHelper`**：元数据缓存设上限。

### 修复 — macOS arm64 打包

- `osx-arm64` 切换到 `System.Data.SQLite` 2.x（1.x 无 arm64 原生库，应用启动即崩 `Unable to load shared library 'SQLite.Interop.dll'`）。
- `patch-node-api-dotnet.js` 支持 macOS `.app` 布局（此前 .NET 宿主路径补丁被静默跳过，.NET 无法初始化）。

### 新增

- **自动发布**：推送 `v*` 标签即在 GitHub Actions 全平台构建并自动发布 Release（附 macOS Gatekeeper 绕过说明 —— 本构建不签名，见 Release 页说明）。
- 应用内链接（GitHub 按钮、更新日志对话框、设置里的"关于"区块）指向本 fork，同时保留上游署名。

### 未改动

- 上游全部功能、设置与行为，相对 `2026.09.16` 没有删除任何内容。

## 下载

从 [Releases](https://github.com/xueayi/VRCX/releases/latest) 获取最新构建。**macOS 首次打开**：Gatekeeper 会提示"已损坏，无法打开"，把 VRCX 拖入「应用程序」后执行一次：

```bash
xattr -cr /Applications/VRCX.app
```

（或在 系统设置 → 隐私与安全性 → 仍要打开。）

## 从源码构建

```bash
npm ci                         # 需要 Node.js >= 24.15
npm run prod                   # 构建渲染层（build/html）
npm run build-electron-arm64   # macOS arm64；x64 用 build-electron
```

.NET 后端（net10.0）由 electron-builder 脚本自动构建打包。推送 `v*` 标签到 GitHub 会运行相同流水线并自动发布。

## 许可证

MIT，与上游一致。VRCX 的全部功劳属于上游作者（[pypy](https://github.com/pypy-vrc)、[Natsumi-sama](https://github.com/Natsumi-sama)、[Map1en](https://github.com/Map1en) 及 [所有贡献者](https://github.com/vrcx-team/VRCX/graphs/contributors)）。
