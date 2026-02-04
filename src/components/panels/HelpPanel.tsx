import { ExternalLink, FileText, Github, MessageCircle, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HelpPanel() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">帮助与文档</h2>
        <p className="text-muted-foreground">了解如何使用 Spec2Doc 并获取支持</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              快速开始
            </CardTitle>
            <CardDescription>几分钟内即可上手使用</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div>
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
                <div>
                  <p className="font-medium">选择模版</p>
                  <p className="text-sm text-muted-foreground">
                    选择适合您需求的文档模版样式
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">设置输出目录</p>
                  <p className="text-sm text-muted-foreground">选择生成文档的保存位置</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">生成文档</p>
                  <p className="text-sm text-muted-foreground">
                    点击生成按钮，创建标准 Word 文档
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              资源链接
            </CardTitle>
            <CardDescription>有用的链接和文档资料</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
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
              <a href="https://github.com/issues" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                报告问题
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">常见问题</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="formats">
              <AccordionTrigger>支持哪些文件格式？</AccordionTrigger>
              <AccordionContent>
                对于 OpenAPI 规范，我们支持 YAML（.yaml、.yml）和 JSON（.json）格式，兼容
                OpenAPI 2.0（Swagger）和 OpenAPI 3.x。对于数据库结构，我们支持来自
                PostgreSQL、MySQL、SQL Server 和 SQLite 的标准 SQL DDL 语句。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="database">
              <AccordionTrigger>可以直接连接数据库吗？</AccordionTrigger>
              <AccordionContent>
                可以！您可以直接连接到 PostgreSQL、MySQL、SQL Server 或 SQLite
                数据库。应用程序将自动提取结构信息。请确保您拥有适当的连接权限。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="templates">
              <AccordionTrigger>如何自定义文档模版？</AccordionTrigger>
              <AccordionContent>
                您可以从多个内置模版中选择（标准、简洁、详细、企业），或创建自己的自定义模版。模版存储在
                assets/templates 目录中，使用 .docx 格式。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="offline">
              <AccordionTrigger>应用是否支持离线使用？</AccordionTrigger>
              <AccordionContent>
                是的，Spec2Doc 是一个完全离线工作的桌面应用程序。所有处理都在您的本地计算机上进行。数据库连接是可选的，仅在您选择直接连接数据库时使用。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger>我的数据安全吗？</AccordionTrigger>
              <AccordionContent>
                所有数据处理都在您的本地计算机上进行。我们从不会将您的 API 规范或数据库结构发送到任何外部服务器。数据库凭据使用您系统的密钥链/凭据管理器安全存储。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Spec2Doc v1.0.0</span>
            <span>基于 Tauri + React 构建</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
