# Repository Guidelines

## 项目结构与模块组织
- 代码位于仓库根目录：`app.py` 启动入口，`ui_main.py` GUI，`generators.py` 主流程，`parsers.py` 解析 OpenAPI，`db_introspect.py` 反射数据库，`word_render.py` 渲染 Word。
- `models.py` 存放共享数据结构，避免循环 import；`workers.py` 封装后台线程任务。
- 构建产物在 `build/` 与 `dist/`，本地虚拟环境在 `env/`（不提交）。
- 如新增模块，请保持单一职责并在 README 的结构段落补充。

## 构建、运行与打包命令
- 安装依赖（建议使用虚拟环境）：
```bash
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
```
- 本地运行（GUI）：`python app.py`
- 打包 Windows 可执行文件（可选）：`pyinstaller -F -w app.py --name Spec2Doc`

## 编码风格与命名规范
- 采用 4 空格缩进；模块与函数使用 `snake_case`，类使用 `PascalCase`。
- 当前未发现统一格式化/静态检查配置；提交前请保持简洁、可读、避免重复逻辑。
- 中文注释仅用于复杂逻辑，避免注释与代码不一致。

## 测试指南
- 当前仓库未包含自动化测试框架；建议在新增核心逻辑时补充最小单元测试。
- 临时验证可通过 GUI 手工流程：导入 OpenAPI → 连接 DB/DDL → 生成文档。

## 提交与 Pull Request 指南
- Git 历史采用 Conventional Commits 变体：如 `feat: ...`，建议保持 `feat|fix|chore|docs` 前缀。
- PR 需说明变更目标、影响范围、运行/打包验证步骤；GUI 变更请附截图或录屏。

## 安全与配置提示
- DB 连接串、凭据与样例数据不要提交到仓库；使用本地配置或临时环境变量。
- Word 模板建议放在本地路径，若新增模板请说明版本与适配字段。
