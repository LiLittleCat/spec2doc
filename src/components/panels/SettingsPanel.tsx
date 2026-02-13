import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { getDefaultDocumentsPath } from "@/lib/defaultPath";
import {
  getDefaultGenerationSettings,
  readGenerationSettings,
  saveGenerationSettings,
} from "@/lib/generationSettings";
import {
  DEFAULT_API_TEMPLATE_PLACEHOLDER,
  DEFAULT_DB_TEMPLATE_PLACEHOLDER,
  readTemplateSettings,
  saveTemplateSettings,
} from "@/lib/templateSettings";
import { documentService } from "@/services/documentService";
import { open } from "@tauri-apps/plugin-dialog";
import { File, FolderOpen, Monitor, Moon, RotateCcw, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const [defaultOutputPath, setDefaultOutputPath] = useState("");
  const [repeatTableHeaderOnPageBreak, setRepeatTableHeaderOnPageBreak] = useState(
    getDefaultGenerationSettings().repeatTableHeaderOnPageBreak,
  );
  const [apiTemplatePath, setApiTemplatePath] = useState(DEFAULT_API_TEMPLATE_PLACEHOLDER);
  const [dbTemplatePath, setDbTemplatePath] = useState(DEFAULT_DB_TEMPLATE_PLACEHOLDER);
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
        apiResult.status === "fulfilled" ? apiResult.value : DEFAULT_API_TEMPLATE_PLACEHOLDER;
      const resolvedDefaultDbTemplatePath =
        dbResult.status === "fulfilled" ? dbResult.value : DEFAULT_DB_TEMPLATE_PLACEHOLDER;

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

      setRepeatTableHeaderOnPageBreak(generationSettings.repeatTableHeaderOnPageBreak);
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
      // Silent fail
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
      // Silent fail
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

    const normalizedDbTemplatePath = normalizeRequiredPath(dbTemplatePath, defaultDbTemplatePath);
    applyTemplateSettings(apiTemplatePath, normalizedDbTemplatePath);
  };

  const handleUseDefaultTemplate = (type: "api" | "db") => {
    if (type === "api") {
      applyTemplateSettings(defaultApiTemplatePath, dbTemplatePath);
      return;
    }
    applyTemplateSettings(apiTemplatePath, defaultDbTemplatePath);
  };

  const handleRepeatTableHeaderChange = (checked: boolean) => {
    setRepeatTableHeaderOnPageBreak(checked);
    saveGenerationSettings({ repeatTableHeaderOnPageBreak: checked });
  };

  const handleResetAll = async () => {
    const defaultGeneration = getDefaultGenerationSettings();
    setRepeatTableHeaderOnPageBreak(defaultGeneration.repeatTableHeaderOnPageBreak);
    saveGenerationSettings(defaultGeneration);
    applyTemplateSettings(defaultApiTemplatePath, defaultDbTemplatePath);
    const documentsPath = await getDefaultDocumentsPath();
    if (documentsPath) {
      setDefaultOutputPath(documentsPath);
    }
  };

  return (
    <div className="flex flex-col gap-10 p-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="w-7 h-7" />
          <span>设置</span>
        </h2>
        <p className="text-muted-foreground">配置应用程序偏好设置和默认值</p>
      </div>

      {/* Appearance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg font-semibold">外观</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">自定义应用程序的外观和主题</p>
        </div>

        <div className="pl-9 space-y-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">主题</label>
            <RadioGroup
              value={theme ?? "system"}
              onValueChange={(value) => setTheme(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  浅色
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  深色
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  跟随系统
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">语言</label>
            <Input value="简体中文（当前仅支持中文）" readOnly className="max-w-xs" />
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Document Generation Settings */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg font-semibold">文档生成</h3>
          <span className="text-sm text-muted-foreground/60">·</span>
          <p className="text-sm text-muted-foreground">设置输出目录、模板路径和生成选项</p>
        </div>

        <div className="pl-9 space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">默认输出目录</label>
            <div className="flex gap-2">
              <Input
                value={defaultOutputPath}
                onChange={(e) => setDefaultOutputPath(e.target.value)}
                placeholder="选择默认输出目录..."
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSelectDefaultPath}>
                <FolderOpen className="h-4 w-4" />
                浏览
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">OpenAPI 模板路径</label>
            <div className="flex gap-2">
              <Input
                value={apiTemplatePath}
                onChange={(e) => setApiTemplatePath(e.target.value)}
                onBlur={() => handleTemplatePathBlur("api")}
                placeholder="输入模板文件路径或使用默认模板"
                className="flex-1"
              />
              <Button variant="outline" onClick={() => handleSelectTemplateFile("api")}>
                <File className="h-4 w-4" />
                选择文件
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">数据库模板路径</label>
            <div className="flex gap-2">
              <Input
                value={dbTemplatePath}
                onChange={(e) => setDbTemplatePath(e.target.value)}
                onBlur={() => handleTemplatePathBlur("db")}
                placeholder="输入模板文件路径或使用默认模板"
                className="flex-1"
              />
              <Button variant="outline" onClick={() => handleSelectTemplateFile("db")}>
                <File className="h-4 w-4" />
                选择文件
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">表格标题跨页重复</label>
              <p className="text-xs text-muted-foreground">
                在数据库文档中，当表格跨页时是否在每页重复显示表头
              </p>
            </div>
            <Switch
              checked={repeatTableHeaderOnPageBreak}
              onCheckedChange={handleRepeatTableHeaderChange}
            />
          </div>

          <Button variant="outline" onClick={handleResetAll}>
            <RotateCcw className="h-4 w-4" />
            恢复默认
          </Button>
        </div>
      </section>
    </div>
  );
}
