import { NavLink, useLocation } from 'react-router-dom';
import {
  Scissors,
  BarChart3,
  Activity,
  Settings,
  Github,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/simulation',
    label: '仿真工作台',
    icon: Scissors,
  },
  {
    path: '/data',
    label: '数据导出',
    icon: BarChart3,
  },
  {
    path: '/monitor',
    label: '性能监控',
    icon: Activity,
  },
  {
    path: '/settings',
    label: '系统设置',
    icon: Settings,
  },
];

export function Navbar() {
  const location = useLocation();
  const { performanceMetrics } = useSimulationStore();

  return (
    <nav className="h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              毛发物理仿真系统
            </h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">
              Pet Hair Physics Simulation Lab
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">FPS</span>
            <span
              className={cn(
                'font-bold',
                performanceMetrics.fps >= 60
                  ? 'text-green-400'
                  : performanceMetrics.fps >= 30
                  ? 'text-yellow-400'
                  : 'text-red-400'
              )}
            >
              {performanceMetrics.fps.toFixed(0)}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500">帧时间</span>
            <span className="text-blue-400">
              {performanceMetrics.frameTime.toFixed(1)}ms
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500">内存</span>
            <span className="text-purple-400">
              {performanceMetrics.memoryUsage.toFixed(0)}MB
            </span>
          </div>
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </nav>
  );
}
