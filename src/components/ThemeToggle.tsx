import { Moon, Sun } from "lucide-react";
import { Button } from "@heroui/react";
import { useTheme as useNextTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      onPress={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
