import { Settings, Palette, FileText, Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function SettingsPanel() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          设置
        </h2>
        <p className="text-muted-foreground mt-1">
          配置应用程序和文档输出选项
        </p>
      </div>

      {/* Document Settings */}
      <div className="card-elevated p-6 space-y-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5" />
          文档设置
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">公司/项目名称</Label>
            <Input id="company" placeholder="输入公司或项目名称" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">作者</Label>
            <Input id="author" placeholder="文档作者" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="watermark">水印文字</Label>
            <Input id="watermark" placeholder="留空则不添加水印" />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card-elevated p-6 space-y-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5" />
          外观
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-foreground">使用系统主题</Label>
              <p className="text-sm text-muted-foreground">
                跟随系统设置切换明暗主题
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card-elevated p-6 space-y-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Globe className="w-5 h-5" />
          语言
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-foreground">界面语言</Label>
              <p className="text-sm text-muted-foreground">
                当前：简体中文
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
