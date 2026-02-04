import { useState } from "react";
import {
  Database,
  FileText,
  Server,
  Check,
  AlertCircle,
  FolderOpen,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  File,
  Table2,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type ParseStatus = "idle" | "parsing" | "success" | "error";
type GenerateStatus = "idle" | "generating" | "success" | "error";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isForeign: boolean;
  comment?: string;
  default?: string;
}

interface TableInfo {
  id: string;
  name: string;
  comment?: string;
  columns: Column[];
  indexes?: { name: string; columns: string[]; unique: boolean }[];
}

interface ParsedSchema {
  database: string;
  tables: TableInfo[];
}

const mockTables: TableInfo[] = [
  {
    id: "t1",
    name: "users",
    comment: "用户表",
    columns: [
      { name: "id", type: "SERIAL", nullable: false, isPrimary: true, isForeign: false, comment: "用户ID" },
      { name: "email", type: "VARCHAR(255)", nullable: false, isPrimary: false, isForeign: false, comment: "邮箱地址" },
      { name: "name", type: "VARCHAR(100)", nullable: true, isPrimary: false, isForeign: false, comment: "用户名" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, isPrimary: false, isForeign: false, comment: "创建时间", default: "CURRENT_TIMESTAMP" },
    ],
    indexes: [{ name: "users_email_idx", columns: ["email"], unique: true }],
  },
  {
    id: "t2",
    name: "posts",
    comment: "文章表",
    columns: [
      { name: "id", type: "SERIAL", nullable: false, isPrimary: true, isForeign: false, comment: "文章ID" },
      { name: "user_id", type: "INTEGER", nullable: false, isPrimary: false, isForeign: true, comment: "用户ID" },
      { name: "title", type: "VARCHAR(255)", nullable: false, isPrimary: false, isForeign: false, comment: "标题" },
      { name: "content", type: "TEXT", nullable: true, isPrimary: false, isForeign: false, comment: "内容" },
      { name: "published_at", type: "TIMESTAMP", nullable: true, isPrimary: false, isForeign: false, comment: "发布时间" },
    ],
  },
  {
    id: "t3",
    name: "comments",
    comment: "评论表",
    columns: [
      { name: "id", type: "SERIAL", nullable: false, isPrimary: true, isForeign: false, comment: "评论ID" },
      { name: "post_id", type: "INTEGER", nullable: false, isPrimary: false, isForeign: true, comment: "文章ID" },
      { name: "user_id", type: "INTEGER", nullable: false, isPrimary: false, isForeign: true, comment: "用户ID" },
      { name: "content", type: "TEXT", nullable: false, isPrimary: false, isForeign: false, comment: "评论内容" },
    ],
  },
  {
    id: "t4",
    name: "categories",
    comment: "分类表",
    columns: [
      { name: "id", type: "SERIAL", nullable: false, isPrimary: true, isForeign: false, comment: "分类ID" },
      { name: "name", type: "VARCHAR(100)", nullable: false, isPrimary: false, isForeign: false, comment: "分类名称" },
      { name: "parent_id", type: "INTEGER", nullable: true, isPrimary: false, isForeign: true, comment: "父分类ID" },
    ],
  },
];

export function DatabasePanel() {
  const [ddlContent, setDdlContent] = useState("");
  const [filePath, setFilePath] = useState("");
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");
  const [parsedSchema, setParsedSchema] = useState<ParsedSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionConfig, setConnectionConfig] = useState({
    type: "postgresql",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
  });

  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const [templateType, setTemplateType] = useState<"builtin" | "custom">("builtin");
  const [customTemplatePath, setCustomTemplatePath] = useState("");

  const [outputPath, setOutputPath] = useState("");
  const [fileName, setFileName] = useState("database-dictionary.docx");

  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>("idle");
  const [generateProgress, setGenerateProgress] = useState(0);

  const handleParseDDL = async () => {
    if (!ddlContent.trim() && !filePath.trim()) {
      setError("请输入文件路径、粘贴 DDL 内容或上传文件");
      setParseStatus("error");
      return;
    }

    setParseStatus("parsing");
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const schema: ParsedSchema = {
      database: "示例数据库",
      tables: mockTables,
    };
    setParsedSchema(schema);
    setSelectedTables(new Set(mockTables.map((t) => t.id)));
    setParseStatus("success");
  };

  const handleConnect = async () => {
    if (!connectionConfig.host || !connectionConfig.database) {
      setError("请填写必要的连接信息");
      setParseStatus("error");
      return;
    }

    setParseStatus("parsing");
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const schema: ParsedSchema = {
      database: connectionConfig.database,
      tables: mockTables,
    };
    setParsedSchema(schema);
    setSelectedTables(new Set(mockTables.map((t) => t.id)));
    setParseStatus("success");
  };

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".sql,.ddl,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        setDdlContent(text);
        setFilePath(file.name);
        setParseStatus("idle");
        setParsedSchema(null);
      }
    };
    input.click();
  };

  const handleSelectOutputDir = () => {
    setOutputPath("/Users/documents/db-docs");
  };

  const handleTemplateFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setCustomTemplatePath(file.name);
      }
    };
    input.click();
  };

  const handleGenerate = async () => {
    setGenerateStatus("generating");
    setGenerateProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setGenerateProgress(i);
    }

    setGenerateStatus("success");
  };

  const toggleTable = (id: string) => {
    const newSet = new Set(selectedTables);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTables(newSet);
  };

  const toggleExpandTable = (id: string) => {
    const newSet = new Set(expandedTables);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedTables(newSet);
  };

  const selectAllTables = () => {
    if (parsedSchema) {
      setSelectedTables(new Set(parsedSchema.tables.map((t) => t.id)));
    }
  };

  const deselectAllTables = () => {
    setSelectedTables(new Set());
  };

  const canGenerate =
    parseStatus === "success" &&
    selectedTables.size > 0 &&
    outputPath !== "" &&
    (templateType === "builtin" || customTemplatePath !== "");

  return (
    <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">数据库文档生成</h2>
        <p className="text-muted-foreground">将数据库结构转换为标准数据字典文档</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              1
            </div>
            导入数据
          </CardTitle>
          <CardDescription>通过 DDL 语句或直接连接数据库导入表结构</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

            <TabsContent value="ddl" className="mt-5 space-y-5">
              <div className="flex gap-3">
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">或直接粘贴内容</span>
                </div>
              </div>

              <Textarea
                placeholder={`CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) NOT NULL COMMENT '用户邮箱',\n  name VARCHAR(100) COMMENT '用户名',\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) COMMENT='用户表';`}
                className="min-h-[160px] font-mono text-sm"
                value={ddlContent}
                onChange={(e) => {
                  setDdlContent(e.target.value);
                  setParseStatus("idle");
                  setParsedSchema(null);
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
            </TabsContent>

            <TabsContent value="connection" className="mt-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="db-type">数据库类型</Label>
                  <Select
                    value={connectionConfig.type}
                    onValueChange={(value) =>
                      setConnectionConfig({ ...connectionConfig, type: value })
                    }
                  >
                    <SelectTrigger id="db-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="sqlserver">SQL Server</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="db-port">端口</Label>
                  <Input
                    id="db-port"
                    placeholder="5432"
                    value={connectionConfig.port}
                    onChange={(e) =>
                      setConnectionConfig({ ...connectionConfig, port: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="db-host">主机地址</Label>
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
                <Label htmlFor="db-name">数据库名称</Label>
                <Input
                  id="db-name"
                  placeholder="mydb"
                  value={connectionConfig.database}
                  onChange={(e) =>
                    setConnectionConfig({ ...connectionConfig, database: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="db-user">用户名</Label>
                  <Input
                    id="db-user"
                    placeholder="postgres"
                    value={connectionConfig.username}
                    onChange={(e) =>
                      setConnectionConfig({ ...connectionConfig, username: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="db-password">密码</Label>
                  <Input
                    id="db-password"
                    type="password"
                    placeholder="••••••••"
                    value={connectionConfig.password}
                    onChange={(e) =>
                      setConnectionConfig({ ...connectionConfig, password: e.target.value })
                    }
                  />
                </div>
              </div>

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
            </TabsContent>
          </Tabs>

          {(parsedSchema || (error && parseStatus === "error")) && (
            <div className="space-y-5 pt-5 border-t">
              {error && parseStatus === "error" && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {parsedSchema && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-600 border-green-500/30"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      解析成功
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {parsedSchema.database} - {parsedSchema.tables.length} 张表
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        数据表 ({selectedTables.size}/{parsedSchema.tables.length})
                      </Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAllTables}>
                          全选
                        </Button>
                        <Button variant="ghost" size="sm" onClick={deselectAllTables}>
                          取消全选
                        </Button>
                      </div>
                      </div>
                    <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                      {parsedSchema.tables.map((table) => (
                        <Collapsible
                          key={table.id}
                          open={expandedTables.has(table.id)}
                          onOpenChange={() => toggleExpandTable(table.id)}
                        >
                          <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50">
                            <Checkbox
                              checked={selectedTables.has(table.id)}
                              onCheckedChange={() => toggleTable(table.id)}
                            />
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex items-center gap-2 flex-1 text-left"
                              >
                                {expandedTables.has(table.id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Table2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono font-medium">{table.name}</span>
                                {table.comment && (
                                  <span className="text-sm text-muted-foreground ml-auto">
                                    {table.comment}
                                  </span>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {table.columns.length} 字段
                                </Badge>
                              </button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="px-4 py-3 bg-muted/30">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-muted-foreground border-b">
                                    <th className="pb-2 font-medium w-8"></th>
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
                                      <td className="py-2 font-mono">{col.name}</td>
                                      <td className="py-2 text-muted-foreground font-mono text-xs">
                                        {col.type}
                                      </td>
                                      <td className="py-2 text-muted-foreground">
                                        {col.nullable ? "YES" : "NO"}
                                      </td>
                                      <td className="py-2 text-muted-foreground font-mono text-xs">
                                        {col.default || "-"}
                                      </td>
                                      <td className="py-2 text-muted-foreground">
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
                                      <Badge key={idx.name} variant="outline" className="text-xs">
                                        {idx.name}
                                        {idx.unique && " (唯一)"}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              2
            </div>
            模版选择
          </CardTitle>
          <CardDescription>选择内置模版或使用自定义模版</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={templateType}
            onValueChange={(value) => setTemplateType(value as "builtin" | "custom")}
            className="gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="builtin" id="db-builtin" />
              <Label htmlFor="db-builtin" className="font-medium cursor-pointer">
                内置模版
              </Label>
              <span className="text-sm text-muted-foreground">- 标准数据字典模版</span>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="db-custom" />
              <Label htmlFor="db-custom" className="font-medium cursor-pointer">
                自定义模版
              </Label>
            </div>
          </RadioGroup>

          {templateType === "custom" && (
            <div className="space-y-3 pl-6 border-l-2 border-muted">
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
        <CardHeader className="pb-4 space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              3
            </div>
            输出目录
          </CardTitle>
          <CardDescription>设置生成文档的保存位置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <Label htmlFor="db-filename">文件名</Label>
            <Input
              id="db-filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          {outputPath && (
            <p className="text-sm text-muted-foreground">
              完整路径: {outputPath}/{fileName}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              4
            </div>
            生成文档
          </CardTitle>
          <CardDescription>确认配置并生成数据字典文档</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  {templateType === "builtin" ? "内置模版" : customTemplatePath || "未选择"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">输出路径</span>
                <span className="font-medium">{outputPath || "未选择"}</span>
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
              <p className="text-sm text-muted-foreground">正在生成文档，请稍候...</p>
            </div>
          )}

          {generateStatus === "success" && (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">文档生成成功!</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                文件已保存至: {outputPath}/{fileName}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generateStatus === "generating"}
              className="flex-1"
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
              <Button variant="outline">
                <FolderOpen className="h-4 w-4" />
                打开目录
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
