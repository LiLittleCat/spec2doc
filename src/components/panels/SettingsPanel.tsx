import { useState } from "react";
import { Moon, Sun, Monitor, FolderOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsPanel() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("zh");
  const [defaultOutputPath, setDefaultOutputPath] = useState("");
  const [autoSave, setAutoSave] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [defaultTemplate, setDefaultTemplate] = useState("standard");

  const handleSelectDefaultPath = () => {
    setDefaultOutputPath("/Users/user/Documents/Spec2Doc");
  };

  const handleSaveSettings = () => {};

  return (
    <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">设置</h2>
        <p className="text-muted-foreground">配置应用程序偏好设置和默认值</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-4 space-y-1">
            <CardTitle className="text-lg">外观</CardTitle>
            <CardDescription>自定义应用程序的外观和主题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-3">
              <Label>主题</Label>
              <RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                className="flex gap-3"
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
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">简体中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 space-y-1">
            <CardTitle className="text-lg">默认设置</CardTitle>
            <CardDescription>设置文档生成的默认值</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
              <Label htmlFor="default-template">默认模版</Label>
              <Select value={defaultTemplate} onValueChange={setDefaultTemplate}>
                <SelectTrigger id="default-template" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">标准模版</SelectItem>
                  <SelectItem value="minimal">简洁模版</SelectItem>
                  <SelectItem value="detailed">详细模版</SelectItem>
                  <SelectItem value="corporate">企业模版</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 space-y-1">
            <CardTitle className="text-lg">行为</CardTitle>
            <CardDescription>配置应用程序行为</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">自动保存草稿</Label>
                <p className="text-sm text-muted-foreground">
                  在您进行更改时自动保存工作内容
                </p>
              </div>
              <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">显示通知</Label>
                <p className="text-sm text-muted-foreground">任务完成时显示桌面通知</p>
              </div>
              <Switch
                id="notifications"
                checked={showNotifications}
                onCheckedChange={setShowNotifications}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSaveSettings}>
          <Save className="h-4 w-4" />
          保存设置
        </Button>
        <Button variant="outline">恢复默认</Button>
      </div>
    </div>
  );
}
