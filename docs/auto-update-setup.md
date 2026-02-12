# 自动更新配置指南

Spec2Doc 使用 Tauri 官方 `tauri-plugin-updater` 实现自动更新。Updater 强制要求对更新包进行签名验证，因此需要先生成密钥对。

## 一、生成签名密钥（一次性操作）

```bash
pnpm tauri signer generate -w ~/.tauri/spec2doc.key
```

运行后会输出两样东西：

1. **私钥文件**：保存到 `~/.tauri/spec2doc.key`
2. **公钥字符串**：打印在终端，形如 `dW50cnVzdGVkIGNvbW1lbnQ...`（一长串 base64）

> 如果设置了密码，终端还会提示你输入密码。记住这个密码，CI 中会用到。

## 二、将公钥写入配置

复制终端输出的公钥字符串，替换 `src-tauri/tauri.conf.json` 中的占位符：

```json
"plugins": {
  "updater": {
    "endpoints": [
      "https://github.com/LiLittleCat/spec2doc/releases/latest/download/latest.json"
    ],
    "pubkey": "在这里粘贴你的公钥字符串"
  }
}
```

## 三、配置 CI Secrets

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加两个 secret：

| Secret 名称 | 值 |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | `~/.tauri/spec2doc.key` 文件的完整内容 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 生成密钥时设置的密码（如果没设密码则留空） |

## 四、CI 构建时的环境变量

在 GitHub Actions 的 `tauri build` 步骤中，将这两个 secret 传入环境变量：

```yaml
- name: Build Tauri app
  uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

`tauri build` 检测到这两个环境变量后，会自动对产物签名并生成 `latest.json` 文件。

## 五、发布 Release

`tauri-action` 会自动在 GitHub Release 中上传以下文件：

- 各平台安装包（`.msi`, `.dmg`, `.AppImage` 等）
- **`latest.json`** — updater 元数据文件，包含版本号、下载地址和签名

`latest.json` 示例：
```json
{
  "version": "0.2.0",
  "notes": "Bug fixes and improvements",
  "pub_date": "2025-01-01T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "签名字符串...",
      "url": "https://github.com/.../spec2doc_0.2.0_aarch64.dmg.tar.gz"
    },
    "windows-x86_64": {
      "signature": "签名字符串...",
      "url": "https://github.com/.../spec2doc_0.2.0_x64-setup.nsis.zip"
    }
  }
}
```

## 六、更新流程验证

1. 修改 `src-tauri/tauri.conf.json` 和 `package.json` 中的 `version`（如 `0.2.0`）
2. 推送代码，CI 构建并发布 Release
3. 用旧版本（`0.1.0`）打开应用
4. 预期行为：
   - 启动后自动检测到新版本
   - Sidebar 版本号旁出现红点
   - 鼠标悬停提示「新版本 0.2.0 可用」
   - 点击版本号 → 弹窗显示更新日志
   - 点击「立即更新」→ 下载进度条 → 自动重启

## 备忘

- 私钥路径：`~/.tauri/spec2doc.key`
- 公钥位置：`src-tauri/tauri.conf.json` → `plugins.updater.pubkey`
- 更新检测端点：`https://github.com/LiLittleCat/spec2doc/releases/latest/download/latest.json`
- 如果没有任何 Release，启动时检测会静默失败，不影响使用
