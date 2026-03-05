import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme as useNextTheme } from "next-themes";

const themeOrder = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useNextTheme();

  const toggleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme as (typeof themeOrder)[number]);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const icon = {
    light: <Sun className="h-3.5 w-3.5" />,
    dark: <Moon className="h-3.5 w-3.5" />,
    system: <Monitor className="h-3.5 w-3.5" />,
  }[theme ?? "system"];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={toggleTheme}
    >
      {icon}
    </Button>
  );
}
