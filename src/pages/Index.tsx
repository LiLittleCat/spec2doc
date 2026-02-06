import { useState } from "react";
import { Sidebar, type AppTab } from "@/components/layout/Sidebar";
import { OpenAPIPanel } from "@/components/panels/OpenAPIPanel";
import { DatabasePanel } from "@/components/panels/DatabasePanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { HelpPanel } from "@/components/panels/HelpPanel";
import { TemplateGuidePanel } from "@/components/panels/TemplateGuidePanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState<AppTab>("openapi");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className={activeTab === "openapi" ? "block" : "hidden"}>
          <OpenAPIPanel />
        </div>
        <div className={activeTab === "database" ? "block" : "hidden"}>
          <DatabasePanel />
        </div>
        <div className={activeTab === "template-guide" ? "block" : "hidden"}>
          <TemplateGuidePanel />
        </div>
        <div className={activeTab === "settings" ? "block" : "hidden"}>
          <SettingsPanel />
        </div>
        <div className={activeTab === "help" ? "block" : "hidden"}>
          <HelpPanel />
        </div>
      </main>
    </div>
  );
};

export default Index;
