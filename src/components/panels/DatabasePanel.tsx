import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getDefaultDocumentsPath } from "@/lib/defaultPath";
import {
  DEFAULT_DB_TEMPLATE_PLACEHOLDER,
  readTemplateSettings,
  subscribeTemplateSettings,
} from "@/lib/templateSettings";
import { parseDDL, type ParsedSchema } from "@/services/ddlParser";
import { documentService } from "@/services/documentService";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  Eye,
  EyeOff,
  File,
  FileText,
  FolderOpen,
  Key,
  Loader2,
  Play,
  Server,
  Table2,
} from "lucide-react";
import { useEffect, useState } from "react";

type ParseStatus = "idle" | "parsing" | "success" | "error";
type GenerateStatus = "idle" | "generating" | "success" | "error";

export function DatabasePanel() {
  const [ddlContent, setDdlContent] = useState("");
  const [filePath, setFilePath] = useState("");
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionConfig, setConnectionConfig] = useState({
    type: "mysql",
    host: "",
    port: "3306",
    database: "",
    username: "",
    password: "",
  });

  const [showDbPassword, setShowDbPassword] = useState(false);
  const [showSshPassword, setShowSshPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [sshEnabled, setSshEnabled] = useState(false);
  const [sshExpanded, setSshExpanded] = useState(false);
  const [sshConfig, setSshConfig] = useState({
    host: "",
    port: "22",
    username: "",
    authType: "password" as "password" | "privateKey",
    password: "",
    privateKey: "",
  });

  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<string[]>([]);

  const [templateType, setTemplateType] = useState<"builtin" | "custom">("builtin");
  const [customTemplatePath, setCustomTemplatePath] = useState("");
  const [builtInTemplatePath, setBuiltInTemplatePath] = useState("");
  const [builtInTemplateName, setBuiltInTemplateName] = useState("数据库设计文档模板.docx");

  const [outputPath, setOutputPath] = useState("");
  const [fileName, setFileName] = useState("");

  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>("idle");
  const [generateProgress, setGenerateProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [generatedFilePath, setGeneratedFilePath] = useState("");

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
    path.split(/[\\\/]/).pop() || DEFAULT_DB_TEMPLATE_PLACEHOLDER;

  useEffect(() => {
    let isCancelled = false;

    const syncBuiltInTemplate = async (configuredPath?: string) => {
      const normalizedConfiguredPath = (configuredPath || "").trim();
      if (
        normalizedConfiguredPath &&
        normalizedConfiguredPath !== DEFAULT_DB_TEMPLATE_PLACEHOLDER
      ) {
        if (!isCancelled) {
          setBuiltInTemplatePath(normalizedConfiguredPath);
          setBuiltInTemplateName(getFileNameFromPath(normalizedConfiguredPath));
        }
        return;
      }

      try {
        const resolvedPath = await documentService.getBuiltInDbTemplatePath();
        if (!isCancelled) {
          setBuiltInTemplatePath(resolvedPath);
          setBuiltInTemplateName(getFileNameFromPath(resolvedPath));
        }
      } catch {
        if (!isCancelled) {
          setBuiltInTemplatePath("");
          setBuiltInTemplateName(DEFAULT_DB_TEMPLATE_PLACEHOLDER);
        }
      }
    };

    const settings = readTemplateSettings();
    void syncBuiltInTemplate(settings.dbTemplatePath);

    const unsubscribe = subscribeTemplateSettings((nextSettings) => {
      void syncBuiltInTemplate(nextSettings.dbTemplatePath);
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

  const getDefaultFileNameFromDatabase = (database?: string) => {
    const safeDatabase = (database || "")
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
      .replace(/[. ]+$/g, "");
    const timestamp = formatTimestamp();
    return safeDatabase
      ? `${safeDatabase}-数据库设计文档-${timestamp}.docx`
      : `数据库设计文档-${timestamp}.docx`;
  };

  const handleParseDDL = async () => {
    if (!ddlContent.trim() && !filePath.trim()) {
      setError("请输入文件路径、粘贴 DDL 内容或上传文件");
      setParseStatus("error");
      return;
    }

    setParseStatus("parsing");
    setError(null);
    setGenerateStatus("idle");
    setGeneratedFilePath("");

    try {
      let textToParse = ddlContent.trim();
      if (!textToParse && filePath) {
        textToParse = await readTextFile(filePath);
      }
      const schema = parseDDL(textToParse);
      setParsedSchema(schema);
      setFileName(getDefaultFileNameFromDatabase(schema.database));
      setSelectedTables(new Set(schema.tables.map((t) => t.id)));
      setParseStatus("success");
    } catch (err: any) {
      setError(`DDL 解析失败: ${err.message || String(err)}`);
      setParseStatus("error");
    }
  };

  const isSqlite = connectionConfig.type === "sqlite";

  const getDefaultPort = (dbType: string) => {
    switch (dbType) {
      case "mysql":
        return "3306";
      case "postgresql":
        return "5432";
      case "sqlserver":
        return "1433";
      default:
        return "";
    }
  };

  const handleDbTypeChange = (value: string) => {
    setConnectionConfig({ ...connectionConfig, type: value, port: getDefaultPort(value) });
    setTestResult(null);
  };

  const handleConnect = async () => {
    if (!isSqlite && !connectionConfig.host.trim() && !connectionConfig.database.trim()) {
      setError("请填写连接信息");
      setParseStatus("error");
      return;
    }
    if (isSqlite && !connectionConfig.database.trim()) {
      setError("请选择 SQLite 数据库文件");
      setParseStatus("error");
      return;
    }

    setParseStatus("parsing");
    setError(null);
    setTestResult(null);
    setGenerateStatus("idle");
    setGeneratedFilePath("");

    try {
      const schema = await invoke<ParsedSchema>("fetch_db_schema", {
        config: connectionConfig,
        sshConfig: !isSqlite && sshEnabled ? sshConfig : null,
        sshEnabled: !isSqlite && sshEnabled,
      });
      setParsedSchema(schema);
      setFileName(getDefaultFileNameFromDatabase(schema.database));
      setSelectedTables(new Set(schema.tables.map((t) => t.id)));
      setParseStatus("success");
    } catch (err: any) {
      setError(`连接失败: ${err.message || String(err)}`);
      setParseStatus("error");
    }
  };

  const handleTestConnection = async () => {
    if (isSqlite) {
      if (!connectionConfig.database.trim()) {
        setTestResult({ ok: false, message: "请选择数据库文件" });
        return;
      }
    } else {
      if (!connectionConfig.host.trim()) {
        setTestResult({ ok: false, message: "请填写主机地址" });
        return;
      }
      if (!connectionConfig.database.trim()) {
        setTestResult({ ok: false, message: "请填写数据库名" });
        return;
      }
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const message = await invoke<string>("test_db_connection", {
        config: connectionConfig,
        sshConfig: !isSqlite && sshEnabled ? sshConfig : null,
        sshEnabled: !isSqlite && sshEnabled,
      });
      setTestResult({ ok: true, message });
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || String(err) });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSqliteFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "SQLite 数据库", extensions: ["db", "sqlite", "sqlite3", "s3db", "*"] }],
      });
      if (selected) {
        setConnectionConfig({ ...connectionConfig, database: selected as string });
        setTestResult(null);
      }
    } catch (err) {
      setError(`文件选择失败: ${String(err)}`);
    }
  };

  const handleSshKeySelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "私钥文件", extensions: ["pem", "key", "ppk", "*"] }],
      });
      if (selected) {
        setSshConfig({ ...sshConfig, privateKey: selected as string });
      }
    } catch (err) {
      setError(`文件选择失败: ${String(err)}`);
    }
  };

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "DDL 文件", extensions: ["sql", "ddl", "txt"] }],
      });
      if (selected) {
        const selectedPath = selected as string;
        const content = await readTextFile(selectedPath);
        setFilePath(selectedPath);
        setDdlContent(content);
        setParseStatus("idle");
        setParsedSchema(null);
        setFileName("");
        setGenerateStatus("idle");
        setGeneratedFilePath("");
      }
    } catch (err) {
      setError(`文件选择失败: ${String(err)}`);
      setParseStatus("error");
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
        setGenerateStatus("idle");
        setGeneratedFilePath("");
      }
    } catch (err) {
      setError(`路径选择失败: ${String(err)}`);
    }
  };

  const handleTemplateFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Word 模板", extensions: ["docx"] }],
      });
      if (selected) {
        setCustomTemplatePath(selected as string);
        setGenerateStatus("idle");
        setGeneratedFilePath("");
      }
    } catch (err) {
      setError(`模板选择失败: ${String(err)}`);
    }
  };

  const handleGenerate = async () => {
    if (!parsedSchema) {
      setError("请先解析 DDL");
      return;
    }

    if (!outputPath) {
      setError("请先选择输出路径");
      return;
    }

    const trimmedFileName = fileName.trim();
    const normalizedFileName = trimmedFileName
      ? trimmedFileName.endsWith(".docx")
        ? trimmedFileName
        : `${trimmedFileName}.docx`
      : getDefaultFileNameFromDatabase(parsedSchema?.database);

    const separator =
      outputPath.endsWith("\\") || outputPath.endsWith("/")
        ? ""
        : outputPath.includes("\\")
          ? "\\"
          : "/";
    const fullOutputPath = `${outputPath}${separator}${normalizedFileName}`;

    setFileName(normalizedFileName);
    setGeneratedFilePath(fullOutputPath);
    setGenerateStatus("generating");
    setGenerateProgress(0);
    setProgressMessage("");
    setError(null);

    try {
      const effectiveTemplatePath =
        templateType === "custom" ? customTemplatePath : builtInTemplatePath || undefined;

      await documentService.generateDbDocument(
        parsedSchema,
        selectedTables,
        fullOutputPath,
        effectiveTemplatePath,
        (message, percent) => {
          setProgressMessage(message);
          setGenerateProgress(percent);
        },
      );

      setGenerateStatus("success");
    } catch (err: any) {
      setGenerateStatus("error");
      const message = err.message || String(err);
      setError(message.startsWith("模板") ? message : `文档生成失败: ${message}`);
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
        templatePath = await documentService.getBuiltInDbTemplatePath();
        setBuiltInTemplatePath(templatePath);
        setBuiltInTemplateName(getFileNameFromPath(templatePath));
      }
      await invoke("reveal_in_file_manager", { path: templatePath });
    } catch (err) {
      setError(`打开模板目录失败: ${String(err)}`);
    }
  };

  const resetGenerateState = () => {
    setGenerateStatus("idle");
    setGeneratedFilePath("");
  };

  const toggleTable = (id: string) => {
    const newSet = new Set(selectedTables);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTables(newSet);
    resetGenerateState();
  };

  const selectAllTables = () => {
    if (parsedSchema) {
      setSelectedTables(new Set(parsedSchema.tables.map((t) => t.id)));
      resetGenerateState();
    }
  };

  const deselectAllTables = () => {
    setSelectedTables(new Set());
    resetGenerateState();
  };

  const canGenerate =
    parseStatus === "success" &&
    selectedTables.size > 0 &&
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

  return (
    <div className="flex flex-col gap-10 p-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Database className="w-6 h-6 text-primary" />
          <span>数据库</span>
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          导入数据库设计文档，或连接数据库提取结构，生成数据库设计文档。
        </p>
      </div>

      {/* Step 1: Import Data */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            1
          </div>
          <h3 className="text-lg font-semibold">导入数据</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">通过 DDL 语句或连接数据库导入表结构</p>
        </div>

        <div className="pl-9 space-y-5">
          <Tabs defaultValue="ddl">
            <TabsList>
              <TabsTrigger value="ddl">
                <FileText className="h-4 w-4" />
                DDL 语句
              </TabsTrigger>
              <TabsTrigger value="connection">
                <Server className="h-4 w-4" />
                数据库连接
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ddl">
              <div className="mt-5 space-y-5">
                <div className="flex gap-4">
                  <Input
                    value={filePath}
                    placeholder="选择 DDL 文件..."
                    className="flex-1"
                    readOnly
                  />
                  <Button variant="outline" onClick={handleFileSelect}>
                    <File className="h-4 w-4" />
                    选择文件
                  </Button>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">或直接粘贴内容</span>
                  </div>
                </div>

                <Textarea
                  placeholder={`CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) NOT NULL COMMENT '用户邮箱',\n  name VARCHAR(100) COMMENT '用户名',\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) COMMENT='用户表';`}
                  className="min-h-[160px] font-mono text-sm leading-relaxed"
                  value={ddlContent}
                  onChange={(e) => {
                    setDdlContent(e.target.value);
                    setParseStatus("idle");
                    setParsedSchema(null);
                    setFileName("");
                    setGenerateStatus("idle");
                    setGeneratedFilePath("");
                  }}
                />

                <Button onClick={handleParseDDL} disabled={parseStatus === "parsing"}>
                  {parseStatus === "parsing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      解析中...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      解析 DDL
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="connection">
              <div className="mt-5 space-y-5">
                {/* Connection Config Card */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-5 space-y-5">
                    {isSqlite ? (
                      <>
                        {/* SQLite: Type + File picker */}
                        <div className="grid grid-cols-[160px_1fr] gap-4">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="db-type" className="text-sm font-medium">
                              数据库类型
                            </label>
                            <Select
                              value={connectionConfig.type}
                              onValueChange={(value) => handleDbTypeChange(value)}
                            >
                              <SelectTrigger id="db-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mysql">MySQL</SelectItem>
                                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                <SelectItem value="sqlserver">SQL Server</SelectItem>
                                <SelectItem value="sqlite">SQLite</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="db-file" className="text-sm font-medium">
                              数据库文件
                            </label>
                            <div className="flex gap-3">
                              <Input
                                id="db-file"
                                placeholder="选择 SQLite 数据库文件..."
                                value={connectionConfig.database}
                                onChange={(e) =>
                                  setConnectionConfig({
                                    ...connectionConfig,
                                    database: e.target.value,
                                  })
                                }
                                className="flex-1"
                              />
                              <Button variant="outline" onClick={handleSqliteFileSelect}>
                                <File className="h-4 w-4" />
                                浏览
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Row 1: Type + Host + Port */}
                        <div className="grid grid-cols-[160px_1fr_80px] gap-4">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="db-type" className="text-sm font-medium">
                              数据库类型
                            </label>
                            <Select
                              value={connectionConfig.type}
                              onValueChange={(value) => handleDbTypeChange(value)}
                            >
                              <SelectTrigger id="db-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mysql">MySQL</SelectItem>
                                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                <SelectItem value="sqlserver">SQL Server</SelectItem>
                                <SelectItem value="sqlite">SQLite</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="db-host" className="text-sm font-medium">
                              主机地址
                            </label>
                            <Input
                              id="db-host"
                              placeholder="localhost"
                              value={connectionConfig.host}
                              onChange={(e) =>
                                setConnectionConfig({ ...connectionConfig, host: e.target.value })
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="db-port" className="text-sm font-medium">
                              端口
                            </label>
                            <Input
                              id="db-port"
                              placeholder="端口"
                              value={connectionConfig.port}
                              onChange={(e) =>
                                setConnectionConfig({ ...connectionConfig, port: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        {/* Row 2: Database + Username + Password */}
                        <div className="grid grid-cols-[160px_1fr_1fr] gap-4">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="db-name" className="text-sm font-medium">
                              数据库名
                            </label>
                            <Input
                              id="db-name"
                              placeholder="mydb"
                              value={connectionConfig.database}
                              onChange={(e) =>
                                setConnectionConfig({
                                  ...connectionConfig,
                                  database: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="db-user" className="text-sm font-medium">
                              用户名
                            </label>
                            <Input
                              id="db-user"
                              placeholder={
                                connectionConfig.type === "mysql"
                                  ? "root"
                                  : connectionConfig.type === "sqlserver"
                                    ? "sa"
                                    : "postgres"
                              }
                              value={connectionConfig.username}
                              onChange={(e) =>
                                setConnectionConfig({
                                  ...connectionConfig,
                                  username: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="db-password" className="text-sm font-medium">
                              密码
                            </label>
                            <div className="relative">
                              <Input
                                id="db-password"
                                type={showDbPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="pr-9"
                                value={connectionConfig.password}
                                onChange={(e) =>
                                  setConnectionConfig({
                                    ...connectionConfig,
                                    password: e.target.value,
                                  })
                                }
                              />
                              <button
                                type="button"
                                className="absolute right-0 top-0 h-full px-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowDbPassword(!showDbPassword)}
                                tabIndex={-1}
                              >
                                {showDbPassword ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* SSH Tunnel — hidden for SQLite */}
                  {!isSqlite && (
                    <div className="border-t">
                      <div className="flex items-center gap-2 px-5 py-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground"
                          onClick={() => setSshExpanded(!sshExpanded)}
                        >
                          {sshExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          SSH 通道
                        </button>
                        {!sshExpanded && sshConfig.host && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {sshConfig.host}:{sshConfig.port || "22"}
                          </Badge>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          <Switch
                            id="ssh-toggle"
                            checked={sshEnabled}
                            onCheckedChange={setSshEnabled}
                          />
                        </div>
                      </div>
                      {sshExpanded && (
                        <div className="px-5 pb-5 space-y-5 border-t">
                          {/* SSH Row 1: Username + Host + Port — mirrors DB row 1 */}
                          <div className="grid grid-cols-[160px_1fr_80px] gap-4 pt-4">
                            <div className="flex flex-col gap-2">
                              <label htmlFor="ssh-username" className="text-sm font-medium">
                                用户名
                              </label>
                              <Input
                                id="ssh-username"
                                placeholder="root"
                                value={sshConfig.username}
                                onChange={(e) =>
                                  setSshConfig({ ...sshConfig, username: e.target.value })
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label htmlFor="ssh-host" className="text-sm font-medium">
                                SSH 主机
                              </label>
                              <Input
                                id="ssh-host"
                                placeholder="ssh.example.com"
                                value={sshConfig.host}
                                onChange={(e) =>
                                  setSshConfig({ ...sshConfig, host: e.target.value })
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label htmlFor="ssh-port" className="text-sm font-medium">
                                端口
                              </label>
                              <Input
                                id="ssh-port"
                                placeholder="22"
                                value={sshConfig.port}
                                onChange={(e) =>
                                  setSshConfig({ ...sshConfig, port: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          {/* SSH Row 2: Auth Type + Password/Key */}
                          <div className="grid grid-cols-[160px_1fr] gap-4">
                            <div className="flex flex-col gap-2">
                              <label htmlFor="ssh-auth-type" className="text-sm font-medium">
                                认证方式
                              </label>
                              <Select
                                value={sshConfig.authType}
                                onValueChange={(value: "password" | "privateKey") =>
                                  setSshConfig({ ...sshConfig, authType: value })
                                }
                              >
                                <SelectTrigger id="ssh-auth-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="password">密码</SelectItem>
                                  <SelectItem value="privateKey">私钥文件</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {sshConfig.authType === "password" ? (
                              <div className="flex flex-col gap-2">
                                <label htmlFor="ssh-password" className="text-sm font-medium">
                                  SSH 密码
                                </label>
                                <div className="relative">
                                  <Input
                                    id="ssh-password"
                                    type={showSshPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pr-9"
                                    value={sshConfig.password}
                                    onChange={(e) =>
                                      setSshConfig({ ...sshConfig, password: e.target.value })
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-0 top-0 h-full px-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setShowSshPassword(!showSshPassword)}
                                    tabIndex={-1}
                                  >
                                    {showSshPassword ? (
                                      <Eye className="h-4 w-4" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <label htmlFor="ssh-private-key" className="text-sm font-medium">
                                  私钥文件
                                </label>
                                <div className="flex gap-3">
                                  <Input
                                    id="ssh-private-key"
                                    placeholder="选择私钥文件..."
                                    value={sshConfig.privateKey}
                                    onChange={(e) =>
                                      setSshConfig({ ...sshConfig, privateKey: e.target.value })
                                    }
                                    className="flex-1"
                                  />
                                  <Button variant="outline" onClick={handleSshKeySelect}>
                                    <File className="h-4 w-4" />
                                    浏览
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {testResult && (
                  <div
                    className={`flex items-center gap-2 text-sm leading-relaxed ${
                      testResult.ok ? "text-green-600" : "text-destructive"
                    }`}
                  >
                    {testResult.ok ? (
                      <Check className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleConnect} disabled={parseStatus === "parsing"}>
                    {parseStatus === "parsing" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        连接中...
                      </>
                    ) : (
                      <>
                        <Server className="h-4 w-4" />
                        连接并提取结构
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testingConnection || parseStatus === "parsing"}
                  >
                    {testingConnection ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        测试连接
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {(parsedSchema || (error && parseStatus === "error")) && (
            <div className="space-y-4 pt-4 border-t">
              {error && parseStatus === "error" && (
                <div className="flex items-center gap-2 text-destructive text-sm leading-relaxed">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {parsedSchema && (
                <>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-600 border-green-500/30"
                    >
                      <Check className="h-3 w-3" />
                      解析成功
                    </Badge>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      {parsedSchema.database} - {parsedSchema.tables.length} 张表
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium mb-4 block">
                      数据表 ({selectedTables.size}/{parsedSchema.tables.length})
                    </label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="px-3 py-2 border-b bg-muted">
                        <label
                          htmlFor="select-all-tables"
                          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                        >
                          <Checkbox
                            id="select-all-tables"
                            checked={
                              parsedSchema.tables.length > 0 &&
                              selectedTables.size === parsedSchema.tables.length
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                selectAllTables();
                              } else {
                                deselectAllTables();
                              }
                            }}
                          />
                          <span>全选</span>
                        </label>
                      </div>
                      <div className="divide-y max-h-[400px] overflow-y-auto">
                        <Accordion
                          type="multiple"
                          value={expandedTables}
                          onValueChange={setExpandedTables}
                        >
                          {parsedSchema.tables.map((table) => (
                            <AccordionItem key={table.id} value={table.id}>
                              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                <div className="flex items-center gap-2 w-full">
                                  <Checkbox
                                    checked={selectedTables.has(table.id)}
                                    onCheckedChange={() => toggleTable(table.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Table2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="font-mono font-medium truncate">
                                    {table.name}
                                  </span>
                                  {table.comment && (
                                    <span className="text-sm text-muted-foreground truncate">
                                      {table.comment}
                                    </span>
                                  )}
                                  <Badge variant="secondary" className="text-xs ml-auto shrink-0">
                                    {table.columns.length} 字段
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="px-4 py-3 bg-muted/50">
                                  <table className="w-full text-sm table-fixed">
                                    <colgroup>
                                      <col className="w-8" />
                                      <col className="w-[22%]" />
                                      <col className="w-[18%]" />
                                      <col className="w-[8%]" />
                                      <col className="w-[18%]" />
                                      <col />
                                    </colgroup>
                                    <thead>
                                      <tr className="text-left text-muted-foreground border-b">
                                        <th className="pb-2 font-medium"></th>
                                        <th className="pb-2 font-medium">字段名</th>
                                        <th className="pb-2 font-medium">类型</th>
                                        <th className="pb-2 font-medium">可空</th>
                                        <th className="pb-2 font-medium">默认值</th>
                                        <th className="pb-2 font-medium">注释</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {table.columns.map((col) => (
                                        <tr key={col.name} className="border-b last:border-0">
                                          <td className="py-2">
                                            {col.isPrimary && (
                                              <Key className="h-3 w-3 text-amber-500" />
                                            )}
                                            {col.isForeign && !col.isPrimary && (
                                              <Key className="h-3 w-3 text-blue-500" />
                                            )}
                                          </td>
                                          <td className="py-2 font-mono break-all">{col.name}</td>
                                          <td className="py-2 text-muted-foreground font-mono text-xs break-all">
                                            {col.type}
                                          </td>
                                          <td className="py-2 text-muted-foreground">
                                            {col.nullable ? "YES" : "NO"}
                                          </td>
                                          <td className="py-2 text-muted-foreground font-mono text-xs break-all">
                                            {col.default || "-"}
                                          </td>
                                          <td className="py-2 text-muted-foreground break-words">
                                            {col.comment || "-"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {table.indexes && table.indexes.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <p className="text-xs font-medium text-muted-foreground mb-2">
                                        索引:
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {table.indexes.map((idx) => (
                                          <Badge key={idx.name} variant="outline">
                                            {idx.name}
                                            {idx.unique && " (唯一)"}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Step 2: Template Selection */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            2
          </div>
          <h3 className="text-lg font-semibold">模版选择</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">选择内置模版或使用自定义模版</p>
        </div>

        <div className="pl-9 space-y-5">
          <RadioGroup
            value={templateType}
            onValueChange={(value) => {
              setTemplateType(value as "builtin" | "custom");
              setGenerateStatus("idle");
              setGeneratedFilePath("");
            }}
            className="gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="builtin" id="db-builtin" />
              <Label htmlFor="db-builtin" className="font-medium cursor-pointer">
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
                <TooltipContent>可在设置中修改</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="db-custom" />
              <Label htmlFor="db-custom" className="font-medium cursor-pointer">
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
              <p className="text-xs text-muted-foreground">支持 .docx 格式的 Word 模版文件</p>
            </div>
          )}
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Step 3: Output Directory */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            3
          </div>
          <h3 className="text-lg font-semibold">输出目录</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">设置生成文档的保存位置</p>
        </div>

        <div className="pl-9 space-y-5">
          <div className="flex gap-3">
            <Input
              value={outputPath}
              onChange={(e) => {
                setOutputPath(e.target.value);
                setGenerateStatus("idle");
                setGeneratedFilePath("");
              }}
              placeholder="选择输出目录..."
              className="flex-1"
            />
            <Button variant="outline" onClick={handleSelectOutputDir}>
              <FolderOpen className="h-4 w-4" />
              浏览
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="db-filename" className="text-sm font-medium">
              文件名
            </label>
            <Input
              id="db-filename"
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                setGenerateStatus("idle");
                setGeneratedFilePath("");
              }}
            />
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Step 4: Generate Document */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            4
          </div>
          <h3 className="text-lg font-semibold">生成文档</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">确认配置并生成数据字典文档</p>
        </div>

        <div className="pl-9 space-y-5">
          {parsedSchema && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">数据库</span>
                <span className="font-medium">{parsedSchema.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">导出表</span>
                <span className="font-medium">{selectedTables.size} 张</span>
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
                <span className="font-medium break-all text-right">{fullOutputPathPreview}</span>
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

          {generateStatus === "error" && error && (
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">生成失败</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {generateStatus === "success" && (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">文档生成成功</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 break-all">
                文件已保存至: {generatedFilePath}
              </p>
            </div>
          )}

          <div className="flex gap-3">
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
        </div>
      </section>
    </div>
  );
}
