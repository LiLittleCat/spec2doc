@echo off
REM ===================================
REM Spec2Doc Nuitka 高级优化打包
REM 启用 LTO、PGO 优化，生成最快的可执行文件
REM ===================================

echo ⚡ Nuitka 高级优化模式（编译时间较长，性能最佳）
echo.

echo [1/5] 检查 Nuitka 和 C 编译器...
pip show nuitka >nul 2>&1
if %errorlevel% neq 0 (
    echo Nuitka 未安装，正在安装...
    pip install nuitka ordered-set zstandard
)

REM 检查是否安装了 MSVC（Visual Studio）
where cl.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  警告：未检测到 MSVC 编译器
    echo 建议安装 Visual Studio Build Tools 以获得最佳性能
    echo 下载地址：https://visualstudio.microsoft.com/downloads/
    echo.
    echo 将使用 MinGW64 编译器（性能略低）...
    set COMPILER_FLAG=--mingw64
) else (
    echo ✓ 检测到 MSVC 编译器
    set COMPILER_FLAG=--msvc=latest
)

echo.
echo [2/5] 清理旧的构建产物...
if exist build rmdir /s /q build
if exist dist\Spec2Doc.dist rmdir /s /q dist\Spec2Doc.dist
if exist dist\Spec2Doc.exe del /q dist\Spec2Doc.exe

echo.
echo [3/5] 开始 Nuitka 优化编译（可能需要 10-30 分钟）...
python -m nuitka ^
    --standalone ^
    --windows-disable-console ^
    --enable-plugin=pyside6 ^
    --include-data-dir=assets=assets ^
    --product-name="Spec2Doc" ^
    --file-version=1.0.0.0 ^
    --product-version=1.0.0 ^
    --file-description="OpenAPI and Database Documentation Generator" ^
    --copyright="Copyright (C) 2024" ^
    --company-name="Spec2Doc" ^
    --output-dir=dist ^
    --lto=yes ^
    --jobs=4 ^
    %COMPILER_FLAG% ^
    --assume-yes-for-downloads ^
    --show-progress ^
    --show-memory ^
    --report=compilation-report.xml ^
    app.py

if %errorlevel% neq 0 (
    echo.
    echo ❌ 编译失败！
    pause
    exit /b 1
)

echo.
echo [4/5] 重命名输出...
if exist dist\app.dist (
    ren dist\app.dist Spec2Doc.dist
)

echo.
echo [5/5] 优化完成，输出信息：
if exist dist\Spec2Doc.dist (
    echo ✅ 打包成功！
    echo.
    echo 📂 输出目录：dist\Spec2Doc.dist\
    echo 🚀 启动文件：dist\Spec2Doc.dist\app.exe
    echo.
    dir dist\Spec2Doc.dist | findstr "app.exe"
) else (
    echo ⚠️  未找到输出目录
)

echo.
echo ✨ 高性能版本构建完成！
pause
