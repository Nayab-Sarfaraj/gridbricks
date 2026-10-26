import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AssumptionsStrip } from "./components/common/AssumptionsStrip";
import { Header } from "./components/common/Header";
import { ForecastTab } from "./features/forecast/ForecastTab";
import { AccuracyTab } from "./features/accuracy/AccuracyTab";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  const [activeTab, setActiveTab] = useState<"forecast" | "accuracy">("forecast");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
        {/* Always visible assumptions strip */}
        <AssumptionsStrip />

        {/* Header with Branding & Tabs */}
        <Header activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {activeTab === "forecast" ? <ForecastTab /> : <AccuracyTab />}
        </main>

        {/* Simple Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <p>
            Gridbricks &bull; UK Day-Ahead Wind Forecast Accuracy Evaluation &bull; Data Source: Elexon BMRS
            (FUELHH & WINDFOR)
          </p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
