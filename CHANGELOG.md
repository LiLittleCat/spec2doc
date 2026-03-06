# Changelog

## v0.1.0

首个正式发布版本。

### 新功能

- OpenAPI 文档生成：支持导入 YAML/JSON 格式的 OpenAPI 规范，自动解析并生成接口文档
- 数据库文档生成：支持 DDL 导入（MySQL、PostgreSQL、SQL Server、SQLite），解析表结构生成数据库设计文档
- 数据库连接：支持通过数据库连接获取 schema，支持 SSH 隧道
- 模板驱动：基于 docxtemplater 使用 .docx 模板生成文档，支持自定义模板路径
- 自动更新：内置版本检查与自动升级
- 主题切换：支持深色/浅色/跟随系统
- 输出管理：自定义输出目录，一键打开输出文件夹
