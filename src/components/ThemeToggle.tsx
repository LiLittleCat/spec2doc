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
    light: <Moon className="h-4 w-4" />,
    dark: <Sun className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  }[theme ?? "system"];

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
      {icon}
    </Button>
  );
}
