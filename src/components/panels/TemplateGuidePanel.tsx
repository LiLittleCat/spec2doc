import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, FileJson, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import openApiTemplateGuideMarkdown from "../../../docs/openapi-template-guide.md?raw";
import databaseTemplateGuideMarkdown from "../../../docs/database-template-guide.md?raw";

type TemplateGuideType = "openapi" | "database";

const templateGuideMap: Record<
  TemplateGuideType,
  {
    label: string;
    title: string;
    description: string;
    markdown: string;
  }
> = {
  openapi: {
    label: "OpenAPI",
    title: "OpenAPI 模板指南",
    description: "查看占位符、循环结构和表格模板写法。",
    markdown: openApiTemplateGuideMarkdown,
  },
  database: {
    label: "数据库",
    title: "数据库模板指南",
    description: "查看数据库模板的当前能力说明与推荐修改方式。",
    markdown: databaseTemplateGuideMarkdown,
  },
};

const guideTypes: TemplateGuideType[] = ["openapi", "database"];

export function TemplateGuidePanel() {
  const [type, setType] = useState<TemplateGuideType>("openapi");
  const guide = useMemo(() => templateGuideMap[type], [type]);
  const tabIcon = type === "openapi" ? FileJson : Database;
  const ActiveIcon = tabIcon;

  return (
    <div className="relative flex flex-col gap-5 p-6 max-w-6xl mx-auto">
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background/80 p-6 backdrop-blur-xl shadow-sm">
        <div className="space-y-1.5">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            模板指南
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            选择模块查看 Markdown 指南。文档内容来自仓库文件，可持续维护。
          </p>
        </div>

        <div className="mt-4 inline-flex rounded-xl border bg-background/70 p-1 backdrop-blur">
          {guideTypes.map((item) => {
            const isActive = type === item;
            const Icon = item === "openapi" ? FileJson : Database;
            return (
              <Button
                key={item}
                type="button"
                variant="ghost"
                onClick={() => setType(item)}
                className={cn(
                  "h-8 rounded-lg px-4 text-sm",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {templateGuideMap[item].label}
              </Button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ActiveIcon className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{guide.title}</span>
          <span className="text-muted-foreground">·</span>
          <span>{guide.description}</span>
        </div>
      </section>

      <article className="relative overflow-hidden rounded-2xl border border-border/80 bg-background/80 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <div className="relative prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-pre:bg-muted/60 prose-pre:border prose-pre:rounded-lg prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown>{guide.markdown}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
