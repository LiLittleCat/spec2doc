import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { UpdateStatus } from "@/hooks/use-updater";
import { AlertCircle, Download, RefreshCw } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: UpdateStatus;
  version: string;
  body: string;
  date: string;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  error: string;
  onDownload: () => void;
  onRetry: () => void;
}

export function UpdateDialog({
  open,
  onOpenChange,
  status,
  version,
  body,
  date,
  progress,
  downloadedBytes,
  totalBytes,
  error,
  onDownload,
  onRetry,
}: UpdateDialogProps) {
  const isDownloading = status === "downloading" || status === "ready";

  return (
    <Dialog open={open} onOpenChange={isDownloading ? undefined : onOpenChange}>
      <DialogContent showCloseButton={!isDownloading}>
        {status === "error" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                更新失败
              </DialogTitle>
              <DialogDescription>{error}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              <Button onClick={onRetry}>
                <RefreshCw className="h-4 w-4" />
                重试
              </Button>
            </DialogFooter>
          </>
        ) : isDownloading ? (
          <>
            <DialogHeader>
              <DialogTitle>正在下载更新...</DialogTitle>
              <DialogDescription>请勿关闭应用，下载完成后将自动重启。</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}%</span>
                <span>
                  {formatBytes(downloadedBytes)}
                  {totalBytes > 0 && ` / ${formatBytes(totalBytes)}`}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                发现新版本
                <Badge>{version}</Badge>
              </DialogTitle>
              {date && (
                <DialogDescription>
                  发布于 {new Date(date).toLocaleDateString("zh-CN")}
                </DialogDescription>
              )}
            </DialogHeader>
            {body && (
              <div className="max-h-48 overflow-y-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                {body}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                稍后提醒
              </Button>
              <Button onClick={onDownload}>
                <Download className="h-4 w-4" />
                立即更新
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
