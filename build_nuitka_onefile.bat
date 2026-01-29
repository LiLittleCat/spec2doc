@echo off
REM ===================================
REM Spec2Doc Nuitka 单文件打包（启动较慢，体积小）
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
if exist dist\Spec2Doc.exe del /q dist\Spec2Doc.exe

echo.
echo [3/4] 开始 Nuitka 单文件编译...
python -m nuitka ^
    --onefile ^
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
    --output-filename=Spec2Doc.exe ^
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
echo [4/4] 检查输出...
if exist dist\Spec2Doc.exe (
    echo ✅ 打包完成！
    echo.
    echo 文件信息：
    dir dist\Spec2Doc.exe | findstr "Spec2Doc.exe"
) else (
    echo ⚠️  未找到输出文件
)

echo.
echo ✨ 完成！可执行文件：dist\Spec2Doc.exe
pause
