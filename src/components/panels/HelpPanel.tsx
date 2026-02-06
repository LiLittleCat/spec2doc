import { ExternalLink, FileText, Github, MessageCircle, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const GITHUB_REPOSITORY_URL = "https://github.com/LiLittleCat/spec2doc";
const GITHUB_ISSUES_URL = `${GITHUB_REPOSITORY_URL}/issues`;
const GITHUB_OPENAPI_TEMPLATE_GUIDE_URL =
  `${GITHUB_REPOSITORY_URL}/blob/main/docs/openapi-template-guide.md`;

const apiTemplateBaseFields: Array<[string, string]> = [
  ["{title}", "文档标题（OpenAPI info.title）"],
  ["{version}", "文档版本（OpenAPI info.version）"],
  ["{description}", "文档描述（OpenAPI info.description）"],
  ["{baseUrl}", "服务地址（servers[0].url）"],
  ["{updateDate}", "生成日期（系统当前日期）"],
];

const apiTemplateApiFields: Array<[string, string]> = [
  ["{tagName}", "分组名（接口 tags[0]）"],
  ["{summary}", "接口标题"],
  ["{method}", "请求方法（GET/POST/...）"],
  ["{path}", "接口路径"],
  ["{contentType}", "请求 Content-Type"],
  ["{description}", "接口描述"],
  ["{requestBodyExample}", "请求 Body 示例（JSON 文本）"],
];

const apiTemplateParamFields: Array<[string, string]> = [
  ["{name}", "参数名/字段名"],
  ["{type}", "类型"],
  ["{required}", "是否必填（是/否）"],
  ["{example}", "示例值"],
  ["{description}", "说明"],
];

const apiTemplateResponseFields: Array<[string, string]> = [
  ["{statusCode}", "响应状态码"],
  ["{description}", "响应描述"],
  ["{bodyExample}", "响应 Body 示例（JSON 文本）"],
];

const apiTemplateLoopSnippet = `{#apiGroups}
  {tagName}
  {#apis}
    {summary} / {method} / {path}
    {#pathParams}...{/pathParams}
    {#queryParams}...{/queryParams}
    {#bodyParams}...{/bodyParams}
    {#responses}
      {statusCode} - {description}
      {#fields}...{/fields}
      {bodyExample}
    {/responses}
  {/apis}
{/apiGroups}`;

const apiTemplateTableRowSnippet = `| {#pathParams}{name} | {type} | {required} | {example} | {description}{/pathParams} |`;

export function HelpPanel() {
  return (
    <div className="flex flex-col gap-5 p-6 max-w-6xl mx-auto">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">帮助与文档</h2>
        <p className="text-muted-foreground leading-relaxed">了解如何使用 Spec2Doc 并获取支持</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3 space-y-1.5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              快速开始
            </CardTitle>
            <CardDescription className="leading-relaxed">几分钟内即可上手使用</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-medium">导入数据</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    粘贴或上传 OpenAPI 规范，或导入数据库结构
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-medium">选择模版</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    选择适合您需求的文档模版样式
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-medium">设置输出目录</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">选择生成文档的保存位置</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  4
                </div>
                <div className="space-y-1">
                  <p className="font-medium">生成文档</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    点击生成按钮，创建标准 Word 文档
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 space-y-1.5">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              资源链接
            </CardTitle>
            <CardDescription className="leading-relaxed">有用的链接和文档资料</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a
                href={GITHUB_OPENAPI_TEMPLATE_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-4 w-4" />
                OpenAPI 模板指南（Markdown）
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                GitHub 仓库
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="https://swagger.io/specification/" target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                OpenAPI 规范文档
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href={GITHUB_ISSUES_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                报告问题
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="text-lg">常见问题</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="formats">
              <AccordionTrigger>支持哪些文件格式？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                对于 OpenAPI 规范，我们支持 YAML（.yaml、.yml）和 JSON（.json）格式，兼容
                OpenAPI 2.0（Swagger）和 OpenAPI 3.x。对于数据库结构，我们支持来自
                PostgreSQL、MySQL、SQL Server 和 SQLite 的标准 SQL DDL 语句。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="database">
              <AccordionTrigger>可以直接连接数据库吗？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                可以！您可以直接连接到 PostgreSQL、MySQL、SQL Server 或 SQLite
                数据库。应用程序将自动提取结构信息。请确保您拥有适当的连接权限。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="templates">
              <AccordionTrigger>如何自定义文档模版？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                可以使用 .docx 文件作为自定义模版。推荐先复制一份内置接口模版，再按下方
                “OpenAPI 模版占位符说明”中的字段与循环规则调整。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="offline">
              <AccordionTrigger>应用是否支持离线使用？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                是的，Spec2Doc 是一个完全离线工作的桌面应用程序。所有处理都在您的本地计算机上进行。数据库连接是可选的，仅在您选择直接连接数据库时使用。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger>我的数据安全吗？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                所有数据处理都在您的本地计算机上进行。我们从不会将您的 API 规范或数据库结构发送到任何外部服务器。数据库凭据使用您系统的密钥链/凭据管理器安全存储。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="text-lg">OpenAPI 模版占位符说明</CardTitle>
          <CardDescription className="leading-relaxed">
            用于接口文档（.docx）自定义模版。占位符基于 docxtemplater 语法，变量使用
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">{`{name}`}</code>
            ，循环使用
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">{`{#list}...{/list}`}</code>
            。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="api-template-base">
              <AccordionTrigger>1. 基础字段（文档级）</AccordionTrigger>
              <AccordionContent className="space-y-2">
                {apiTemplateBaseFields.map(([placeholder, desc]) => (
                  <div key={placeholder} className="flex items-start gap-3 text-sm">
                    <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono">
                      {placeholder}
                    </code>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api-template-loops">
              <AccordionTrigger>2. 接口与循环结构（必须成对）</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  推荐按下面的嵌套层级组织模版：先按分组循环，再按接口循环，再放参数与响应循环。
                </p>
                <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-auto">
                  <code>{apiTemplateLoopSnippet}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api-template-api-fields">
              <AccordionTrigger>3. 接口字段、参数字段与响应字段</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">接口字段（放在 {`{#apis}`}...{`{/apis}`} 内）</p>
                  {apiTemplateApiFields.map(([placeholder, desc]) => (
                    <div key={placeholder} className="flex items-start gap-3 text-sm">
                      <code className="min-w-[180px] rounded bg-muted px-2 py-1 font-mono">
                        {placeholder}
                      </code>
                      <span className="text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    参数字段（放在 path/query/body 参数循环内）
                  </p>
                  {apiTemplateParamFields.map(([placeholder, desc]) => (
                    <div key={`param-${placeholder}`} className="flex items-start gap-3 text-sm">
                      <code className="min-w-[180px] rounded bg-muted px-2 py-1 font-mono">
                        {placeholder}
                      </code>
                      <span className="text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    响应字段（放在 {`{#responses}`}...{`{/responses}`} 内）
                  </p>
                  {apiTemplateResponseFields.map(([placeholder, desc]) => (
                    <div key={`resp-${placeholder}`} className="flex items-start gap-3 text-sm">
                      <code className="min-w-[180px] rounded bg-muted px-2 py-1 font-mono">
                        {placeholder}
                      </code>
                      <span className="text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api-template-table">
              <AccordionTrigger>4. 表格中循环的正确写法（重点）</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  在 Word 表格里做参数/字段循环时，请把循环起止标签放在同一行：
                  起始标签放首列，结束标签放末列。这样可避免每条数据重复表头等问题。
                </p>
                <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-auto">
                  <code>{apiTemplateTableRowSnippet}</code>
                </pre>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  参数循环可用：{`{#pathParams}`}/{`{/pathParams}`},
                  {` {#queryParams}`}/{`{/queryParams}`},
                  {` {#bodyParams}`}/{`{/bodyParams}`},
                  {` {#headerParams}`}/{`{/headerParams}`}; 响应字段循环可用：
                  {` {#fields}`}/{`{/fields}`}.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Spec2Doc v1.0.0</span>
            <span>基于 Tauri + React 构建</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
