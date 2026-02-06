import { useEffect, useState } from "react";
import { Moon, Sun, Monitor, FolderOpen, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import { getDefaultDocumentsPath } from "@/lib/defaultPath";
import {
  getDefaultGenerationSettings,
  readGenerationSettings,
  saveGenerationSettings,
} from "@/lib/generationSettings";
import { documentService } from "@/services/documentService";
import {
  DEFAULT_API_TEMPLATE_PLACEHOLDER,
  DEFAULT_DB_TEMPLATE_PLACEHOLDER,
  readTemplateSettings,
  saveTemplateSettings,
} from "@/lib/templateSettings";
import { open } from "@tauri-apps/plugin-dialog";

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [defaultOutputPath, setDefaultOutputPath] = useState("");
  const [repeatTableHeaderOnPageBreak, setRepeatTableHeaderOnPageBreak] =
    useState(
      getDefaultGenerationSettings().repeatTableHeaderOnPageBreak,
    );
  const [apiTemplatePath, setApiTemplatePath] = useState(
    DEFAULT_API_TEMPLATE_PLACEHOLDER,
  );
  const [dbTemplatePath, setDbTemplatePath] = useState(
    DEFAULT_DB_TEMPLATE_PLACEHOLDER,
  );
  const [defaultApiTemplatePath, setDefaultApiTemplatePath] = useState(
    DEFAULT_API_TEMPLATE_PLACEHOLDER,
  );
  const [defaultDbTemplatePath, setDefaultDbTemplatePath] = useState(
    DEFAULT_DB_TEMPLATE_PLACEHOLDER,
  );

  useEffect(() => {
    let isCancelled = false;

    const initializeSettings = async () => {
      const storedSettings = readTemplateSettings();
      const generationSettings = readGenerationSettings();
      const [documentsPath, apiResult, dbResult] = await Promise.allSettled([
        getDefaultDocumentsPath(),
        documentService.getBuiltInApiTemplatePath(),
        documentService.getBuiltInDbTemplatePath(),
      ]);

      if (isCancelled) {
        return;
      }

      if (documentsPath.status === "fulfilled" && documentsPath.value) {
        setDefaultOutputPath(documentsPath.value);
      }

      const resolvedDefaultApiTemplatePath =
        apiResult.status === "fulfilled"
          ? apiResult.value
          : DEFAULT_API_TEMPLATE_PLACEHOLDER;
      const resolvedDefaultDbTemplatePath =
        dbResult.status === "fulfilled"
          ? dbResult.value
          : DEFAULT_DB_TEMPLATE_PLACEHOLDER;

      setDefaultApiTemplatePath(resolvedDefaultApiTemplatePath);
      setDefaultDbTemplatePath(resolvedDefaultDbTemplatePath);

      const normalizedApiTemplatePath =
        storedSettings.apiTemplatePath === DEFAULT_API_TEMPLATE_PLACEHOLDER
          ? resolvedDefaultApiTemplatePath
          : storedSettings.apiTemplatePath.trim() || resolvedDefaultApiTemplatePath;
      const normalizedDbTemplatePath =
        storedSettings.dbTemplatePath === DEFAULT_DB_TEMPLATE_PLACEHOLDER
          ? resolvedDefaultDbTemplatePath
          : storedSettings.dbTemplatePath.trim() || resolvedDefaultDbTemplatePath;

      setRepeatTableHeaderOnPageBreak(
        generationSettings.repeatTableHeaderOnPageBreak,
      );
      setApiTemplatePath(normalizedApiTemplatePath);
      setDbTemplatePath(normalizedDbTemplatePath);
      saveTemplateSettings({
        apiTemplatePath: normalizedApiTemplatePath,
        dbTemplatePath: normalizedDbTemplatePath,
      });
    };

    void initializeSettings();

    return () => {
      isCancelled = true;
    };
  }, []);

  const normalizeRequiredPath = (value: string, fallback: string) => {
    const trimmed = value.trim();
    return trimmed || fallback;
  };

  const applyTemplateSettings = (nextApiTemplatePath: string, nextDbTemplatePath: string) => {
    setApiTemplatePath(nextApiTemplatePath);
    setDbTemplatePath(nextDbTemplatePath);
    saveTemplateSettings({
      apiTemplatePath: nextApiTemplatePath,
      dbTemplatePath: nextDbTemplatePath,
    });
  };

  const handleSelectDefaultPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: defaultOutputPath || undefined,
      });

      if (selected) {
        setDefaultOutputPath(selected as string);
      }
    } catch {
      // 保留静默失败，避免阻断设置页面
    }
  };

  const handleSelectTemplateFile = async (type: "api" | "db") => {
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

      if (!selected) {
        return;
      }

      const selectedPath = selected as string;
      if (type === "api") {
        applyTemplateSettings(selectedPath, dbTemplatePath);
      } else {
        applyTemplateSettings(apiTemplatePath, selectedPath);
      }
    } catch {
      // 保留静默失败，避免阻断设置页面
    }
  };

  const handleTemplatePathBlur = (type: "api" | "db") => {
    if (type === "api") {
      const normalizedApiTemplatePath = normalizeRequiredPath(
        apiTemplatePath,
        defaultApiTemplatePath,
      );
      applyTemplateSettings(normalizedApiTemplatePath, dbTemplatePath);
      return;
    }

    const normalizedDbTemplatePath = normalizeRequiredPath(
      dbTemplatePath,
      defaultDbTemplatePath,
    );
    applyTemplateSettings(apiTemplatePath, normalizedDbTemplatePath);
  };

  const handleUseDefaultTemplate = (type: "api" | "db") => {
    if (type === "api") {
      applyTemplateSettings(defaultApiTemplatePath, dbTemplatePath);
      return;
    }
    applyTemplateSettings(apiTemplatePath, defaultDbTemplatePath);
  };

  return (
    <div className="flex flex-col gap-5 p-6 max-w-6xl mx-auto">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">设置</h2>
        <p className="text-muted-foreground leading-relaxed">配置应用程序偏好设置和默认值</p>
      </div>

      <div className="grid gap-5">
        <Card>
          <CardHeader className="pb-3 space-y-1.5">
            <CardTitle className="text-lg">外观</CardTitle>
            <CardDescription className="leading-relaxed">自定义应用程序的外观和主题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Label>主题</Label>
              <RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                className="flex gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="font-normal flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    浅色
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="font-normal flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    深色
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="font-normal flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    跟随系统
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="language">语言</Label>
              <Input
                id="language"
                value="简体中文（当前仅支持中文）"
                readOnly
                className="w-[240px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 space-y-1.5">
            <CardTitle className="text-lg">默认设置</CardTitle>
            <CardDescription className="leading-relaxed">设置文档生成的默认值</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="default-output">默认输出目录</Label>
              <div className="flex gap-2">
                <Input
                  id="default-output"
                  placeholder="选择默认输出目录..."
                  value={defaultOutputPath}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleSelectDefaultPath}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="default-api-template">OpenAPI 默认模版</Label>
              <div className="flex gap-2">
                <Input
                  id="default-api-template"
                  value={apiTemplatePath}
                  onChange={(e) => setApiTemplatePath(e.target.value)}
                  onBlur={() => handleTemplatePathBlur("api")}
                  placeholder="选择接口文档默认模版..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleSelectTemplateFile("api");
                  }}
                >
                  <File className="h-4 w-4" />
                  选择文件
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUseDefaultTemplate("api")}
                >
                  恢复默认
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="default-db-template">数据库默认模版</Label>
              <div className="flex gap-2">
                <Input
                  id="default-db-template"
                  value={dbTemplatePath}
                  onChange={(e) => setDbTemplatePath(e.target.value)}
                  onBlur={() => handleTemplatePathBlur("db")}
                  placeholder="选择数据库文档默认模版..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleSelectTemplateFile("db");
                  }}
                >
                  <File className="h-4 w-4" />
                  选择文件
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUseDefaultTemplate("db")}
                >
                  恢复默认
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 space-y-1.5">
            <CardTitle className="text-lg">行为</CardTitle>
            <CardDescription className="leading-relaxed">配置应用程序行为</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label htmlFor="repeat-table-header" className="font-medium">
                  表格跨页重复表头
                </Label>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  开启后，表格跨页时新页自动显示表头；关闭后仅首页显示表头
                </p>
              </div>
              <Switch
                id="repeat-table-header"
                checked={repeatTableHeaderOnPageBreak}
                onCheckedChange={(checked) => {
                  setRepeatTableHeaderOnPageBreak(checked);
                  saveGenerationSettings({
                    repeatTableHeaderOnPageBreak: checked,
                  });
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
