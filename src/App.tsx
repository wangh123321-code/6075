import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SimulationWorkbench } from '@/pages/SimulationWorkbench';
import { DataExport } from '@/pages/DataExport';
import { PerformanceMonitor } from '@/pages/PerformanceMonitor';
import { SystemSettings } from '@/pages/SystemSettings';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/simulation" replace />} />
        <Route path="/simulation" element={<SimulationWorkbench />} />
        <Route path="/data" element={<DataExport />} />
        <Route path="/monitor" element={<PerformanceMonitor />} />
        <Route path="/settings" element={<SystemSettings />} />
      </Routes>
    </div>
    </Router>
  );
}
