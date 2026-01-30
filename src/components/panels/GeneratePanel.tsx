import { useState } from "react";
import { FileText, Download, Settings2, Check, FileJson, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface DocConfig {
  includeApiDoc: boolean;
  includeDbDoc: boolean;
  includeChangelog: boolean;
  includeToc: boolean;
  watermark: string;
}

export function GeneratePanel() {
  const [config, setConfig] = useState<DocConfig>({
    includeApiDoc: true,
    includeDbDoc: true,
    includeChangelog: false,
    includeToc: true,
    watermark: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const files: string[] = [];
    if (config.includeApiDoc) files.push("接口设计文档.docx");
    if (config.includeDbDoc) files.push("数据库设计文档.docx");
    
    setGeneratedFiles(files);
    setIsGenerating(false);
  };

  // Mock data sources status
  const hasOpenAPI = true;
  const hasDatabase = true;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          生成文档
        </h2>
        <p className="text-muted-foreground mt-1">
          配置输出选项，一键生成标准化 Word 文档
        </p>
      </div>

      {/* Data Source Status */}
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          数据源状态
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "p-4 rounded-lg border transition-all",
            hasOpenAPI
              ? "border-success/50 bg-success/5"
              : "border-border bg-secondary/30"
          )}>
            <div className="flex items-center gap-3 mb-2">
              <FileJson className={cn(
                "w-5 h-5",
                hasOpenAPI ? "text-success" : "text-muted-foreground"
              )} />
              <span className="font-medium text-foreground">OpenAPI 规范</span>
              {hasOpenAPI && <Check className="w-4 h-4 text-success ml-auto" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasOpenAPI ? "已导入：Example API v1.0.0" : "未导入规范文件"}
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-lg border transition-all",
            hasDatabase
              ? "border-success/50 bg-success/5"
              : "border-border bg-secondary/30"
          )}>
            <div className="flex items-center gap-3 mb-2">
              <Database className={cn(
                "w-5 h-5",
                hasDatabase ? "text-success" : "text-muted-foreground"
              )} />
              <span className="font-medium text-foreground">数据库结构</span>
              {hasDatabase && <Check className="w-4 h-4 text-success ml-auto" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasDatabase ? "已连接：5 张表" : "未连接数据库"}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="card-elevated p-6 space-y-6">
        <h3 className="font-semibold text-foreground">输出配置</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-foreground">接口设计文档</Label>
              <p className="text-sm text-muted-foreground">
                包含所有 API 接口的详细说明
              </p>
            </div>
            <Switch
              checked={config.includeApiDoc}
              onCheckedChange={(checked) => setConfig({ ...config, includeApiDoc: checked })}
            />
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-foreground">数据库设计文档</Label>
              <p className="text-sm text-muted-foreground">
                包含表结构、字段说明、索引信息
              </p>
            </div>
            <Switch
              checked={config.includeDbDoc}
              onCheckedChange={(checked) => setConfig({ ...config, includeDbDoc: checked })}
            />
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-foreground">生成目录</Label>
              <p className="text-sm text-muted-foreground">
                自动生成文档目录页
              </p>
            </div>
            <Switch
              checked={config.includeToc}
              onCheckedChange={(checked) => setConfig({ ...config, includeToc: checked })}
            />
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-foreground">变更记录</Label>
              <p className="text-sm text-muted-foreground">
                包含文档版本变更历史
              </p>
            </div>
            <Switch
              checked={config.includeChangelog}
              onCheckedChange={(checked) => setConfig({ ...config, includeChangelog: checked })}
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        size="xl"
        variant="primary"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || (!config.includeApiDoc && !config.includeDbDoc)}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            正在生成文档...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            生成 Word 文档
          </>
        )}
      </Button>

      {/* Generated Files */}
      {generatedFiles.length > 0 && (
        <div className="card-elevated p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Check className="w-5 h-5 text-success" />
            生成完成
          </h3>
          
          <div className="space-y-2">
            {generatedFiles.map((file) => (
              <div
                key={file}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">{file}</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4" />
                  下载
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
