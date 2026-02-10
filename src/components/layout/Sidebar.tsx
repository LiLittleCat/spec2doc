import { FileJson, Database, Settings, HelpCircle, Github } from "lucide-react";
import { Button } from "@heroui/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.svg";

export type AppTab =
  | "openapi"
  | "database"
  | "settings"
  | "help";

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
    <aside className="w-64 h-screen bg-content1 border-r border-divider flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-divider">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Spec2Doc" className="h-6 w-6" />
            <h1 className="text-xl font-bold">Spec2Doc</h1>
          </div>
          <p className="text-xs text-default-500">根据规范生成 word 设计文档</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "flat" : "light"}
            color={activeTab === item.id ? "primary" : "default"}
            className="w-full justify-start"
            onPress={() => onTabChange(item.id)}
            startContent={<item.icon className="w-4 h-4" />}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="p-4 border-t border-divider space-y-1">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "flat" : "light"}
            color={activeTab === item.id ? "primary" : "default"}
            className="w-full justify-start"
            onPress={() => onTabChange(item.id)}
            startContent={<item.icon className="w-4 h-4" />}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {/* Version & GitHub */}
      <div className="p-4 border-t border-divider flex items-center justify-between">
        <p className="text-xs text-default-500">v1.0.0</p>
        <div className="flex items-center gap-1">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            as="a"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
