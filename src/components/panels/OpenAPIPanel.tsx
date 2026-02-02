import { useState, useRef, useEffect } from "react";
import { FileJson, Check, Trash2, FolderOpen, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepHeader } from "@/components/ui/StepHeader";
import { cn } from "@/lib/utils";
import { documentService } from "@/services/documentService";
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { invoke } from "@tauri-apps/api/core";

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
  const [fullSpec, setFullSpec] = useState<any>(null);
  const [selectedFilePath, setSelectedFilePath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [templatePath, setTemplatePath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [generatedFilePath, setGeneratedFilePath] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [isDone, setIsDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 通知状态
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 当生成完成时，自动滚动到底部
  useEffect(() => {
    if (isDone && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isDone]);

  // 使用 Tauri dialog 选择 OpenAPI 文件
  const handleSelectOpenApiFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'OpenAPI 规范',
          extensions: ['json', 'yaml', 'yml']
        }]
      });

      if (selected) {
        const filePath = selected as string;
        setSelectedFilePath(filePath);

        // 读取文件内容
        const content = await readTextFile(filePath);
        setSpecContent(content);
        setParsedSpec(null);
        setFullSpec(null);
      }
    } catch (error) {
      setNotification({ type: 'error', message: '文件选择失败: ' + error });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleParseSpec = async () => {
    if (!specContent.trim()) return;
    setIsLoading(true);
    setIsDone(false);
    setNotification(null);

    try {
      // 使用 documentService 解析（支持 JSON 和 YAML）
      const spec = documentService.parseOpenApiFromText(specContent);

      // 验证 OpenAPI 规范
      const validation = await documentService.validateOpenApiSpec(spec);
      if (!validation.valid) {
        setNotification({ type: 'error', message: 'OpenAPI 规范验证失败: ' + validation.errors.join(", ") });
        setIsLoading(false);
        return;
      }

      // 提取基本信息
      const pathCount = Object.keys(spec.paths || {}).length;
      const schemaCount = Object.keys(spec.components?.schemas || {}).length;

      setParsedSpec({
        title: spec.info?.title || "未命名 API",
        version: spec.info?.version || "1.0.0",
        description: spec.info?.description || "",
        pathCount,
        schemaCount,
      });
      setFullSpec(spec);
    } catch (error: any) {
      setNotification({ type: 'error', message: '解析失败: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const clearContent = () => {
    setSpecContent("");
    setParsedSpec(null);
    setFullSpec(null);
    setSelectedFilePath("");
    setIsDone(false);
    setNotification(null);
  };

  const handleSelectTemplate = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Word 模板',
          extensions: ['docx']
        }]
      });

      if (selected) {
        setTemplatePath(selected as string);
      }
    } catch (error) {
      setNotification({ type: 'error', message: '文件选择失败: ' + error });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSelectOutput = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false
      });

      if (selected) {
        setOutputPath(selected as string);
      }
    } catch (error) {
      setNotification({ type: 'error', message: '路径选择失败: ' + error });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleGenerate = async () => {
    if (!fullSpec) {
      setNotification({ type: 'error', message: '请先解析 OpenAPI 规范' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    if (!outputPath) {
      setNotification({ type: 'error', message: '请先选择输出路径' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setIsGenerating(true);
    setGenerateProgress(0);
    setIsDone(false);
    setNotification(null);

    try {
      // 构建输出文件路径
      const fileName = `${parsedSpec?.title || '接口文档'}_${new Date().getTime()}.docx`;
      const fullOutputPath = `${outputPath}\\${fileName}`;

      // 保存生成的文件路径
      setGeneratedFilePath(fullOutputPath);

      // 生成文档
      await documentService.generateApiDocument(
        fullSpec,
        fullOutputPath,
        templatePath || undefined,  // 传递用户选择的模板，或使用默认模板
        (message, percent) => {
          setProgressMessage(message);
          setGenerateProgress(percent);
        }
      );

      setIsGenerating(false);
      setIsDone(true);
    } catch (error: any) {
      console.error('生成失败:', error);
      setNotification({ type: 'error', message: '文档生成失败: ' + error.message });
      setIsGenerating(false);
    }
  };

  // 打开文件所在文件夹
  const handleOpenFolder = async () => {
    if (!generatedFilePath) return;

    try {
      await invoke("reveal_in_file_manager", { path: generatedFilePath });
    } catch (error) {
      setNotification({ type: 'error', message: '打开文件夹失败: ' + error });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const canGenerate = parsedSpec !== null && outputPath !== "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <FileJson className="w-7 h-7 text-primary" />
          OpenAPI 规范
        </h2>
        <p className="text-muted-foreground mt-2">
          导入 OpenAPI 规范文件，生成接口设计文档
        </p>
      </div>

      {/* Step 1: Select or Paste */}
      <section className="space-y-4">
        <StepHeader step={1} title="选择或粘贴规范" />

        <div className="card-elevated p-6 space-y-4">
          {/* 文件选择 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Input
                placeholder="选择 OpenAPI 规范文件..."
                value={selectedFilePath}
                readOnly
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSelectOpenApiFile} className="gap-2">
                <FolderOpen className="w-4 h-4" />
                选择文件
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              支持 JSON、YAML、YML 格式
            </p>
          </div>

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">或直接粘贴内容</span>
            </div>
          </div>

          {/* 文本区域 */}
          <textarea
            placeholder={`{\n  "openapi": "3.0.0",\n  "info": { "title": "My API", "version": "1.0.0" }\n}`}
            value={specContent}
            onChange={(e) => {
              setSpecContent(e.target.value);
              setParsedSpec(null);
              setSelectedFilePath(""); // 清除文件路径，表示手动输入
            }}
            className="w-full h-32 p-3 rounded-lg bg-background border border-border font-mono text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex justify-end gap-3">
            {specContent && (
              <Button variant="ghost" size="sm" onClick={clearContent} className="gap-2">
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
            )}
            <Button onClick={handleParseSpec} disabled={!specContent.trim() || isLoading} size="sm" className="gap-2">
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

        {/* 通知卡片 */}
        {notification && (
          <div className={cn(
            "card-elevated p-4 border-2",
            notification.type === 'success' ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                notification.type === 'success' ? "bg-success/20" : "bg-destructive/20"
              )}>
                {notification.type === 'success' ? (
                  <Check className={cn("w-5 h-5", "text-success")} />
                ) : (
                  <AlertCircle className={cn("w-5 h-5", "text-destructive")} />
                )}
              </div>
              <p className={cn(
                "text-sm font-medium",
                notification.type === 'success' ? "text-success" : "text-destructive"
              )}>
                {notification.message}
              </p>
            </div>
          </div>
        )}

        {/* Parsed Result */}
        {parsedSpec && (
          <div className="card-elevated p-6 space-y-3 border-2 border-success/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">已解析 API 规范</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                  <Check className="w-3.5 h-3.5" />
                  成功
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{parsedSpec.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  v{parsedSpec.version} · {parsedSpec.pathCount} 接口 · {parsedSpec.schemaCount} 模型
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Step 2: Template Path (Optional) */}
      <section className={cn("space-y-4 relative transition-opacity", !parsedSpec && "opacity-60")}>
        {!parsedSpec && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg z-10 pointer-events-none" />
        )}
        <StepHeader step={2} title="模板文件选择（可选）" />

        <div className="card-elevated p-6 space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder="使用默认模板或选择自定义模板..."
              value={templatePath}
              onChange={(e) => setTemplatePath(e.target.value)}
              className="flex-1"
              readOnly
            />
            <Button variant="outline" onClick={handleSelectTemplate} className="gap-2">
              <FolderOpen className="w-4 h-4" />
              浏览
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            当前使用内置模板。如需自定义样式，请选择 .docx 模板文件。
          </p>
        </div>
      </section>

      {/* Step 3: Output Path */}
      <section className={cn("space-y-4 relative transition-opacity", !parsedSpec && "opacity-60")}>
        {!parsedSpec && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg z-10 pointer-events-none" />
        )}
        <StepHeader step={3} title="选择输出路径" />

        <div className="card-elevated p-6">
          <div className="flex gap-3">
            <Input
              placeholder="选择保存文件夹..."
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
              className="flex-1"
              readOnly
            />
            <Button variant="outline" onClick={handleSelectOutput} className="gap-2">
              <FolderOpen className="w-4 h-4" />
              浏览
            </Button>
          </div>
        </div>
      </section>

      {/* Step 4: Generate */}
      <section className={cn("space-y-4 relative transition-opacity", !canGenerate && "opacity-60")}>
        {!canGenerate && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg z-10 pointer-events-none" />
        )}
        <StepHeader step={4} title="生成文档" />

        {isDone ? (
          <div className="card-elevated p-8 text-center space-y-5 border-2 border-success/20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-success/20 flex items-center justify-center ring-4 ring-success/10">
              <Check className="w-8 h-8 text-success" />
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">文档生成完成！</p>
              <p className="text-sm text-muted-foreground mt-2">
                已生成接口设计文档
              </p>
              {generatedFilePath && (
                <p className="text-xs text-muted-foreground mt-3 font-mono bg-secondary/50 p-3 rounded-md break-words max-w-lg mx-auto">
                  {generatedFilePath}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleOpenFolder} className="gap-2">
                <FolderOpen className="w-4 h-4" />
                打开文件夹
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsDone(false)} className="gap-2">
                重新生成
              </Button>
            </div>
          </div>
        ) : (
          <div className="card-elevated p-6 space-y-4">
            {isGenerating && (
              <div className="space-y-3">
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${generateProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {progressMessage} ({generateProgress}%)
                </p>
              </div>
            )}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full gap-2"
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

      {/* 底部锚点，用于自动滚动 */}
      <div ref={bottomRef} />
    </div>
  );
}
