import { SimulationCanvas } from '@/components/SimulationCanvas';
import { ParameterPanel } from '@/components/ParameterPanel';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { PlaybackControls } from '@/components/PlaybackControls';
import { useSimulationStore } from '@/store/useSimulationStore';

export function SimulationWorkbench() {
  const { analysisPanelOpen } = useSimulationStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex relative overflow-hidden">
        <ParameterPanel />

        <main className="flex-1 relative">
          <SimulationCanvas />
          <PlaybackControls />
        </main>

        {analysisPanelOpen && <AnalysisPanel />}
      </div>
    </div>
  );
}
