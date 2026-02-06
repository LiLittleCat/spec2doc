# OpenAPI 模板指南（docxtemplater）

本文档说明 `Spec2Doc` 在接口文档生成时支持的模板占位符与循环写法。

## 1. 基础语法

- 普通变量：`{name}`
- 循环块：`{#list} ... {/list}`
- 所有循环标签必须成对出现，且嵌套关系必须正确

## 2. 文档级字段

| 占位符 | 说明 |
| --- | --- |
| `{title}` | 文档标题（`info.title`） |
| `{version}` | 文档版本（`info.version`） |
| `{description}` | 文档描述（`info.description`） |
| `{baseUrl}` | 服务地址（`servers[0].url`） |
| `{updateDate}` | 生成日期 |

## 3. 推荐循环结构

```text
{#apiGroups}
  {tagName}
  {#apis}
    {summary} / {method} / {path}
    {#pathParams}...{/pathParams}
    {#queryParams}...{/queryParams}
    {#headerParams}...{/headerParams}
    {#bodyParams}...{/bodyParams}
    {requestBodyExample}
    {#responses}
      {statusCode} - {description}
      {#fields}...{/fields}
      {bodyExample}
    {/responses}
  {/apis}
{/apiGroups}
```

## 4. 接口级字段（放在 `{#apis}` 内）

| 占位符 | 说明 |
| --- | --- |
| `{tagName}` | 分组名（`tags[0]`） |
| `{summary}` | 接口标题 |
| `{method}` | 请求方法 |
| `{path}` | 请求路径 |
| `{contentType}` | 请求 Content-Type |
| `{description}` | 接口描述 |
| `{requestBodyExample}` | 请求 Body 示例（JSON 文本） |

## 5. 参数字段（放在参数循环内）

可用于 `{#pathParams}` / `{#queryParams}` / `{#headerParams}` / `{#bodyParams}`：

| 占位符 | 说明 |
| --- | --- |
| `{name}` | 参数名/字段名 |
| `{type}` | 类型 |
| `{required}` | 是否必填（是/否） |
| `{example}` | 示例值 |
| `{description}` | 说明 |

## 6. 响应字段

### 6.1 响应级字段（放在 `{#responses}` 内）

| 占位符 | 说明 |
| --- | --- |
| `{statusCode}` | 状态码 |
| `{description}` | 响应描述 |
| `{bodyExample}` | 响应 Body 示例（JSON 文本） |

### 6.2 响应字段表（放在 `{#fields}` 内）

| 占位符 | 说明 |
| --- | --- |
| `{name}` | 字段名 |
| `{type}` | 类型 |
| `{example}` | 示例值 |
| `{description}` | 说明 |

## 7. 表格循环注意事项（非常重要）

在 Word 表格中做行循环时，建议把循环开始与结束标签放在同一行：

```text
| {#pathParams}{name} | {type} | {required} | {example} | {description}{/pathParams} |
```

这样可避免每条数据重复表头或结构错位。

## 8. 常见问题

- **没有数据会怎样？**  
  对应循环块会输出为空，不会报错。

- **字段名写错会怎样？**  
  该位置会渲染为空字符串。

- **可以自由调整样式吗？**  
  可以，字体、颜色、边框、段落格式都可以在 Word 中自定义，保留占位符即可。
