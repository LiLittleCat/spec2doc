import { useEffect, useRef, useState } from "react";
import {
  FileCode,
  Check,
  AlertCircle,
  FolderOpen,
  Play,
  Loader2,
  File,
  FileJson,
  ChevronDown,
  ChevronRight,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getDefaultDocumentsPath } from "@/lib/defaultPath";
import { documentService } from "@/services/documentService";
import {
  DEFAULT_API_TEMPLATE_PLACEHOLDER,
  readTemplateSettings,
  subscribeTemplateSettings,
} from "@/lib/templateSettings";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";

interface Endpoint {
  id: string;
  method: string;
  path: string;
  summary: string;
  description?: string;
  parameters?: { name: string; in: string; type: string }[];
  responses?: { code: string; description: string }[];
}

interface ParsedSpec {
  title: string;
  version: string;
  description?: string;
  pathCount: number;
  endpoints: Endpoint[];
}

type ParseStatus = "idle" | "parsing" | "success" | "error";
type GenerateStatus = "idle" | "generating" | "success" | "error";

export function OpenAPIPanel() {
  const [specContent, setSpecContent] = useState("");
  const [filePath, setFilePath] = useState("");
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");
  const [parsedSpec, setParsedSpec] = useState<ParsedSpec | null>(null);
  const [fullSpec, setFullSpec] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(
    new Set(),
  );
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(
    new Set(),
  );

  const [templateType, setTemplateType] = useState<"builtin" | "custom">(
    "builtin",
  );
  const [customTemplatePath, setCustomTemplatePath] = useState("");
  const [builtInTemplatePath, setBuiltInTemplatePath] = useState("");
  const [builtInTemplateName, setBuiltInTemplateName] = useState(
    "接口文档模板.docx",
  );

  const [outputPath, setOutputPath] = useState("");
  const [fileName, setFileName] = useState("");

  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>("idle");
  const [generateProgress, setGenerateProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [generatedFilePath, setGeneratedFilePath] = useState("");
  const [isDone, setIsDone] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDone && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isDone]);

  useEffect(() => {
    let isCancelled = false;

    const initializeOutputPath = async () => {
      const path = await getDefaultDocumentsPath();
      if (!isCancelled && path) {
        setOutputPath(path);
      }
    };

    void initializeOutputPath();

    return () => {
      isCancelled = true;
    };
  }, []);

  const getFileNameFromPath = (path: string) =>
    path.split(/[\\/]/).pop() || DEFAULT_API_TEMPLATE_PLACEHOLDER;

  useEffect(() => {
    let isCancelled = false;

    const syncBuiltInTemplate = async (configuredPath?: string) => {
      const normalizedConfiguredPath = (configuredPath || "").trim();
      if (
        normalizedConfiguredPath &&
        normalizedConfiguredPath !== DEFAULT_API_TEMPLATE_PLACEHOLDER
      ) {
        if (!isCancelled) {
          setBuiltInTemplatePath(normalizedConfiguredPath);
          setBuiltInTemplateName(getFileNameFromPath(normalizedConfiguredPath));
        }
        return;
      }

      try {
        const resolvedPath = await documentService.getBuiltInApiTemplatePath();
        if (!isCancelled) {
          setBuiltInTemplatePath(resolvedPath);
          setBuiltInTemplateName(getFileNameFromPath(resolvedPath));
        }
      } catch {
        if (!isCancelled) {
          setBuiltInTemplatePath("");
          setBuiltInTemplateName(DEFAULT_API_TEMPLATE_PLACEHOLDER);
        }
      }
    };

    const settings = readTemplateSettings();
    void syncBuiltInTemplate(settings.apiTemplatePath);

    const unsubscribe = subscribeTemplateSettings((nextSettings) => {
      void syncBuiltInTemplate(nextSettings.apiTemplatePath);
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  const formatTimestamp = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate(),
    )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  };

  const getDefaultFileNameFromTitle = (title?: string) => {
    const safeTitle = (title || "")
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
      .replace(/[. ]+$/g, "");
    const timestamp = formatTimestamp();
    return safeTitle
      ? `${safeTitle}-接口文档-${timestamp}.docx`
      : `接口文档-${timestamp}.docx`;
  };

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "OpenAPI 规范",
            extensions: ["json", "yaml", "yml", "swagger"],
          },
        ],
      });

      if (selected) {
        const selectedPath = selected as string;
        const content = await readTextFile(selectedPath);
        setFilePath(selectedPath);
        setSpecContent(content);
        setParseStatus("idle");
        setParsedSpec(null);
        setFullSpec(null);
        setError(null);
        setSelectedEndpoints(new Set());
        setExpandedEndpoints(new Set());
        setGenerateStatus("idle");
        setIsDone(false);
        setGeneratedFilePath("");
        setFileName("");
      }
    } catch (err) {
      setError(`文件选择失败: ${String(err)}`);
      setParseStatus("error");
    }
  };

  const extractRefType = (ref?: string) =>
    ref ? ref.split("/").pop() || "object" : "object";

  const extractEndpoints = (spec: any): Endpoint[] => {
    const paths = spec?.paths ?? {};
    const endpoints: Endpoint[] = [];
    const httpMethods = new Set([
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "head",
      "options",
      "trace",
    ]);

    Object.entries(paths).forEach(([path, pathItem]) => {
      if (!pathItem || typeof pathItem !== "object") return;
      const item = pathItem as Record<string, any>;
      const pathParams = Array.isArray(item.parameters) ? item.parameters : [];

      Object.entries(item).forEach(([method, operation]) => {
        if (!httpMethods.has(method)) return;
        const op = operation as Record<string, any>;
        const opParams = Array.isArray(op?.parameters) ? op.parameters : [];
        const allParams = [...pathParams, ...opParams];

        const parameters = allParams
          .map((param: any) => {
            const schema = param?.schema ?? {};
            const type =
              schema.type || extractRefType(schema.$ref) || param.type || "any";
            return {
              name: param?.name || "",
              in: param?.in || "",
              type,
            };
          })
          .filter((param: any) => param.name);

        const responses = Object.entries(op?.responses ?? {}).map(
          ([code, resp]) => ({
            code,
            description: (resp as any)?.description || "",
          }),
        );

        endpoints.push({
          id: `${method.toUpperCase()} ${path}`,
          method: method.toUpperCase(),
          path,
          summary: op?.summary || op?.operationId || "",
          description: op?.description || "",
          parameters: parameters.length ? parameters : undefined,
          responses: responses.length ? responses : undefined,
        });
      });
    });

    return endpoints;
  };

  const handleParseSpec = async () => {
    if (!specContent.trim() && !filePath.trim()) {
      setError("请选择文件或粘贴内容");
      setParseStatus("error");
      return;
    }

    setParseStatus("parsing");
    setError(null);
    setGenerateStatus("idle");
    setIsDone(false);
    setGeneratedFilePath("");

    try {
      const spec = documentService.parseOpenApiFromText(specContent);
      const validation = await documentService.validateOpenApiSpec(spec);

      if (!validation.valid) {
        setError(`OpenAPI 规范验证失败: ${validation.errors.join(", ")}`);
        setParseStatus("error");
        return;
      }

      const pathCount = Object.keys(spec.paths || {}).length;
      const endpoints = extractEndpoints(spec);
      const specTitle = spec.info?.title || "未命名 API";

      setParsedSpec({
        title: specTitle,
        version: spec.info?.version || "1.0.0",
        description: spec.info?.description || "",
        pathCount: endpoints.length || pathCount,
        endpoints,
      });
      setFileName(getDefaultFileNameFromTitle(specTitle));
      setFullSpec(spec);
      setSelectedEndpoints(new Set(endpoints.map((e) => e.id)));
      setExpandedEndpoints(new Set());
      setParseStatus("success");
    } catch (err: any) {
      setError(`解析失败: ${err.message || String(err)}`);
      setParseStatus("error");
    }
  };

  const handleTemplateFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Word 模板",
            extensions: ["docx"],
          },
        ],
      });

      if (selected) {
        setCustomTemplatePath(selected as string);
      }
    } catch (err) {
      setError(`模板选择失败: ${String(err)}`);
    }
  };

  const handleSelectOutputDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: outputPath || undefined,
      });

      if (selected) {
        setOutputPath(selected as string);
      }
    } catch (err) {
      setError(`路径选择失败: ${String(err)}`);
    }
  };

  const handleGenerate = async () => {
    if (!fullSpec) {
      setError("请先解析 OpenAPI 规范");
      return;
    }

    if (!outputPath) {
      setError("请先选择输出路径");
      return;
    }

    setGenerateStatus("generating");
    setGenerateProgress(0);
    setProgressMessage("");
    setIsDone(false);
    setError(null);

    const trimmedFileName = fileName.trim();
    const normalizedFileName = trimmedFileName
      ? trimmedFileName.endsWith(".docx")
        ? trimmedFileName
        : `${trimmedFileName}.docx`
      : getDefaultFileNameFromTitle(parsedSpec?.title);
    const separator = outputPath.endsWith("\\") ? "" : "\\";
    const fullOutputPath = `${outputPath}${separator}${normalizedFileName}`;
    setFileName(normalizedFileName);
    setGeneratedFilePath(fullOutputPath);

    try {
      const effectiveTemplatePath =
        templateType === "custom"
          ? customTemplatePath
          : builtInTemplatePath || undefined;

      await documentService.generateApiDocument(
        fullSpec,
        fullOutputPath,
        effectiveTemplatePath,
        (message, percent) => {
          setProgressMessage(message);
          setGenerateProgress(percent);
        },
      );

      setGenerateStatus("success");
      setIsDone(true);
    } catch (err: any) {
      setGenerateStatus("error");
      setError(`文档生成失败: ${err.message || String(err)}`);
    }
  };

  const handleOpenFolder = async () => {
    if (!generatedFilePath) return;

    try {
      await invoke("reveal_in_file_manager", { path: generatedFilePath });
    } catch (err) {
      setError(`打开文件夹失败: ${String(err)}`);
    }
  };

  const handleOpenBuiltInTemplateDir = async () => {
    try {
      let templatePath = builtInTemplatePath;
      if (!templatePath) {
        templatePath = await documentService.getBuiltInApiTemplatePath();
        setBuiltInTemplatePath(templatePath);
        setBuiltInTemplateName(getFileNameFromPath(templatePath));
      }
      await invoke("reveal_in_file_manager", { path: templatePath });
    } catch (err) {
      setError(`打开模板目录失败: ${String(err)}`);
    }
  };

  const canGenerate =
    parseStatus === "success" &&
    outputPath !== "" &&
    (templateType === "builtin" || customTemplatePath !== "");

  const fullOutputPathPreview = (() => {
    if (!outputPath) {
      return "未选择";
    }
    const trimmedFileName = fileName.trim();
    if (!trimmedFileName) {
      return outputPath;
    }
    const normalizedFileName = trimmedFileName.endsWith(".docx")
      ? trimmedFileName
      : `${trimmedFileName}.docx`;
    const separator =
      outputPath.endsWith("\\") || outputPath.endsWith("/")
        ? ""
        : outputPath.includes("\\")
          ? "\\"
          : "/";
    return `${outputPath}${separator}${normalizedFileName}`;
  })();

  const methodColors: Record<string, string> = {
    GET: "bg-green-500/10 text-green-600 border-green-500/30",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    PUT: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    DELETE: "bg-red-500/10 text-red-600 border-red-500/30",
    PATCH: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  };

  const toggleEndpoint = (id: string) => {
    const next = new Set(selectedEndpoints);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedEndpoints(next);
  };

  const toggleExpandEndpoint = (id: string) => {
    const next = new Set(expandedEndpoints);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedEndpoints(next);
  };

  const selectAllEndpoints = () => {
    if (parsedSpec) {
      setSelectedEndpoints(new Set(parsedSpec.endpoints.map((e) => e.id)));
    }
  };

  const deselectAllEndpoints = () => {
    setSelectedEndpoints(new Set());
  };

  return (
    <div className="flex flex-col gap-5 p-6 max-w-6xl mx-auto">
      <div className="space-y-1.5">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FileJson className="w-7 h-7" />
          <span>OpenAPI 规范</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          导入 OpenAPI/Swagger 规范文件，生成接口设计文档
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              1
            </div>
            导入数据
          </CardTitle>
          <CardDescription className="leading-relaxed">
            支持 JSON、YAML、YML、Swagger 格式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={filePath}
              placeholder="选择 OpenAPI 规范文件..."
              className="flex-1"
              readOnly
            />
            <Button variant="outline" onClick={handleFileSelect} className="gap-2">
              <File className="h-4 w-4" />
              选择文件
            </Button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">
                或直接粘贴内容
              </span>
            </div>
          </div>

          <Textarea
            placeholder={`{\n  "openapi": "3.0.0",\n  "info": { "title": "My API", "version": "1.0.0" }\n}`}
            className="min-h-[160px] font-mono text-sm leading-relaxed"
            value={specContent}
            onChange={(e) => {
              setSpecContent(e.target.value);
              setParseStatus("idle");
              setParsedSpec(null);
              setFullSpec(null);
              setGenerateStatus("idle");
              setIsDone(false);
              setGeneratedFilePath("");
              setFileName("");
              setSelectedEndpoints(new Set());
              setExpandedEndpoints(new Set());
            }}
          />

          <Button
            onClick={handleParseSpec}
            disabled={parseStatus === "parsing"}
            className="gap-2"
          >
            {parseStatus === "parsing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <FileCode className="h-4 w-4" />
                解析规范
              </>
            )}
          </Button>

          {(parsedSpec || (error && parseStatus === "error")) && (
            <div className="space-y-4 pt-4 border-t">
              {error && parseStatus === "error" && (
                <div className="flex items-center gap-2 text-destructive text-sm leading-relaxed">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {parsedSpec && (
                <>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-600 border-green-500/30"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      解析成功
                    </Badge>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      {parsedSpec.title} v{parsedSpec.version} ·{" "}
                      {parsedSpec.pathCount} 接口
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      接口 ({selectedEndpoints.size}/{parsedSpec.endpoints.length})
                    </Label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="px-3 py-2 border-b bg-muted/30">
                        <Label
                          htmlFor="select-all-endpoints"
                          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                          <Checkbox
                            id="select-all-endpoints"
                            checked={
                              parsedSpec.endpoints.length > 0 &&
                              selectedEndpoints.size ===
                                parsedSpec.endpoints.length
                                ? true
                                : selectedEndpoints.size > 0
                                  ? "indeterminate"
                                  : false
                            }
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                selectAllEndpoints();
                              } else {
                                deselectAllEndpoints();
                              }
                            }}
                          />
                          <span>全选</span>
                        </Label>
                      </div>
                      <div className="divide-y max-h-[300px] overflow-y-auto">
                        {parsedSpec.endpoints.length === 0 && (
                          <div className="p-4 text-sm text-muted-foreground">
                            未发现可解析的接口路径
                          </div>
                        )}
                        {parsedSpec.endpoints.map((endpoint) => (
                          <Collapsible
                            key={endpoint.id}
                            open={expandedEndpoints.has(endpoint.id)}
                            onOpenChange={() =>
                              toggleExpandEndpoint(endpoint.id)
                            }
                          >
                            <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50">
                              <Checkbox
                                checked={selectedEndpoints.has(endpoint.id)}
                                onCheckedChange={() =>
                                  toggleEndpoint(endpoint.id)
                                }
                              />
                              <CollapsibleTrigger asChild>
                                <button
                                  type="button"
                                  className="flex items-center gap-2 flex-1 text-left"
                                >
                                  {expandedEndpoints.has(endpoint.id) ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs font-mono",
                                      methodColors[endpoint.method],
                                    )}
                                  >
                                    {endpoint.method}
                                  </Badge>
                                  <span className="font-mono text-sm">
                                    {endpoint.path}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-auto">
                                    {endpoint.summary}
                                  </span>
                                </button>
                              </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent>
                              <div className="px-10 py-3 bg-muted/30 text-sm space-y-3">
                                {endpoint.description && (
                                  <p className="text-muted-foreground">
                                    {endpoint.description}
                                  </p>
                                )}
                                {endpoint.parameters &&
                                  endpoint.parameters.length > 0 && (
                                    <div>
                                      <p className="font-medium mb-1">参数:</p>
                                      <ul className="list-disc list-inside text-muted-foreground">
                                        {endpoint.parameters.map((param) => (
                                          <li
                                            key={`${endpoint.id}-${param.name}-${param.in}`}
                                          >
                                            <span className="font-mono">
                                              {param.name}
                                            </span>
                                            <span className="text-xs ml-1">
                                              ({param.in})
                                            </span>
                                            <span className="text-xs ml-1">
                                              - {param.type}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                {endpoint.responses &&
                                  endpoint.responses.length > 0 && (
                                    <div>
                                      <p className="font-medium mb-1">响应:</p>
                                      <ul className="list-disc list-inside text-muted-foreground">
                                        {endpoint.responses.map((resp) => (
                                          <li
                                            key={`${endpoint.id}-${resp.code}`}
                                          >
                                            <span className="font-mono">
                                              {resp.code}
                                            </span>
                                            <span className="ml-1">
                                              - {resp.description}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              2
            </div>
            模版选择
          </CardTitle>
          <CardDescription className="leading-relaxed">选择内置模版或使用自定义模版</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={templateType}
            onValueChange={(value) =>
              setTemplateType(value as "builtin" | "custom")
            }
            className="gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="builtin" id="builtin" />
              <Label htmlFor="builtin" className="font-medium cursor-pointer">
                内置模版
              </Label>
              <span className="text-sm text-muted-foreground">-</span>
              <button
                type="button"
                onClick={handleOpenBuiltInTemplateDir}
                className="text-sm text-primary hover:underline underline-offset-2"
              >
                {builtInTemplateName}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center text-muted-foreground cursor-help">
                    <CircleHelp className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  可在设置中修改
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="font-medium cursor-pointer">
                自定义模版
              </Label>
            </div>
          </RadioGroup>

          {templateType === "custom" && (
            <div className="space-y-3 pt-1">
              <div className="flex gap-3">
                <Input
                  value={customTemplatePath}
                  onChange={(e) => setCustomTemplatePath(e.target.value)}
                  placeholder="选择模版文件..."
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleTemplateFileSelect}>
                  <File className="h-4 w-4" />
                  选择文件
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                支持 .docx 格式的 Word 模版文件
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              3
            </div>
            输出目录
          </CardTitle>
          <CardDescription className="leading-relaxed">设置生成文档的保存位置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
              placeholder="选择输出目录..."
              className="flex-1"
            />
            <Button variant="outline" onClick={handleSelectOutputDir}>
              <FolderOpen className="h-4 w-4" />
              浏览
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filename">文件名</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              4
            </div>
            生成文档
          </CardTitle>
          <CardDescription className="leading-relaxed">确认配置并生成 Word 文档</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {parsedSpec && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">数据源</span>
                <span className="font-medium">{parsedSpec.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">接口数量</span>
                <span className="font-medium">{parsedSpec.pathCount} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">文档模版</span>
                <span className="font-medium">
                  {templateType === "builtin"
                    ? `内置模版 (${builtInTemplateName})`
                    : customTemplatePath || "未选择"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">输出路径</span>
                <span className="font-medium break-all text-right">
                  {fullOutputPathPreview}
                </span>
              </div>
            </div>
          )}

          {generateStatus === "generating" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>生成进度</span>
                <span>{generateProgress}%</span>
              </div>
              <Progress value={generateProgress} />
              <p className="text-sm text-muted-foreground">
                {progressMessage || "正在生成文档，请稍候..."}
              </p>
            </div>
          )}

          {generateStatus === "success" && (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">文档生成成功!</span>
              </div>
              {generatedFilePath && (
                <p className="text-sm text-muted-foreground mt-2 break-all">
                  文件已保存至: {generatedFilePath}
                </p>
              )}
            </div>
          )}

          {error && generateStatus === "error" && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div
            className={cn("flex gap-3", generateStatus === "success" && "pt-1")}
          >
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generateStatus === "generating"}
            >
              {generateStatus === "generating" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : generateStatus === "success" ? (
                "重新生成"
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  开始生成
                </>
              )}
            </Button>
            {generateStatus === "success" && (
              <Button variant="outline" onClick={handleOpenFolder}>
                <FolderOpen className="h-4 w-4" />
                打开目录
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div ref={bottomRef} />
    </div>
  );
}
