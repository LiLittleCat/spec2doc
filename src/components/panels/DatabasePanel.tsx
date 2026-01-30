import { useState } from "react";
import { Database, Server, FileCode, Check, Loader2, TestTube, FolderOpen, FileText, Trash2, List, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface TableInfo {
  name: string;
  columns: number;
  rows: number;
  selected: boolean;
}

export function DatabasePanel() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesLoaded, setTablesLoaded] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [ddlContent, setDdlContent] = useState("");
  const [ddlParsed, setDdlParsed] = useState(false);
  const [templatePath, setTemplatePath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const [dbType, setDbType] = useState("mysql");
  const [sshEnabled, setSshEnabled] = useState(false);
  const [sshOpen, setSshOpen] = useState(false);
  const [sshForm, setSshForm] = useState({
    host: "",
    port: "22",
    username: "",
    password: "",
    privateKey: "",
  });

  const [connectionForm, setConnectionForm] = useState({
    host: "",
    port: "3306",
    database: "",
    username: "",
    password: "",
  });

  const handleConnect = async () => {
    setConnectionStatus("connecting");
    setIsDone(false);
    setTablesLoaded(false);
    setTables([]);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setConnectionStatus("connected");
  };

  const handleLoadTables = async () => {
    setIsLoadingTables(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setTables([
      { name: "users", columns: 12, rows: 1523, selected: true },
      { name: "orders", columns: 18, rows: 8942, selected: true },
      { name: "products", columns: 15, rows: 456, selected: true },
      { name: "categories", columns: 6, rows: 24, selected: true },
      { name: "payments", columns: 10, rows: 7821, selected: true },
    ]);
    setIsLoadingTables(false);
    setTablesLoaded(true);
  };

  const handleDDLUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDdlContent(event.target?.result as string || "");
      };
      reader.readAsText(files[0]);
    }
  };

  const handleParseDDL = async () => {
    if (!ddlContent.trim()) return;
    setIsDone(false);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setDdlParsed(true);
    setTables([
      { name: "users", columns: 4, rows: 0, selected: true },
      { name: "posts", columns: 6, rows: 0, selected: true },
    ]);
  };

  const toggleTable = (tableName: string) => {
    setTables(prev => prev.map(t => 
      t.name === tableName ? { ...t, selected: !t.selected } : t
    ));
  };

  const toggleAllTables = (checked: boolean) => {
    setTables(prev => prev.map(t => ({ ...t, selected: checked })));
  };

  const allSelected = tables.length > 0 && tables.every(t => t.selected);
  const someSelected = tables.some(t => t.selected) && !allSelected;


  const clearData = () => {
    setConnectionStatus("idle");
    setTablesLoaded(false);
    setTables([]);
    setDdlContent("");
    setDdlParsed(false);
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

  const selectedTableCount = tables.filter(t => t.selected).length;
  const hasData = tables.length > 0;
  const canGenerate = hasData && selectedTableCount > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Database className="w-7 h-7 text-primary" />
          数据库结构
        </h2>
        <p className="text-muted-foreground mt-1">
          连接数据库或导入 DDL，生成数据库设计文档
        </p>
      </div>

      {/* Step 1: Import Data */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          1. 导入数据
        </h3>

        <Tabs defaultValue="connect" className="space-y-4">
          <TabsList className="bg-secondary/50 p-1">
            <TabsTrigger value="connect" className="data-[state=active]:bg-card">
              <Server className="w-4 h-4 mr-2" />
              连接数据库
            </TabsTrigger>
            <TabsTrigger value="ddl" className="data-[state=active]:bg-card">
              <FileCode className="w-4 h-4 mr-2" />
              导入 DDL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4">
            <div className="card-elevated p-4 space-y-4">
              {/* Database Type Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs">数据库类型</Label>
                <Select value={dbType} onValueChange={setDbType}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="选择数据库类型" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="sqlserver">SQL Server</SelectItem>
                    <SelectItem value="oracle">Oracle</SelectItem>
                    <SelectItem value="sqlite">SQLite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="host" className="text-xs">主机地址</Label>
                  <Input
                    id="host"
                    placeholder="localhost"
                    value={connectionForm.host}
                    onChange={(e) => setConnectionForm({ ...connectionForm, host: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="port" className="text-xs">端口</Label>
                  <Input
                    id="port"
                    placeholder={dbType === "postgresql" ? "5432" : dbType === "sqlserver" ? "1433" : dbType === "oracle" ? "1521" : "3306"}
                    value={connectionForm.port}
                    onChange={(e) => setConnectionForm({ ...connectionForm, port: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="database" className="text-xs">数据库名</Label>
                  <Input
                    id="database"
                    placeholder="my_database"
                    value={connectionForm.database}
                    onChange={(e) => setConnectionForm({ ...connectionForm, database: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs">用户名</Label>
                  <Input
                    id="username"
                    placeholder="root"
                    value={connectionForm.username}
                    onChange={(e) => setConnectionForm({ ...connectionForm, username: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="password" className="text-xs">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={connectionForm.password}
                    onChange={(e) => setConnectionForm({ ...connectionForm, password: e.target.value })}
                  />
                </div>
              </div>

              {/* SSH Tunnel Configuration */}
              <Collapsible open={sshOpen} onOpenChange={setSshOpen} className="border-t border-border pt-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">SSH 隧道</span>
                    <span className="text-xs text-muted-foreground">{sshEnabled ? "已启用" : "未启用"}</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", sshOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ssh-enabled" className="text-xs">启用 SSH 隧道</Label>
                    <Switch
                      id="ssh-enabled"
                      checked={sshEnabled}
                      onCheckedChange={setSshEnabled}
                    />
                  </div>
                  
                  {sshEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="ssh-host" className="text-xs">SSH 主机</Label>
                        <Input
                          id="ssh-host"
                          placeholder="ssh.example.com"
                          value={sshForm.host}
                          onChange={(e) => setSshForm({ ...sshForm, host: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ssh-port" className="text-xs">SSH 端口</Label>
                        <Input
                          id="ssh-port"
                          placeholder="22"
                          value={sshForm.port}
                          onChange={(e) => setSshForm({ ...sshForm, port: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ssh-username" className="text-xs">SSH 用户名</Label>
                        <Input
                          id="ssh-username"
                          placeholder="root"
                          value={sshForm.username}
                          onChange={(e) => setSshForm({ ...sshForm, username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ssh-password" className="text-xs">SSH 密码</Label>
                        <Input
                          id="ssh-password"
                          type="password"
                          placeholder="••••••••"
                          value={sshForm.password}
                          onChange={(e) => setSshForm({ ...sshForm, password: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label htmlFor="ssh-key" className="text-xs">私钥（可选）</Label>
                        <textarea
                          id="ssh-key"
                          placeholder="-----BEGIN RSA PRIVATE KEY-----"
                          value={sshForm.privateKey}
                          onChange={(e) => setSshForm({ ...sshForm, privateKey: e.target.value })}
                          className="w-full h-20 p-2 rounded-lg bg-background border border-border font-mono text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "status-dot",
                    connectionStatus === "connected" && "connected",
                    connectionStatus === "error" && "error",
                    (connectionStatus === "idle" || connectionStatus === "connecting") && "disconnected"
                  )} />
                  <span className="text-sm text-muted-foreground">
                    {connectionStatus === "idle" && "未连接"}
                    {connectionStatus === "connecting" && "连接中..."}
                    {connectionStatus === "connected" && "已连接"}
                    {connectionStatus === "error" && "连接失败"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleConnect}
                    disabled={connectionStatus === "connecting"}
                    size="sm"
                  >
                    {connectionStatus === "connecting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        连接中
                      </>
                    ) : connectionStatus === "connected" ? (
                      <>
                        <Check className="w-4 h-4" />
                        已连接
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4" />
                        测试连接
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleLoadTables}
                    disabled={connectionStatus !== "connected" || isLoadingTables}
                    size="sm"
                    variant={tablesLoaded ? "outline" : "default"}
                  >
                    {isLoadingTables ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        加载中
                      </>
                    ) : tablesLoaded ? (
                      <>
                        <Check className="w-4 h-4" />
                        已加载
                      </>
                    ) : (
                      <>
                        <List className="w-4 h-4" />
                        加载表
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ddl" className="space-y-4">
            <div className="card-elevated p-4 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".sql,.ddl,.txt"
                  onChange={handleDDLUpload}
                  className="hidden"
                  id="ddl-upload"
                />
                <label
                  htmlFor="ddl-upload"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors text-sm"
                >
                  <FileCode className="w-4 h-4" />
                  选择文件
                </label>
                <span className="text-sm text-muted-foreground">或直接粘贴</span>
              </div>

              <textarea
                placeholder={`CREATE TABLE users (\n  id INT PRIMARY KEY,\n  name VARCHAR(50)\n);`}
                value={ddlContent}
                onChange={(e) => { setDdlContent(e.target.value); setDdlParsed(false); }}
                className="w-full h-32 p-3 rounded-lg bg-background border border-border font-mono text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div className="flex justify-end gap-2">
                {ddlContent && (
                  <Button variant="ghost" size="sm" onClick={() => { setDdlContent(""); setDdlParsed(false); setTables([]); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={handleParseDDL} disabled={!ddlContent.trim()} size="sm">
                  {ddlParsed ? (
                    <>
                      <Check className="w-4 h-4" />
                      已解析
                    </>
                  ) : (
                    "解析 DDL"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tables List */}
        {tables.length > 0 && (
          <div className="card-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">已发现 {tables.length} 张表</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">已选 {selectedTableCount}</span>
                <Button variant="ghost" size="icon" onClick={clearData} className="h-7 w-7">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Select All */}
            <label className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors text-sm border-b border-border">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement).dataset.state = someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked";
                  }
                }}
                onCheckedChange={(checked) => toggleAllTables(checked === true)}
              />
              <span className="font-medium text-foreground">全选</span>
            </label>
            
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {tables.map((table) => (
                <label
                  key={table.name}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-sm",
                    table.selected ? "bg-secondary/50" : "hover:bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={table.selected}
                      onCheckedChange={() => toggleTable(table.name)}
                    />
                    <span className="font-mono text-foreground">{table.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{table.columns} 列</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Step 2: Template Path */}
      <section className={cn("space-y-4 transition-opacity", !hasData && "opacity-50 pointer-events-none")}>
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
      <section className={cn("space-y-4 transition-opacity", !hasData && "opacity-50 pointer-events-none")}>
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
                已生成数据库设计文档，共 {selectedTableCount} 张表
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
