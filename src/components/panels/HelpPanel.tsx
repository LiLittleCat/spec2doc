import { Book, MessageCircle, Github, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HelpPanel() {
  const resources = [
    {
      icon: Book,
      title: "使用文档",
      description: "查看完整的使用指南和最佳实践",
      action: "查看文档",
    },
    {
      icon: Github,
      title: "GitHub",
      description: "访问项目源代码，提交 Issue 或 PR",
      action: "访问仓库",
    },
    {
      icon: MessageCircle,
      title: "反馈建议",
      description: "告诉我们你的想法和改进建议",
      action: "提交反馈",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">帮助</h2>
        <p className="text-muted-foreground mt-1">
          快速了解如何使用 Spec2Doc
        </p>
      </div>

      {/* Quick Start */}
      <div className="card-elevated p-6 space-y-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5" />
          快速开始
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-medium text-foreground">导入 OpenAPI 规范</p>
              <p className="text-sm text-muted-foreground">
                支持 JSON/YAML 格式的 OpenAPI 3.0 / Swagger 2.0 文件
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-medium text-foreground">连接数据库或导入 DDL</p>
              <p className="text-sm text-muted-foreground">
                通过连接字符串反射表结构，或直接粘贴 DDL 语句
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-medium text-foreground">配置并生成文档</p>
              <p className="text-sm text-muted-foreground">
                选择文档类型，一键生成并下载 Word 文档
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="card-elevated p-6 space-y-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Book className="w-5 h-5" />
          资源链接
        </h3>

        <div className="space-y-4">
          {resources.map((resource) => (
            <div
              key={resource.title}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <resource.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{resource.title}</p>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                {resource.action}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Spec2Doc v1.0.0 · 基于 Tauri 构建
        </p>
      </div>
    </div>
  );
}
