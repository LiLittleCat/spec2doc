import { useState } from "react";
import { FileJson, FileCode, Check, Trash2, FolderOpen, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ParsedSpec {
  title: string;
  version: string;
  description?: string;
  pathCount: number;
  schemaCount: number;
}

export function OpenAPIPanel() {
  const [specContent, setSpecContent] = useState("");
  const [parsedSpec, setParsedSpec] = useState<ParsedSpec | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [templatePath, setTemplatePath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSpecContent(event.target?.result as string || "");
        setParsedSpec(null);
      };
      reader.readAsText(files[0]);
    }
  };

  const handleParseSpec = async () => {
    if (!specContent.trim()) return;
    setIsLoading(true);
    setIsDone(false);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setParsedSpec({
      title: "Example API",
      version: "1.0.0",
      description: "这是一个示例 API 规范，包含用户管理和订单处理接口。",
      pathCount: 24,
      schemaCount: 18,
    });
    setIsLoading(false);
  };

  const clearContent = () => {
    setSpecContent("");
    setParsedSpec(null);
    setIsDone(false);
  };


  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateProgress(0);
    setIsDone(false);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setGenerateProgress(i);
    }
    
    setIsGenerating(false);
    setIsDone(true);
  };

  const canGenerate = parsedSpec !== null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <FileJson className="w-7 h-7 text-primary" />
          OpenAPI 规范
        </h2>
        <p className="text-muted-foreground mt-1">
          导入 OpenAPI 规范文件，生成接口设计文档
        </p>
      </div>

      {/* Step 1: Upload */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          1. 上传或粘贴规范
        </h3>
        
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
              id="openapi-upload"
            />
            <label
              htmlFor="openapi-upload"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors text-sm"
            >
              <FileCode className="w-4 h-4" />
              选择文件
            </label>
            <span className="text-sm text-muted-foreground">或直接粘贴</span>
          </div>

          <textarea
            placeholder={`{\n  "openapi": "3.0.0",\n  "info": { "title": "My API", "version": "1.0.0" }\n}`}
            value={specContent}
            onChange={(e) => { setSpecContent(e.target.value); setParsedSpec(null); }}
            className="w-full h-32 p-3 rounded-lg bg-background border border-border font-mono text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex justify-end gap-2">
            {specContent && (
              <Button variant="ghost" size="sm" onClick={clearContent}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={handleParseSpec} disabled={!specContent.trim() || isLoading} size="sm">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  解析中...
                </>
              ) : parsedSpec ? (
                <>
                  <Check className="w-4 h-4" />
                  已解析
                </>
              ) : (
                "解析规范"
              )}
            </Button>
          </div>
        </div>

        {/* Parsed Result */}
        {parsedSpec && (
          <div className="card-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">已解析 API 规范</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-success">
                  <Check className="w-3 h-3" />
                  成功
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileJson className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{parsedSpec.title}</p>
                <p className="text-xs text-muted-foreground">
                  v{parsedSpec.version} · {parsedSpec.pathCount} 接口 · {parsedSpec.schemaCount} 模型
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Step 2: Template Path */}
      <section className={cn("space-y-4 transition-opacity", !parsedSpec && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          2. 模板文件选择
        </h3>
        
        <div className="flex gap-3">
          <Input
            placeholder="选择模板文件..."
            value={templatePath}
            onChange={(e) => setTemplatePath(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline">
            <FolderOpen className="w-4 h-4" />
            浏览
          </Button>
        </div>
      </section>

      {/* Step 3: Output Path */}
      <section className={cn("space-y-4 transition-opacity", !parsedSpec && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          3. 选择输出路径
        </h3>
        
        <div className="flex gap-3">
          <Input
            placeholder="选择保存路径..."
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline">
            <FolderOpen className="w-4 h-4" />
            浏览
          </Button>
        </div>
      </section>

      {/* Step 4: Generate */}
      <section className={cn("space-y-4 transition-opacity", !canGenerate && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          4. 生成文档
        </h3>
        
        {isDone ? (
          <div className="card-elevated p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-success/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">文档生成完成！</p>
              <p className="text-sm text-muted-foreground">
                已生成接口设计文档
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4" />
                打开文件夹
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsDone(false)}>
                重新生成
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isGenerating && (
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-foreground h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generateProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">{generateProgress}%</p>
              </div>
            )}
            <Button 
              onClick={handleGenerate} 
              disabled={!canGenerate || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  生成文档
                </>
              )}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
