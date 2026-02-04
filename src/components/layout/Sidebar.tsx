import { FileJson, Database, Settings, HelpCircle, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "openapi", label: "OpenAPI", icon: FileJson },
  { id: "database", label: "数据库", icon: Database },
];

const bottomItems = [
  { id: "settings", label: "设置", icon: Settings },
  { id: "help", label: "帮助", icon: HelpCircle },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 flex h-screen flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Spec2Doc" className="h-7 w-7" />
            <h1 className="text-2xl font-bold text-foreground">Spec2Doc</h1>
          </div>
          <p className="text-sm text-muted-foreground">规范驱动的文档生成器</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground cursor-pointer"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="p-4 border-t border-sidebar-border space-y-1.5">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground cursor-pointer"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Button>
        ))}
      </div>

      {/* Theme Toggle & Version */}
      <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
