# 📦 Nuitka 打包指南

Nuitka 是一个将 Python 代码编译为 C/C++ 的工具，相比 PyInstaller 具有以下优势：
- ✅ **启动速度快** 30-70%（已编译为原生代码）
- ✅ **运行性能提升** 10-30%
- ✅ **体积更小**（可选 UPX 压缩）
- ✅ **更好的安全性**（反编译难度更高）

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 激活虚拟环境
env\Scripts\activate

# 安装 Nuitka（脚本会自动安装，也可手动执行）
pip install nuitka ordered-set zstandard
```

### 2. 选择打包方案

我已为你创建了 **3 个打包脚本**，根据需求选择：

| 脚本 | 用途 | 优点 | 缺点 | 推荐场景 |
|------|------|------|------|---------|
| **build_nuitka.bat** | 标准打包 | 启动快、兼容性好 | 输出为文件夹 | ⭐ **推荐日常使用** |
| **build_nuitka_onefile.bat** | 单文件打包 | 便于分发 | 首次启动慢（需解压） | 需要单文件时 |
| **build_nuitka_advanced.bat** | 高性能打包 | 性能最佳 | 编译时间长（10-30分钟） | 生产发布版本 |

---

## 📖 使用方法

### 方案 1：标准打包（推荐）

```bash
# 双击运行或命令行执行
build_nuitka.bat
```

**输出：**
- 📂 `dist\Spec2Doc.dist\` - 可分发文件夹
- 🚀 `dist\Spec2Doc.dist\app.exe` - 主程序
- 📦 体积约 80-120 MB

**优点：** 启动速度快，兼容性最好

---

### 方案 2：单文件打包

```bash
build_nuitka_onefile.bat
```

**输出：**
- 📄 `dist\Spec2Doc.exe` - 单个可执行文件
- 📦 体积约 100-150 MB

**注意：** 首次启动需 3-5 秒解压，后续启动较快

---

### 方案 3：高性能优化打包

```bash
build_nuitka_advanced.bat
```

**特性：**
- 启用 LTO（链接时优化）
- 多线程编译（4核并行）
- 自动选择最佳编译器（MSVC/MinGW）

**编译时间：** 10-30 分钟（首次）
**性能提升：** 15-30%

**适合：** 生产环境最终发布版

---

## ⚙️ 编译器配置

### 推荐：安装 Visual Studio Build Tools

为获得最佳性能，建议安装 Microsoft C++ 编译器：

1. 下载 Visual Studio Build Tools:
   https://visualstudio.microsoft.com/downloads/

2. 安装时勾选 **"Desktop development with C++"**

3. 安装后 Nuitka 会自动使用 MSVC 编译器

### 替代：使用 MinGW64

如果不想安装 Visual Studio，可以使用 MinGW64：

```bash
# 安装 MinGW64（通过 Chocolatey）
choco install mingw

# 或下载安装：https://www.mingw-w64.org/
```

---

## 🔧 高级配置

### 自定义图标

修改脚本中的图标路径：

```bat
--windows-icon-from-ico=assets/icon.ico
```

**注意：** 图标文件必须是 `.ico` 格式（可用在线工具转换 SVG → ICO）

### 包含额外数据文件

如需包含模板文件：

```bat
--include-data-dir=templates=templates ^
--include-data-dir=assets=assets
```

### 排除不必要的模块

减小体积：

```bat
--nofollow-import-to=tkinter ^
--nofollow-import-to=test ^
--nofollow-import-to=unittest
```

### 启用控制台（调试用）

开发时可显示错误信息：

```bat
# 删除或注释掉这行
--windows-disable-console
```

---

## 📊 性能对比

| 方案 | 启动速度 | 运行性能 | 体积 | 编译时间 |
|------|---------|---------|------|---------|
| **PyInstaller** | 2-3秒 | 基准 | 150-200MB | 2-5分钟 |
| **Nuitka 标准** | 0.5-1秒 | +15% | 80-120MB | 5-10分钟 |
| **Nuitka 优化** | 0.3-0.5秒 | +25% | 80-120MB | 15-30分钟 |

---

## ❓ 常见问题

### 1. 编译失败：找不到模块

**解决：** 确保在虚拟环境中安装了所有依赖

```bash
env\Scripts\activate
pip install -r requirements.txt
```

### 2. 缺少 DLL 文件

**解决：** Nuitka 会自动处理，如有遗漏可手动添加：

```bat
--include-module=pymysql ^
--include-package=psycopg
```

### 3. PySide6 插件问题

**解决：** 确保使用 `--enable-plugin=pyside6`，Nuitka 会自动处理 Qt 依赖

### 4. 体积仍然很大

**解决：** 可以使用 UPX 压缩（需单独安装）：

```bash
# 下载 UPX：https://upx.github.io/
# 解压到 PATH 路径
# Nuitka 会自动检测并使用
```

添加到脚本：

```bat
--windows-uac-admin ^
--windows-company-name="YourCompany"
```

### 5. 编译速度慢

**解决：** 增加并行任务数（根据 CPU 核心数）：

```bat
--jobs=8  # 8核 CPU 使用 8 线程
```

---

## 🎯 完整示例：生产级打包脚本

创建 `build_production.bat`：

```bat
@echo off
python -m nuitka ^
    --standalone ^
    --windows-disable-console ^
    --enable-plugin=pyside6 ^
    --include-data-dir=assets=assets ^
    --windows-icon-from-ico=assets/icon.ico ^
    --product-name="Spec2Doc" ^
    --file-version=1.0.0.0 ^
    --product-version=1.0.0 ^
    --file-description="OpenAPI and Database Documentation Generator" ^
    --copyright="Copyright (C) 2024 Your Company" ^
    --company-name="Your Company" ^
    --output-dir=dist ^
    --lto=yes ^
    --jobs=8 ^
    --msvc=latest ^
    --assume-yes-for-downloads ^
    --show-progress ^
    --show-memory ^
    --nofollow-import-to=tkinter ^
    --nofollow-import-to=test ^
    --remove-output ^
    app.py

if %errorlevel% equ 0 (
    echo ✅ 构建成功！
    ren dist\app.dist Spec2Doc

    REM 创建压缩包
    cd dist
    powershell Compress-Archive -Path Spec2Doc -DestinationPath Spec2Doc-v1.0.0-win64.zip -Force
    cd ..

    echo 📦 发布包：dist\Spec2Doc-v1.0.0-win64.zip
)
pause
```

---

## 📝 版本发布清单

生产发布前检查：

- [ ] 更新版本号（`--file-version` / `--product-version`）
- [ ] 测试所有功能（OpenAPI、数据库、多文件）
- [ ] 检查图标和元数据
- [ ] 在干净的 Windows 系统测试（无 Python 环境）
- [ ] 扫描病毒（避免误报）
- [ ] 创建安装包（可选：使用 Inno Setup）

---

## 🔗 相关资源

- [Nuitka 官方文档](https://nuitka.net/doc/user-manual.html)
- [PySide6 插件说明](https://nuitka.net/doc/plugins.html#pyside6)
- [UPX 压缩工具](https://upx.github.io/)
- [Inno Setup 安装包制作](https://jrsoftware.org/isinfo.php)

---

## ⚡ 推荐工作流

1. **开发阶段：** 直接运行 `python app.py`
2. **测试阶段：** 使用 `build_nuitka.bat` 快速打包测试
3. **发布阶段：** 使用 `build_nuitka_advanced.bat` 生成优化版本

---

## 💡 性能优化建议

### 代码层面优化

1. **延迟导入大型模块**

```python
def generate_db_doc():
    from sqlalchemy import create_engine  # 仅在使用时导入
    ...
```

2. **使用 `__slots__` 减少内存**

```python
class APIModel:
    __slots__ = ['title', 'version', 'endpoints']
```

3. **避免全局变量初始化**

```python
# 不好
HEAVY_DATA = load_large_resource()

# 好
_heavy_data = None
def get_heavy_data():
    global _heavy_data
    if _heavy_data is None:
        _heavy_data = load_large_resource()
    return _heavy_data
```

---

**祝你打包顺利！有问题随时问 🎉**
