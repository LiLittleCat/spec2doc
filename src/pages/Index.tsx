import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { OpenAPIPanel } from "@/components/panels/OpenAPIPanel";
import { DatabasePanel } from "@/components/panels/DatabasePanel";
import { GeneratePanel } from "@/components/panels/GeneratePanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { HelpPanel } from "@/components/panels/HelpPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("openapi");

  const renderPanel = () => {
    switch (activeTab) {
      case "openapi":
        return <OpenAPIPanel />;
      case "database":
        return <DatabasePanel />;
      case "generate":
        return <GeneratePanel />;
      case "settings":
        return <SettingsPanel />;
      case "help":
        return <HelpPanel />;
      default:
        return <OpenAPIPanel />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-8">
          {renderPanel()}
        </div>
      </main>
    </div>
  );
};

export default Index;
