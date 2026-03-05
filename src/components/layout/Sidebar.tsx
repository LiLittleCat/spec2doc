import logo from "@/assets/logo.svg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UpdateDialog } from "@/components/UpdateDialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUpdater } from "@/hooks/use-updater";
import { cn } from "@/lib/utils";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Database, FileJson, Github, HelpCircle, Settings } from "lucide-react";
import { useState } from "react";

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

function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: { id: string; label: string; icon: React.ComponentType<{ className?: string }> };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
      )}
      <item.icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {item.label}
    </button>
  );
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const updater = useUpdater();

  return (
    <aside className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Spec2Doc" className="h-7 w-7" />
          <div>
            <h1 className="text-base font-semibold tracking-tight">Spec2Doc</h1>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              根据规范生成设计文档
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 pt-2 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
          功能
        </p>
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="px-3 pb-2 space-y-1">
        {bottomItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </div>

      {/* Version & GitHub */}
      <div className="mx-3 px-2 py-3 border-t border-sidebar-border flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="relative text-[11px] text-muted-foreground hover:text-foreground transition-colors font-mono tabular-nums"
              onClick={() => updater.hasUpdate && setDialogOpen(true)}
            >
              v{__APP_VERSION__}
              {updater.hasUpdate && (
                <span className="absolute -top-1 -right-2.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {updater.hasUpdate ? `新版本 ${updater.version} 可用` : "已是最新版本"}
          </TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => openUrl("https://github.com/LiLittleCat/spec2doc")}
          >
            <Github className="h-3.5 w-3.5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <UpdateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        status={updater.status}
        version={updater.version}
        body={updater.body}
        date={updater.date}
        progress={updater.progress}
        downloadedBytes={updater.downloadedBytes}
        totalBytes={updater.totalBytes}
        error={updater.error}
        onDownload={updater.downloadAndInstall}
        onRetry={updater.checkForUpdate}
      />
    </aside>
  );
}
