import { useState } from "react";
import { Sidebar, type AppTab } from "@/components/layout/Sidebar";
import { OpenAPIPanel } from "@/components/panels/OpenAPIPanel";
import { DatabasePanel } from "@/components/panels/DatabasePanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { HelpPanel } from "@/components/panels/HelpPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState<AppTab>("openapi");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {activeTab === "openapi" && <OpenAPIPanel />}
        {activeTab === "database" && <DatabasePanel />}
        {activeTab === "settings" && <SettingsPanel />}
        {activeTab === "help" && <HelpPanel />}
      </main>
    </div>
  );
};

export default Index;
