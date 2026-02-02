import { useState, useRef, useEffect } from "react";
import { FileJson, Check, Trash2, FolderOpen, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { documentService } from "@/services/documentService";
import { toast } from "sonner";
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';

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

        toast.success("文件已加载");
      }
    } catch (error) {
      toast.error("文件选择失败: " + error);
    }
  };

  const handleParseSpec = async () => {
    if (!specContent.trim()) return;
    setIsLoading(true);
    setIsDone(false);

    try {
      // 使用 documentService 解析（支持 JSON 和 YAML）
      const spec = documentService.parseOpenApiFromText(specContent);

      // 验证 OpenAPI 规范
      const validation = await documentService.validateOpenApiSpec(spec);
      if (!validation.valid) {
        toast.error("OpenAPI 规范验证失败: " + validation.errors.join(", "));
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
      toast.success("OpenAPI 规范解析成功！");
    } catch (error: any) {
      toast.error("解析失败: " + error.message);
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
        toast.success("模板文件已选择");
      }
    } catch (error) {
      toast.error("文件选择失败: " + error);
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
        toast.success("输出路径已选择");
      }
    } catch (error) {
      toast.error("路径选择失败: " + error);
    }
  };

  const handleGenerate = async () => {
    if (!fullSpec) {
      toast.error("请先解析 OpenAPI 规范");
      return;
    }

    if (!outputPath) {
      toast.error("请先选择输出路径");
      return;
    }

    setIsGenerating(true);
    setGenerateProgress(0);
    setIsDone(false);

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
      toast.success("文档生成成功！");
    } catch (error: any) {
      console.error('生成失败:', error);
      toast.error('文档生成失败: ' + error.message);
      setIsGenerating(false);
    }
  };

  // 打开文件所在文件夹
  const handleOpenFolder = async () => {
    if (!generatedFilePath) return;

    try {
      // 导入 opener 插件的 revealItemInDir 函数
      const { revealItemInDir } = await import('@tauri-apps/plugin-opener');

      // 在资源管理器中高亮文件
      await revealItemInDir(generatedFilePath);
    } catch (error) {
      toast.error("打开文件夹失败: " + error);
    }
  };

  const canGenerate = parsedSpec !== null && outputPath !== "";

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

      {/* Step 1: Select or Paste */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          1. 选择或粘贴规范
        </h3>

        <div className="card-elevated p-4 space-y-4">
          {/* 文件选择 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Input
                placeholder="选择 OpenAPI 规范文件..."
                value={selectedFilePath}
                readOnly
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSelectOpenApiFile}>
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

          <div className="flex justify-end gap-2">
            {specContent && (
              <Button variant="ghost" size="sm" onClick={clearContent}>
                <Trash2 className="w-4 h-4" />
                清空
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

      {/* Step 2: Template Path (Optional) */}
      <section className={cn("space-y-4 transition-opacity", !parsedSpec && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          2. 模板文件选择（可选）
        </h3>

        <div className="flex gap-3">
          <Input
            placeholder="使用默认模板或选择自定义模板..."
            value={templatePath}
            onChange={(e) => setTemplatePath(e.target.value)}
            className="flex-1"
            readOnly
          />
          <Button variant="outline" onClick={handleSelectTemplate}>
            <FolderOpen className="w-4 h-4" />
            浏览
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          当前使用内置模板。如需自定义样式，请选择 .docx 模板文件。
        </p>
      </section>

      {/* Step 3: Output Path */}
      <section className={cn("space-y-4 transition-opacity", !parsedSpec && "opacity-50 pointer-events-none")}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          3. 选择输出路径
        </h3>

        <div className="flex gap-3">
          <Input
            placeholder="选择保存文件夹..."
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            className="flex-1"
            readOnly
          />
          <Button variant="outline" onClick={handleSelectOutput}>
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
              <p className="text-sm text-muted-foreground mt-1">
                已生成接口设计文档
              </p>
              {generatedFilePath && (
                <p className="text-xs text-muted-foreground mt-2 break-all px-4">
                  {generatedFilePath}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleOpenFolder}>
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
                <p className="text-sm text-muted-foreground text-center">
                  {progressMessage} ({generateProgress}%)
                </p>
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

      {/* 底部锚点，用于自动滚动 */}
      <div ref={bottomRef} />
    </div>
  );
}
