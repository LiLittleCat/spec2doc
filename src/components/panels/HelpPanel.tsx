import { ExternalLink, FileText, Github, MessageCircle, BookOpen, Zap, Database as DatabaseIcon, HelpCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const GITHUB_REPOSITORY_URL = "https://github.com/LiLittleCat/spec2doc";
const GITHUB_ISSUES_URL = `${GITHUB_REPOSITORY_URL}/issues`;

export function HelpPanel() {
  return (
    <div className="flex flex-col gap-5 p-6 max-w-6xl mx-auto">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">帮助与文档</h2>
        <p className="text-muted-foreground leading-relaxed">了解如何使用 Spec2Doc 并获取支持</p>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            快速开始
          </CardTitle>
          <CardDescription className="leading-relaxed">几分钟内即可上手使用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
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
                  使用内置模版或自定义 .docx 模版
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
            <Layers className="h-5 w-5" />
            模板指南
          </CardTitle>
          <CardDescription className="leading-relaxed">
            了解如何在 Word 模板中使用占位符自定义文档样式
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="openapi">
            <TabsList>
              <TabsTrigger value="openapi">
                <FileText className="h-4 w-4" />
                OpenAPI 模板
              </TabsTrigger>
              <TabsTrigger value="database">
                <DatabaseIcon className="h-4 w-4" />
                数据库模板
              </TabsTrigger>
            </TabsList>

            <TabsContent value="openapi" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    自定义模板使用 <strong>docxtemplater</strong> 语法：变量用 <code className="mx-1 rounded bg-background px-1.5 py-0.5 text-xs">{`{变量名}`}</code>，循环用 <code className="mx-1 rounded bg-background px-1.5 py-0.5 text-xs">{`{#列表}...{/列表}`}</code>
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">1</div>
                    基础信息字段
                  </h4>
                  <div className="space-y-2 pl-7">
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{title}`}</code>
                      <span className="text-muted-foreground">文档标题</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{version}`}</code>
                      <span className="text-muted-foreground">版本号</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{description}`}</code>
                      <span className="text-muted-foreground">文档描述</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{baseUrl}`}</code>
                      <span className="text-muted-foreground">服务器地址</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{updateDate}`}</code>
                      <span className="text-muted-foreground">生成日期</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">2</div>
                    接口循环结构
                  </h4>
                  <div className="pl-7 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      使用嵌套循环输出所有接口，外层按分组循环，内层按接口循环：
                    </p>
                    <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-auto font-mono">
{`{#apiGroups}
  {tagName}           ← 分组名称
  {#apis}             ← 开始循环该分组下的接口
    {summary}         ← 接口名称
    {method}          ← 请求方法 (GET/POST...)
    {path}            ← 接口路径
    {description}     ← 接口描述
    {contentType}     ← Content-Type
  {/apis}             ← 结束接口循环
{/apiGroups}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">3</div>
                    参数表格（重要）
                  </h4>
                  <div className="pl-7 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      在 Word 表格中输出参数时，<strong>起始标签</strong> 和 <strong>结束标签</strong> 必须放在同一行的不同单元格：
                    </p>
                    <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-auto font-mono">
{`| {#pathParams}{name} | {type} | {required} | {example} | {description}{/pathParams} |`}
                    </pre>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      可用的参数循环：
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{#pathParams}...{/pathParams}`}</code> - 路径参数</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{#queryParams}...{/queryParams}`}</code> - 查询参数</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{#headerParams}...{/headerParams}`}</code> - 请求头参数</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{#bodyParams}...{/bodyParams}`}</code> - 请求体字段</li>
                    </ul>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      参数字段：<code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">{`{name}`}</code>、
                      <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">{`{type}`}</code>、
                      <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">{`{required}`}</code>（是/否）、
                      <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">{`{example}`}</code>、
                      <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">{`{description}`}</code>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">4</div>
                    响应示例
                  </h4>
                  <div className="pl-7 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      循环输出不同状态码的响应：
                    </p>
                    <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-auto font-mono">
{`{#responses}
  {statusCode}       ← 状态码 (200, 400...)
  {description}      ← 响应描述
  {bodyExample}      ← 响应示例 (JSON)
  {#fields}          ← 响应字段循环
    {name}
    {type}
    {description}
  {/fields}
{/responses}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">5</div>
                    请求示例
                  </h4>
                  <div className="pl-7 space-y-2">
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[180px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{requestBodyExample}`}</code>
                      <span className="text-muted-foreground">请求 Body 的 JSON 示例</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="database" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    数据库模板用于生成数据字典文档，支持表结构、字段、索引等信息的展示
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">1</div>
                    基础信息字段
                  </h4>
                  <div className="space-y-2 pl-7">
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{databaseName}`}</code>
                      <span className="text-muted-foreground">数据库名称</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{updateDate}`}</code>
                      <span className="text-muted-foreground">生成日期</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{tableCount}`}</code>
                      <span className="text-muted-foreground">数据表总数</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">2</div>
                    表循环结构
                  </h4>
                  <div className="pl-7 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      使用循环输出所有数据表信息：
                    </p>
                    <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-auto font-mono">
{`{#tables}
  {tableName}        ← 表名
  {comment}          ← 表注释/说明
  {columnCount}      ← 字段数量
{/tables}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">3</div>
                    字段表格（重要）
                  </h4>
                  <div className="pl-7 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      在表格中输出字段信息，起始和结束标签放在同一行：
                    </p>
                    <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-auto font-mono">
{`{#tables}
  表名：{tableName}
  | {#columns}{name} | {type} | {nullable} | {isPrimary} | {comment}{/columns} |
{/tables}`}
                    </pre>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      字段属性：
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{name}`}</code> - 字段名</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{type}`}</code> - 数据类型</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{nullable}`}</code> - 是否可空（YES/NO）</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{isPrimary}`}</code> - 是否主键（是/否）</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{isForeign}`}</code> - 是否外键（是/否）</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{default}`}</code> - 默认值</li>
                      <li><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{comment}`}</code> - 字段注释</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">4</div>
                    索引信息（可选）
                  </h4>
                  <div className="pl-7 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      如需输出索引信息，可在表循环内嵌套索引循环：
                    </p>
                    <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-auto font-mono">
{`{#tables}
  {#indexes}
    {indexName}      ← 索引名称
    {columns}        ← 索引字段列表
    {isUnique}       ← 是否唯一索引（是/否）
  {/indexes}
{/tables}`}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            常见问题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="formats">
              <AccordionTrigger>支持哪些文件格式？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                对于 OpenAPI 规范，支持 YAML（.yaml、.yml）和 JSON（.json）格式，兼容
                OpenAPI 2.0（Swagger）和 OpenAPI 3.x。对于数据库结构，支持来自
                PostgreSQL、MySQL、SQL Server 和 SQLite 的标准 SQL DDL 语句。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="templates">
              <AccordionTrigger>如何自定义文档模版？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                可以使用 .docx 文件作为自定义模版。推荐在设置中打开内置模版文件夹，
                复制一份内置模版，再根据上方"模板指南"中的占位符规则进行修改。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="offline">
              <AccordionTrigger>应用是否支持离线使用？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                是的，Spec2Doc 是完全离线的桌面应用程序。所有处理都在本地计算机上进行，
                数据不会上传到任何外部服务器。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger>我的数据安全吗？</AccordionTrigger>
              <AccordionContent className="leading-relaxed">
                所有数据处理都在本地计算机上进行。我们从不会将您的 API 规范或数据库结构
                发送到任何外部服务器。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            资源链接
          </CardTitle>
          <CardDescription className="leading-relaxed">获取更多帮助和支持</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
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
