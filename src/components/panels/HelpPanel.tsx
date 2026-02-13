import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  BookOpen,
  Database as DatabaseIcon,
  ExternalLink,
  FileText,
  Github,
  HelpCircle,
  Layers,
  MessageCircle,
  Zap,
} from "lucide-react";

const GITHUB_REPOSITORY_URL = "https://github.com/LiLittleCat/spec2doc";
const GITHUB_ISSUES_URL = `${GITHUB_REPOSITORY_URL}/issues`;

export function HelpPanel() {
  return (
    <div className="flex flex-col gap-10 p-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <HelpCircle className="w-7 h-7" />
          <span>帮助</span>
        </h2>
        <p className="text-muted-foreground">了解如何使用 Spec2Doc 并获取支持</p>
      </div>

      {/* Quick Start */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Zap className="h-5 w-5" />
          <h3 className="text-lg font-semibold">快速开始</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">几分钟内即可上手使用</p>
        </div>

        <div className="pl-9">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div className="space-y-1">
                <p className="font-medium">导入数据</p>
                <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">使用内置模版或自定义 .docx 模版</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div className="space-y-1">
                <p className="font-medium">设置输出目录</p>
                <p className="text-sm text-muted-foreground">选择生成文档的保存位置</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                4
              </div>
              <div className="space-y-1">
                <p className="font-medium">生成文档</p>
                <p className="text-sm text-muted-foreground">点击生成按钮，创建标准 Word 文档</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Template Guide */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Layers className="h-5 w-5" />
          <h3 className="text-lg font-semibold">模板指南</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">
            了解如何在 Word 模板中使用占位符自定义文档样式
          </p>
        </div>

        <div className="pl-9">
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
            <TabsContent value="openapi">
              <div className="space-y-6 pt-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    自定义模板使用 <strong>docxtemplater</strong> 语法：变量用{" "}
                    <code className="mx-1 rounded bg-muted-foreground/10 px-1.5 py-0.5 text-xs">{`{变量名}`}</code>
                    ，循环用{" "}
                    <code className="mx-1 rounded bg-muted-foreground/10 px-1.5 py-0.5 text-xs">{`{#列表}...{/列表}`}</code>
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      1
                    </div>
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
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      2
                    </div>
                    接口循环结构
                  </h4>
                  <div className="pl-7">
                    <p className="text-sm text-muted-foreground mb-3">使用嵌套循环输出所有接口：</p>
                    <pre className="rounded-lg border border-border bg-muted/50 p-3 text-xs overflow-auto font-mono">
                      {`{#apiGroups}
  {tagName}
  {#apis}
    {summary}
    {method}
    {path}
  {/apis}
{/apiGroups}`}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="database">
              <div className="space-y-6 pt-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    数据库模板用于生成数据字典文档，支持表结构、字段、索引等信息的展示
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      1
                    </div>
                    基础信息字段
                  </h4>
                  <div className="space-y-2 pl-7">
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{databaseName}`}</code>
                      <span className="text-muted-foreground">数据库名称</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <code className="min-w-[140px] rounded bg-muted px-2 py-1 font-mono text-xs">{`{tableCount}`}</code>
                      <span className="text-muted-foreground">数据表总数</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      2
                    </div>
                    表循环结构
                  </h4>
                  <div className="pl-7">
                    <pre className="rounded-lg border border-border bg-muted/50 p-3 text-xs overflow-auto font-mono">
                      {`{#tables}
  {tableName}
  {comment}
  {columnCount}
{/tables}`}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* FAQ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">常见问题</h3>
        </div>

        <div className="pl-9">
          <Accordion type="multiple">
            <AccordionItem value="1">
              <AccordionTrigger>支持哪些文件格式？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  对于 OpenAPI 规范，支持 YAML（.yaml、.yml）和 JSON（.json）格式，兼容 OpenAPI
                  2.0（Swagger）和 OpenAPI 3.x。对于数据库结构，支持来自 PostgreSQL、MySQL、SQL
                  Server 和 SQLite 的标准 SQL DDL 语句。
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>如何自定义文档模版？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  可以使用 .docx 文件作为自定义模版。推荐在设置中打开内置模版文件夹，
                  复制一份内置模版，再根据上方"模板指南"中的占位符规则进行修改。
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>应用是否支持离线使用？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  是的，Spec2Doc 是完全离线的桌面应用程序。所有处理都在本地计算机上进行，
                  数据不会上传到任何外部服务器。
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="4">
              <AccordionTrigger>我的数据安全吗？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  所有数据处理都在本地计算机上进行。我们从不会将您的 API 规范或数据库结构
                  发送到任何外部服务器。
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Resources */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-5 w-5" />
          <h3 className="text-lg font-semibold">资源链接</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">获取更多帮助和支持</p>
        </div>

        <div className="pl-9 space-y-2">
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => openUrl(GITHUB_REPOSITORY_URL)}
          >
            <Github className="h-4 w-4" />
            GitHub 仓库
            <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => openUrl("https://spec.openapis.org/oas/latest.html")}
          >
            <FileText className="h-4 w-4" />
            OpenAPI 规范文档
            <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => openUrl(GITHUB_ISSUES_URL)}
          >
            <MessageCircle className="h-4 w-4" />
            报告问题
            <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
          </Button>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Footer */}
      <section className="space-y-4">
        <div className="pl-9">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Spec2Doc v{__APP_VERSION__}</span>
            <span>基于 Tauri + React 构建</span>
          </div>
        </div>
      </section>
    </div>
  );
}
