@echo off
REM ===================================
REM Spec2Doc Nuitka 打包脚本
REM ===================================

echo [1/4] 检查 Nuitka 安装...
pip show nuitka >nul 2>&1
if %errorlevel% neq 0 (
    echo Nuitka 未安装，正在安装...
    pip install nuitka ordered-set zstandard
) else (
    echo Nuitka 已安装
)

echo.
echo [2/4] 清理旧的构建产物...
if exist build rmdir /s /q build
if exist dist\Spec2Doc.dist rmdir /s /q dist\Spec2Doc.dist
if exist dist\Spec2Doc.exe del /q dist\Spec2Doc.exe

echo.
echo [3/4] 开始 Nuitka 编译...
python -m nuitka ^
    --standalone ^
    --windows-disable-console ^
    --enable-plugin=pyside6 ^
    --include-data-dir=assets=assets ^
    --windows-icon-from-ico=assets/logo.svg ^
    --product-name="Spec2Doc" ^
    --file-version=1.0.0.0 ^
    --product-version=1.0.0 ^
    --file-description="OpenAPI and Database Documentation Generator" ^
    --copyright="Copyright (C) 2024" ^
    --company-name="Spec2Doc" ^
    --output-dir=dist ^
    --assume-yes-for-downloads ^
    --show-progress ^
    --show-memory ^
    app.py

if %errorlevel% neq 0 (
    echo.
    echo ❌ 编译失败！
    pause
    exit /b 1
)

echo.
echo [4/4] 重命名输出文件夹...
if exist dist\app.dist (
    ren dist\app.dist Spec2Doc.dist
    echo ✅ 打包完成！输出目录：dist\Spec2Doc.dist\
) else (
    echo ⚠️  未找到输出目录
)

echo.
echo 打包信息：
dir dist\Spec2Doc.dist | findstr "app.exe"

echo.
echo ✨ 完成！可执行文件位于：dist\Spec2Doc.dist\app.exe
pause
