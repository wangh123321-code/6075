import { useState, useEffect } from 'react';
import {
  Cat,
  Scissors,
  Thermometer,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Ruler,
  Layers,
  Shield,
  Wind,
  Settings,
  Save,
  Trash2,
  Download,
  Circle,
  Triangle,
  Octagon,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import {
  CAT_BREED_PRESETS,
  COMB_CONFIGS,
  COMB_NAMES,
  TOOTH_TIP_SHAPE_NAMES,
  MATERIAL_TYPE_NAMES,
} from '@/shared/constants';
import type { CombType, ToothTipShape, MaterialType } from '@/shared/types';
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
    customCombParams,
    setCustomCombParams,
    resetCustomCombParams,
    combPresets,
    saveCombPreset,
    loadCombPreset,
    deleteCombPreset,
    loadCombPresets,
  } = useSimulationStore();

  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [showPresetList, setShowPresetList] = useState(false);

  useEffect(() => {
    loadCombPresets();
  }, [loadCombPresets]);

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
          <button
            onClick={() => {
              setCombType('custom');
              setShowPresetList(false);
            }}
            className={cn(
              'w-full p-3 rounded-lg text-left transition-all border flex items-center gap-3',
              combType === 'custom'
                ? 'bg-purple-500/20 border-purple-500'
                : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                combType === 'custom' ? 'bg-purple-500/30' : 'bg-slate-600/30'
              )}
            >
              <Settings
                className={cn(
                  'w-5 h-5',
                  combType === 'custom' ? 'text-purple-400' : 'text-slate-400'
                )}
              />
            </div>
            <div>
              <div
                className={cn(
                  'font-medium',
                  combType === 'custom' ? 'text-purple-300' : 'text-slate-300'
                )}
              >
                自定义设计
              </div>
              <div className="text-xs text-slate-500">
                自定义梳子各项参数，实时预览
              </div>
            </div>
          </button>
        </div>
      </PanelSection>

      {combType === 'custom' && (
        <>
          <PanelSection title="自定义梳子设计器" icon={<Settings className="w-4 h-4" />} defaultOpen={true}>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPresetList(!showPresetList)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border flex items-center justify-center gap-2',
                    showPresetList
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/50'
                  )}
                >
                  <Download className="w-3.5 h-3.5" />
                  我的预设 ({combPresets.length})
                </button>
                <button
                  onClick={() => setShowSavePresetModal(true)}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存预设
                </button>
                <button
                  onClick={resetCustomCombParams}
                  className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-700/30 border border-slate-600/50 text-slate-400 hover:bg-slate-700/50 transition-all"
                  title="重置参数"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {showPresetList && combPresets.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {combPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-2 rounded-lg bg-slate-700/30 border border-slate-600/50 flex items-center gap-3"
                    >
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">
                          {preset.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {preset.description}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => loadCombPreset(preset.id)}
                          className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                          title="加载预设"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCombPreset(preset.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                          title="删除预设"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-700/50 pt-4 space-y-4">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-blue-400" />
                  几何参数
                </h4>

                <Slider
                  label="齿数"
                  value={customCombParams.toothCount}
                  onChange={(v) => setCustomCombParams({ toothCount: Math.round(v) })}
                  min={3}
                  max={30}
                  step={1}
                  format={(v) => `${Math.round(v)} 齿`}
                />

                <Slider
                  label="齿间距"
                  value={customCombParams.toothSpacing}
                  onChange={(v) => setCustomCombParams({ toothSpacing: v })}
                  min={0.5}
                  max={10}
                  step={0.1}
                  format={(v) => `${v.toFixed(1)} mm`}
                />

                <Slider
                  label="齿长度"
                  value={customCombParams.toothLength}
                  onChange={(v) => setCustomCombParams({ toothLength: v })}
                  min={5}
                  max={30}
                  step={0.5}
                  format={(v) => `${v.toFixed(1)} mm`}
                />

                <Slider
                  label="齿直径"
                  value={customCombParams.toothDiameter}
                  onChange={(v) => setCustomCombParams({ toothDiameter: v })}
                  min={0.3}
                  max={3}
                  step={0.1}
                  format={(v) => `${v.toFixed(1)} mm`}
                />

                <Slider
                  label="齿锥度"
                  value={customCombParams.toothTaper}
                  onChange={(v) => setCustomCombParams({ toothTaper: v })}
                  min={0}
                  max={0.8}
                  step={0.05}
                  format={(v) => `${(v * 100).toFixed(0)}%`}
                />

                <Slider
                  label="底座宽度"
                  value={customCombParams.baseWidth}
                  onChange={(v) => setCustomCombParams({ baseWidth: v })}
                  min={30}
                  max={120}
                  step={1}
                  format={(v) => `${Math.round(v)} mm`}
                />
              </div>

              <div className="border-t border-slate-700/50 pt-4 space-y-4">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  手柄参数
                </h4>

                <Slider
                  label="手柄长度"
                  value={customCombParams.handleLength}
                  onChange={(v) => setCustomCombParams({ handleLength: v })}
                  min={60}
                  max={200}
                  step={1}
                  format={(v) => `${Math.round(v)} mm`}
                />

                <Slider
                  label="手柄宽度"
                  value={customCombParams.handleWidth}
                  onChange={(v) => setCustomCombParams({ handleWidth: v })}
                  min={10}
                  max={40}
                  step={1}
                  format={(v) => `${Math.round(v)} mm`}
                />

                <Slider
                  label="手柄厚度"
                  value={customCombParams.handleThickness}
                  onChange={(v) => setCustomCombParams({ handleThickness: v })}
                  min={3}
                  max={15}
                  step={1}
                  format={(v) => `${Math.round(v)} mm`}
                />
              </div>

              <div className="border-t border-slate-700/50 pt-4 space-y-4">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  齿端形状
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {(['round', 'pointed', 'spherical'] as ToothTipShape[]).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setCustomCombParams({ toothTipShape: shape })}
                      className={cn(
                        'p-3 rounded-lg text-xs transition-all border flex flex-col items-center gap-2',
                        customCombParams.toothTipShape === shape
                          ? 'bg-green-500/20 border-green-500 text-green-300'
                          : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/50'
                      )}
                    >
                      {shape === 'round' && <Circle className="w-5 h-5" />}
                      {shape === 'pointed' && <Triangle className="w-5 h-5" />}
                      {shape === 'spherical' && <Octagon className="w-5 h-5" />}
                      <span>{TOOTH_TIP_SHAPE_NAMES[shape]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-4 space-y-4">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-amber-400" />
                  材质属性
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['plastic', 'metal', 'wood', 'silicone'] as MaterialType[]).map((material) => (
                    <button
                      key={material}
                      onClick={() => setCustomCombParams({ materialType: material })}
                      className={cn(
                        'p-2.5 rounded-lg text-xs transition-all border',
                        customCombParams.materialType === material
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/50'
                      )}
                    >
                      {MATERIAL_TYPE_NAMES[material]}
                    </button>
                  ))}
                </div>

                <Slider
                  label="材质硬度"
                  value={customCombParams.stiffness}
                  onChange={(v) => setCustomCombParams({ stiffness: v })}
                  min={0.1}
                  max={1}
                  step={0.05}
                  format={(v) => `${(v * 100).toFixed(0)}%`}
                />
              </div>
            </div>
          </PanelSection>

          {showSavePresetModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-xl p-6 w-80 border border-slate-700 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-100 mb-4">保存梳子预设</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">预设名称</label>
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="例如：超软硅胶梳"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">描述</label>
                    <textarea
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      placeholder="描述这个梳子的特点..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSavePresetModal(false)}
                      className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={async () => {
                        if (presetName.trim()) {
                          const success = await saveCombPreset(presetName.trim(), presetDescription.trim());
                          if (success) {
                            setShowSavePresetModal(false);
                            setPresetName('');
                            setPresetDescription('');
                          }
                        }
                      }}
                      className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
