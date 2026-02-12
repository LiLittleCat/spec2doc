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
