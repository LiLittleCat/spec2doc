import { FileJson, Database, FileText, Settings, HelpCircle, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <aside className="w-64 h-screen bg-background p-3">
      <Card className="h-full w-full flex flex-col bg-card text-card-foreground gap-0 py-0">
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Spec2Doc" className="h-6 w-6" />
              <h1 className="text-xl font-bold text-foreground">Spec2Doc</h1>
            </div>
            <p className="text-xs text-muted-foreground">规范驱动的文档生成器</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground cursor-pointer"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Items */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {bottomItems.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground cursor-pointer"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Theme Toggle & Version */}
        <div className="p-3 border-t border-sidebar-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">v1.0.0</p>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-3.5 w-3.5" />
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </Card>
    </aside>
  );
}
