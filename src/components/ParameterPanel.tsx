import { useState } from 'react';
import {
  Cat,
  Scissors,
  Thermometer,
  Droplets,
  Zap,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Ruler,
  Layers,
  Shield,
  Wind,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { CAT_BREED_PRESETS, COMB_CONFIGS, COMB_NAMES } from '@/shared/constants';
import type { CombType } from '@/shared/types';
import { cn } from '@/lib/utils';

interface PanelSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function PanelSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: PanelSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-blue-400">{icon}</span>
          <span className="font-medium text-slate-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  format?: (value: number) => string;
}

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  unit = '',
  format,
}: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-blue-400 font-mono">
          {format ? format(value) : `${(value * 100).toFixed(0)}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-slate-600">
        <span>{format ? format(min) : `${(min * 100).toFixed(0)}${unit}`}</span>
        <span>{format ? format(max) : `${(max * 100).toFixed(0)}${unit}`}</span>
      </div>
    </div>
  );
}

export function ParameterPanel() {
  const {
    hairParams,
    setHairParams,
    resetHairParams,
    selectedBreed,
    loadBreedPreset,
    combType,
    setCombType,
    environmentParams,
    setEnvironmentParams,
  } = useSimulationStore();

  return (
    <div className="w-80 h-full bg-slate-900/90 backdrop-blur-xl border-r border-slate-700/50 p-4 overflow-y-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-100">参数控制</h2>
        <button
          onClick={resetHairParams}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          title="重置参数"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <PanelSection title="猫咪品种" icon={<Cat className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-2">
          {CAT_BREED_PRESETS.map((breed) => (
            <button
              key={breed.id}
              onClick={() => loadBreedPreset(breed.id)}
              className={cn(
                'p-2 rounded-lg text-xs text-left transition-all border',
                selectedBreed?.id === breed.id
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              )}
            >
              <div className="font-medium truncate">{breed.name}</div>
              <div className="text-[10px] text-slate-500 truncate">
                {breed.description.slice(0, 10)}...
              </div>
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="毛发参数" icon={<Layers className="w-4 h-4" />}>
        <Slider
          label="长度"
          value={hairParams.length}
          onChange={(v) => setHairParams({ length: v })}
          format={(v) => `${(v * 9 + 0.5).toFixed(1)} cm`}
        />
        <Slider
          label="密度"
          value={hairParams.density}
          onChange={(v) => setHairParams({ density: v })}
          format={(v) => `${Math.floor(10000 + v * 90000).toLocaleString()} 根`}
        />
        <Slider
          label="硬度"
          value={hairParams.stiffness}
          onChange={(v) => setHairParams({ stiffness: v })}
        />
        <Slider
          label="卷曲度"
          value={hairParams.curliness}
          onChange={(v) => setHairParams({ curliness: v })}
        />
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">颜色</span>
          </div>
          <div className="flex gap-2">
            {['#8B4513', '#FFFFFF', '#000000', '#6B7280', '#D2691E', '#FFD700'].map(
              (color) => (
                <button
                  key={color}
                  onClick={() => setHairParams({ color })}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    hairParams.color === color
                      ? 'border-blue-500 scale-110'
                      : 'border-slate-600'
                  )}
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
        </div>
      </PanelSection>

      <PanelSection title="梳子选择" icon={<Scissors className="w-4 h-4" />}>
        <div className="space-y-2">
          {(Object.keys(COMB_CONFIGS) as CombType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCombType(type)}
              className={cn(
                'w-full p-3 rounded-lg text-left transition-all border flex items-center gap-3',
                combType === type
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  combType === type ? 'bg-blue-500/30' : 'bg-slate-600/30'
                )}
              >
                <Scissors
                  className={cn(
                    'w-5 h-5',
                    combType === type ? 'text-blue-400' : 'text-slate-400'
                  )}
                />
              </div>
              <div>
                <div
                  className={cn(
                    'font-medium',
                    combType === type ? 'text-blue-300' : 'text-slate-300'
                  )}
                >
                  {COMB_NAMES[type]}
                </div>
                <div className="text-xs text-slate-500">
                  齿间距 {COMB_CONFIGS[type].toothSpacing}mm · 齿长{' '}
                  {COMB_CONFIGS[type].toothLength}mm
                </div>
              </div>
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="环境参数" icon={<Thermometer className="w-4 h-4" />}>
        <Slider
          label="温度"
          value={environmentParams.temperature}
          onChange={(v) => setEnvironmentParams({ temperature: v })}
          min={0}
          max={40}
          step={1}
          format={(v) => `${v.toFixed(0)}°C`}
        />
        <Slider
          label="湿度"
          value={environmentParams.humidity}
          onChange={(v) => setEnvironmentParams({ humidity: v })}
          min={0}
          max={100}
          step={1}
          format={(v) => `${v.toFixed(0)}%`}
        />
        <Slider
          label="静电系数"
          value={environmentParams.staticCoefficient}
          onChange={(v) => setEnvironmentParams({ staticCoefficient: v })}
        />
      </PanelSection>
    </div>
  );
}
