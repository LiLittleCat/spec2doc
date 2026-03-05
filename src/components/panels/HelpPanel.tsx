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
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import databaseGuide from "../../../docs/database-template-guide.md?raw";
import openapiGuide from "../../../docs/openapi-template-guide.md?raw";

const GITHUB_REPOSITORY_URL = "https://github.com/LiLittleCat/spec2doc";
const GITHUB_ISSUES_URL = `${GITHUB_REPOSITORY_URL}/issues`;
const GITHUB_API_GUIDE_URL = `${GITHUB_REPOSITORY_URL}/blob/main/docs/openapi-template-guide.md`;
const GITHUB_DB_GUIDE_URL = `${GITHUB_REPOSITORY_URL}/blob/main/docs/database-template-guide.md`;

const markdownComponents: Components = {
  h1: () => null,
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold mt-6 mb-3 pb-2 border-b">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="text-base font-medium mt-4 mb-2">{children}</h3>,
  p: ({ children }) => (
    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ children, className }) => {
    if (className?.includes("language-")) {
      return <code className="text-xs font-mono">{children}</code>;
    }
    return <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="rounded-lg border bg-muted/50 p-3 text-xs overflow-auto font-mono my-3">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <table className="w-full text-sm border-collapse my-3">{children}</table>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="border border-border bg-muted px-3 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border border-border px-3 py-1.5">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-border pl-4 my-3 text-sm">{children}</blockquote>
  ),
  ul: ({ children }) => <ul className="text-sm pl-5 mb-3 space-y-1 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="text-sm pl-5 mb-3 space-y-1 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
  hr: () => <hr className="border-t border-border my-6" />,
};

export function HelpPanel() {
  return (
    <div className="flex flex-col gap-10 p-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <HelpCircle className="w-6 h-6 text-primary" />
          <span>帮助</span>
        </h2>
        <p className="text-sm text-muted-foreground">了解如何使用 Spec2Doc 并获取支持</p>
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
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
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
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                2
              </div>
              <div className="space-y-1">
                <p className="font-medium">选择模版</p>
                <p className="text-sm text-muted-foreground">使用内置模版或自定义 .docx 模版</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                3
              </div>
              <div className="space-y-1">
                <p className="font-medium">设置输出目录</p>
                <p className="text-sm text-muted-foreground">选择生成文档的保存位置</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
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
              <div className="pt-4 space-y-1">
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => openUrl(GITHUB_API_GUIDE_URL)}>
                    <ExternalLink className="h-4 w-4" />在 GitHub 上查看完整文档
                  </Button>
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {openapiGuide}
                </ReactMarkdown>
              </div>
            </TabsContent>
            <TabsContent value="database">
              <div className="pt-4 space-y-1">
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => openUrl(GITHUB_DB_GUIDE_URL)}>
                    <ExternalLink className="h-4 w-4" />在 GitHub 上查看完整文档
                  </Button>
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {databaseGuide}
                </ReactMarkdown>
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
