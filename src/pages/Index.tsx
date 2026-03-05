import { type AppTab, Sidebar } from "@/components/layout/Sidebar";
import { DatabasePanel } from "@/components/panels/DatabasePanel";
import { HelpPanel } from "@/components/panels/HelpPanel";
import { OpenAPIPanel } from "@/components/panels/OpenAPIPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<AppTab>("openapi");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden bg-background">
        <div className={activeTab === "openapi" ? "h-full overflow-auto" : "hidden"}>
          <OpenAPIPanel />
        </div>
        <div className={activeTab === "database" ? "h-full overflow-auto" : "hidden"}>
          <DatabasePanel />
        </div>
        <div className={activeTab === "settings" ? "h-full overflow-auto" : "hidden"}>
          <SettingsPanel />
        </div>
        <div className={activeTab === "help" ? "h-full overflow-auto" : "hidden"}>
          <HelpPanel />
        </div>
      </main>
    </div>
  );
};

export default Index;
