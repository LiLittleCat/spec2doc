# OpenAPI 转 Word 文档 — 自定义模板教程

## 快速开始

本程序使用 **占位符模板** 机制：你只需在 `.docx` 文件中写好想要的样式（字体、颜色、表格边框、页眉页脚等），然后在需要动态填充数据的位置插入占位符，程序会自动将 OpenAPI 规范中的数据替换进去，生成最终文档。

**核心流程：**

1. 用 Word 打开模板文件，按你的项目样式要求调整排版
2. 在需要动态内容的位置写入 `{占位符}`
3. 用程序读取 OpenAPI 文件 + 模板 → 输出成品文档

---

## 占位符语法

模板支持三种语法：**简单变量**、**循环块** 和 **条件块**。

### 1. 简单变量

用 `{variableName}` 表示，生成时直接替换为对应的值。

```
{title}        →  我的API项目
{version}      →  1.0.0
{baseUrl}      →  https://api.example.com
```

### 2. 循环块

用 `{#listName}...{/listName}` 表示，包裹的内容会对列表中的每一项重复生成。

```
{#apis}
接口名称：{summary}
请求方法：{method}
接口路径：{path}
{/apis}
```

如果有 3 个接口，上面的内容会重复 3 次，每次填入不同接口的数据。

**循环可以嵌套使用**，例如接口组 → 接口 → 参数，形成多层结构。

### 3. 条件块

用 `{#conditionName}...{/conditionName}` 表示（与循环语法相同，程序根据字段类型自动区分）。当条件为 `true` 时，内部内容才会出现在最终文档中。

```
{#hasQueryParams}
这一段只在接口有 Query 参数时才显示
{/hasQueryParams}
```

---

## 可用变量一览

### 文档级别变量

这些变量在整个文档范围内可用：

| 占位符 | 说明 | 示例值 |
|--------|------|--------|
| `{title}` | 项目/文档标题 | 用户管理系统 |
| `{version}` | 文档版本号 | 1.0.0 |
| `{description}` | 项目描述 | 用户管理系统 API 接口文档 |
| `{baseUrl}` | 服务基础地址 | https://api.example.com/v1 |
| `{updateDate}` | 文档更新日期 | 2026-02-13 |

### 接口组级别（在 `{#apiGroups}...{/apiGroups}` 内使用）

| 占位符 | 说明 | 示例值 |
|--------|------|--------|
| `{tagName}` | 分组/标签名称 | 用户管理 |

### 接口级别（在 `{#apis}...{/apis}` 内使用）

| 占位符 | 说明 | 示例值 |
|--------|------|--------|
| `{summary}` | 接口摘要 | 创建用户 |
| `{method}` | 请求方法 | POST |
| `{path}` | 接口路径 | /api/users |
| `{contentType}` | Content-Type | application/json |
| `{description}` | 功能描述 | 创建一个新的用户账号 |

### 条件变量（在 `{#apis}` 内使用）

| 条件占位符 | 何时为 true |
|------------|-------------|
| `{#hasPathParams}` | 接口有 Path 参数时 |
| `{#hasQueryParams}` | 接口有 Query 参数时 |
| `{#hasBodyParams}` | 接口有 Body 参数时 |

### 参数级别

以下变量在 `{#pathParams}`、`{#queryParams}`、`{#bodyParams}` 循环内使用，字段完全一致：

| 占位符 | 说明 | 示例值 |
|--------|------|--------|
| `{name}` | 参数名 | userId |
| `{type}` | 参数类型 | string |
| `{required}` | 是否必填 | 是 |
| `{example}` | 示例值 | abc-123 |
| `{description}` | 参数说明 | 用户唯一标识 |

### 请求体示例（在 `{#hasBodyParams}` 内使用）

| 占位符 | 说明 |
|--------|------|
| `{requestBodyExample}` | 请求 Body 的 JSON 示例 |

### 响应级别（在 `{#responses}...{/responses}` 内使用）

| 占位符 | 说明 | 示例值 |
|--------|------|--------|
| `{statusCode}` | HTTP 状态码 | 200 |
| `{description}` | 状态码描述 | 成功 |
| `{bodyExample}` | 响应 Body 的 JSON 示例 | `{"code":0,"data":{...}}` |

### 响应字段级别（在 `{#fields}...{/fields}` 内使用）

| 占位符 | 说明 | 示例值 |
|--------|------|--------|
| `{name}` | 字段名 | code |
| `{type}` | 字段类型 | integer |
| `{example}` | 示例值 | 0 |
| `{description}` | 字段说明 | 状态码，0 表示成功 |

---

## 数据层级结构

模板中的变量存在嵌套层级关系，需要按正确的层级使用。完整的嵌套结构如下：

```
文档顶层
├── {title}
├── {version}
├── {description}
├── {baseUrl}
├── {updateDate}
│
└── {#apiGroups}                    ← 遍历每个接口分组
     ├── {tagName}
     │
     └── {#apis}                    ← 遍历该分组下每个接口
          ├── {summary}
          ├── {method}
          ├── {path}
          ├── {contentType}
          ├── {description}
          │
          ├── {#hasPathParams}      ← 条件：有 Path 参数时显示
          │    └── {#pathParams}    ← 遍历每个 Path 参数
          │         ├── {name}
          │         ├── {type}
          │         ├── {required}
          │         ├── {example}
          │         └── {description}
          │
          ├── {#hasQueryParams}     ← 条件：有 Query 参数时显示
          │    └── {#queryParams}
          │         └── （同上）
          │
          ├── {#hasBodyParams}      ← 条件：有 Body 参数时显示
          │    ├── {#bodyParams}
          │    │    └── （同上）
          │    └── {requestBodyExample}
          │
          └── {#responses}          ← 遍历每个响应状态
               ├── {statusCode}
               ├── {description}
               ├── {#fields}        ← 遍历响应字段
               │    ├── {name}
               │    ├── {type}
               │    ├── {example}
               │    └── {description}
               └── {bodyExample}
```

---

## 自定义模板实战指南

### 场景：公司给了一个有固定样式的 Word 模板

**步骤 1：保留样式，清空内容**

打开公司提供的样式模板，保留页眉/页脚、字体设置、标题样式、表格样式等，把正文中的示例内容清空。

**步骤 2：按层级结构填入占位符**

以下是一个简化模板的示例内容（你直接在 Word 里这样写即可）：

---

> **（以下为模板内容示意，用 Word 编写时请套用你的公司样式）**
>
> 标题样式 → `{title}`
>
> 正文 → 版本：`{version}` ｜ 更新日期：`{updateDate}`
>
> 正文 → 服务地址：`{baseUrl}`
>
> 正文 → `{description}`
>
> ---
>
> `{#apiGroups}`
>
> 二级标题 → `{tagName}`
>
> `{#apis}`
>
> 三级标题 → `{summary}`
>
> 表格：
>
> | 项目 | 值 |
> |------|----|
> | 请求方法 | `{method}` |
> | 接口路径 | `{path}` |
> | Content-Type | `{contentType}` |
> | 功能描述 | `{description}` |
>
> `{#hasQueryParams}`
>
> **Query 参数**
>
> | 参数名 | 类型 | 必填 | 示例 | 说明 |
> |--------|------|------|------|------|
> | `{#queryParams}{name}` | `{type}` | `{required}` | `{example}` | `{description}{/queryParams}` |
>
> `{/hasQueryParams}`
>
> `{#responses}`
>
> **状态码 `{statusCode}`**
>
> `{bodyExample}`
>
> `{/responses}`
>
> `{/apis}`
>
> `{/apiGroups}`

---

### 步骤 3：注意参数表格的写法

参数表格的循环标记有特殊的写法——**开始标记和结束标记要分别写在表格行的第一列和最后一列**：

```
| {#queryParams}{name} | {type} | {required} | {example} | {description}{/queryParams} |
```

这一行会根据参数个数自动重复生成多行。

### 步骤 4：保存为 .docx 并使用

模板编辑完成后，直接保存为 `.docx` 格式，然后传给程序即可。

---

## 常见问题

**Q：我可以只保留部分内容吗？**

可以。比如你不需要展示 Path 参数，直接把 `{#hasPathParams}...{/hasPathParams}` 整块删掉即可。程序只替换模板中存在的占位符。

**Q：我可以调整内容的顺序吗？**

可以。例如你可以把响应示例放在参数表格前面，只要保持正确的层级嵌套关系即可。

**Q：占位符会受 Word 格式影响吗？**

需要注意：**占位符文本的格式必须一致**。如果 `{title}` 中 `{ti` 是加粗的而 `tle}` 不是加粗，Word 会把它拆成两个 XML 节点，导致程序无法识别。建议先以纯文本写好占位符，再统一设置格式。

**Q：可以添加自定义的固定文本吗？**

当然可以。模板中不是占位符的部分会原样保留。你可以添加任何固定内容，如"本文档仅供内部使用"、版权声明等。

**Q：`{description}` 在多个地方都出现了，会冲突吗？**

不会。同名变量在不同层级中代表不同的数据。例如顶层的 `{description}` 是项目描述，`{#apis}` 内的 `{description}` 是接口描述，`{#pathParams}` 内的 `{description}` 是参数描述。程序会根据当前所在的层级自动取用正确的值。
