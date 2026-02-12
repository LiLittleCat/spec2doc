import { FileJson, Database, Settings, HelpCircle, Github } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.svg";

export type AppTab = "openapi" | "database" | "settings" | "help";

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const navItems = [
  { id: "openapi" as const, label: "OpenAPI", icon: FileJson },
  { id: "database" as const, label: "数据库", icon: Database },
];

const bottomItems = [
  { id: "settings" as const, label: "设置", icon: Settings },
  { id: "help" as const, label: "帮助", icon: HelpCircle },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Spec2Doc" className="h-6 w-6" />
            <h1 className="text-xl font-bold">Spec2Doc</h1>
          </div>
          <p className="text-xs text-muted-foreground">根据规范生成 word 设计文档</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start ${activeTab === item.id ? "bg-foreground/10 text-foreground font-medium" : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="p-4 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start ${activeTab === item.id ? "bg-foreground/10 text-foreground font-medium" : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Button>
        ))}
      </div>

      {/* Version & GitHub */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">v{__APP_VERSION__}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openUrl("https://github.com/LiLittleCat/spec2doc")}>
            <Github className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
