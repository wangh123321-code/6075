import { useState } from 'react';
import {
  Monitor,
  Palette,
  Keyboard,
  Database,
  RotateCcw,
  Download,
  Upload,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { cn } from '@/lib/utils';
import { SIMULATION_CONSTANTS, PHYSICS_CONSTANTS } from '@/shared/constants';

const settingsSections = [
  { id: 'graphics', label: '图形设置', icon: Monitor },
  { id: 'physics', label: '物理引擎', icon: Database },
  { id: 'shortcuts', label: '快捷键', icon: Keyboard },
  { id: 'appearance', label: '外观', icon: Palette },
  { id: 'about', label: '关于', icon: Info },
];

export function SystemSettings() {
  const [activeSection, setActiveSection] = useState('graphics');
  const { renderSettings, setRenderSettings, resetAllSettings, clearAllData } =
    useSimulationStore();
  const [savedMessage, setSavedMessage] = useState('');

  const showSavedMessage = (text: string) => {
    setSavedMessage(text);
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const handleSettingChange = (key: string, value: any) => {
    setRenderSettings({ ...renderSettings, [key]: value });
    showSavedMessage('设置已保存');
  };

  const handleReset = () => {
    if (confirm('确定要重置所有设置到默认值吗？')) {
      resetAllSettings();
      showSavedMessage('已重置为默认设置');
    }
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有本地数据吗？这将删除所有实验记录。')) {
      clearAllData();
      showSavedMessage('已清除所有数据');
    }
  };

  const handleExportSettings = () => {
    const settings = {
      renderSettings,
      exportTime: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const content = await file.text();
          const settings = JSON.parse(content);
          if (settings.renderSettings) {
            setRenderSettings(settings.renderSettings);
            showSavedMessage('设置导入成功');
          }
        } catch {
          alert('设置文件格式错误');
        }
      }
    };
    input.click();
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-950">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">系统设置</h1>
            <p className="text-slate-400">配置仿真系统的各项参数</p>
          </div>

          {savedMessage && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              {savedMessage}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          <aside className="w-56 shrink-0">
            <nav className="space-y-1 sticky top-8">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                      isActive
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{section.label}</span>
                  </button>
                );
              })}

              <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={handleExportSettings}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">导出设置</span>
                </button>
                <button
                  onClick={handleImportSettings}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">导入设置</span>
                </button>
                <button
                  onClick={handleReset}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">重置设置</span>
                </button>
                <button
                  onClick={handleClearData}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <Database className="w-4 h-4" />
                  <span className="text-sm">清除数据</span>
                </button>
              </div>
            </nav>
          </aside>

          <main className="flex-1 pb-16">
            {activeSection === 'graphics' && (
              <div className="space-y-6">
                <SettingsCard title="毛发渲染">
                  <SettingSlider
                    label="毛发数量"
                    description="控制仿真的毛发总数，影响性能"
                    value={renderSettings.hairCount}
                    min={10000}
                    max={200000}
                    step={5000}
                    onChange={(v) => handleSettingChange('hairCount', v)}
                    unit="根"
                    marks={[
                      { value: 10000, label: '1万' },
                      { value: 100000, label: '10万' },
                      { value: 200000, label: '20万' },
                    ]}
                  />
                  <SettingToggle
                    label="GPU实例化渲染"
                    description="使用硬件实例化渲染，大幅提升性能"
                    checked={renderSettings.instanceRendering}
                    onChange={(v) => handleSettingChange('instanceRendering', v)}
                  />
                  <SettingToggle
                    label="视锥剔除"
                    description="只渲染视野内的对象，减少Draw Call"
                    checked={renderSettings.frustumCulling}
                    onChange={(v) => handleSettingChange('frustumCulling', v)}
                  />
                  <SettingToggle
                    label="LOD层级细节"
                    description="根据距离自动降低细节，优化性能"
                    checked={renderSettings.lodEnabled}
                    onChange={(v) => handleSettingChange('lodEnabled', v)}
                  />
                </SettingsCard>

                <SettingsCard title="图像质量">
                  <SettingSelect
                    label="阴影质量"
                    description="阴影渲染的精细程度"
                    value={renderSettings.shadowQuality}
                    options={[
                      { value: 0, label: '关闭' },
                      { value: 1, label: '低' },
                      { value: 2, label: '中' },
                      { value: 3, label: '高' },
                    ]}
                    onChange={(v) => handleSettingChange('shadowQuality', v)}
                  />
                  <SettingToggle
                    label="抗锯齿"
                    description="启用后处理抗锯齿效果"
                    checked={renderSettings.antialiasing}
                    onChange={(v) => handleSettingChange('antialiasing', v)}
                  />
                  <SettingToggle
                    label="后处理效果"
                    description="Bloom、色调映射等后处理效果"
                    checked={renderSettings.postProcessing}
                    onChange={(v) => handleSettingChange('postProcessing', v)}
                  />
                </SettingsCard>
              </div>
            )}

            {activeSection === 'physics' && (
              <div className="space-y-6">
                <SettingsCard title="物理参数">
                  <SettingSlider
                    label="重力系数"
                    description="控制毛发受到的重力大小"
                    value={PHYSICS_CONSTANTS.GRAVITY}
                    min={0}
                    max={20}
                    step={0.5}
                    onChange={() => {}}
                    unit="m/s²"
                    disabled
                  />
                  <SettingSlider
                    label="阻尼系数"
                    description="控制毛发运动的能量衰减"
                    value={PHYSICS_CONSTANTS.DAMPING}
                    min={0.9}
                    max={0.999}
                    step={0.001}
                    onChange={() => {}}
                    disabled
                  />
                  <SettingSlider
                    label="弯曲约束迭代次数"
                    description="物理求解的迭代次数，影响稳定性"
                    value={PHYSICS_CONSTANTS.BEND_CONSTRAINT_ITERATIONS}
                    min={1}
                    max={10}
                    step={1}
                    onChange={() => {}}
                    disabled
                  />
                </SettingsCard>

                <SettingsCard title="碰撞检测">
                  <SettingToggle
                    label="连续碰撞检测(CCD)"
                    description="防止快速运动的物体穿透"
                    checked={false}
                    onChange={() => {}}
                    disabled
                  />
                  <SettingSlider
                    label="碰撞检测半径"
                    description="梳子与毛发的碰撞检测范围"
                    value={0.02}
                    min={0.005}
                    max={0.05}
                    step={0.001}
                    onChange={() => {}}
                    unit="m"
                    disabled
                  />
                </SettingsCard>
              </div>
            )}

            {activeSection === 'shortcuts' && (
              <div className="space-y-6">
                <SettingsCard title="通用快捷键">
                  <ShortcutRow shortcut="空格" action="播放/暂停仿真" />
                  <ShortcutRow shortcut="H" action="切换热力图显示" />
                  <ShortcutRow shortcut="Shift + ←" action="上一帧" />
                  <ShortcutRow shortcut="Shift + →" action="下一帧" />
                  <ShortcutRow shortcut="R" action="开始/停止回放" />
                  <ShortcutRow shortcut="Esc" action="取消当前操作" />
                </SettingsCard>

                <SettingsCard title="3D视图控制">
                  <ShortcutRow shortcut="鼠标左键拖动" action="旋转视角" />
                  <ShortcutRow shortcut="鼠标右键拖动" action="平移视角" />
                  <ShortcutRow shortcut="鼠标滚轮" action="缩放视角" />
                  <ShortcutRow shortcut="Ctrl + 0" action="重置视角" />
                </SettingsCard>

                <SettingsCard title="梳毛操作">
                  <ShortcutRow shortcut="鼠标左键在模型上拖动" action="执行梳毛操作" />
                  <ShortcutRow shortcut="鼠标左键双击" action="清除当前梳毛轨迹" />
                </SettingsCard>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <SettingsCard title="界面设置">
                  <SettingToggle
                    label="显示性能监控"
                    description="在导航栏显示FPS、帧时间等信息"
                    checked={true}
                    onChange={() => {}}
                  />
                  <SettingToggle
                    label="显示快捷键提示"
                    description="在首次使用时显示快捷键说明"
                    checked={true}
                    onChange={() => {}}
                  />
                  <SettingToggle
                    label="动画过渡效果"
                    description="启用UI元素的动画过渡"
                    checked={true}
                    onChange={() => {}}
                  />
                </SettingsCard>

                <SettingsCard title="热力图配色">
                  <div className="grid grid-cols-3 gap-3">
                    {['blue-red', 'green-red', 'purple-yellow'].map((scheme) => (
                      <button
                        key={scheme}
                        className={cn(
                          'p-4 rounded-lg border transition-all',
                          scheme === 'blue-red'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        )}
                      >
                        <div
                          className="h-8 rounded mb-2"
                          style={{
                            background:
                              scheme === 'blue-red'
                                ? 'linear-gradient(to right, #3b82f6, #ef4444)'
                                : scheme === 'green-red'
                                ? 'linear-gradient(to right, #22c55e, #ef4444)'
                                : 'linear-gradient(to right, #a855f7, #eab308)',
                          }}
                        />
                        <div className="text-sm text-slate-300">
                          {scheme === 'blue-red' && '蓝红渐变'}
                          {scheme === 'green-red' && '绿红渐变'}
                          {scheme === 'purple-yellow' && '紫黄渐变'}
                        </div>
                      </button>
                    ))}
                  </div>
                </SettingsCard>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="space-y-6">
                <SettingsCard title="系统信息">
                  <InfoRow label="软件名称" value="毛发物理仿真系统" />
                  <InfoRow label="版本号" value="v1.0.0" />
                  <InfoRow label="构建时间" value={__BUILD_TIME__ || '开发版本'} />
                  <InfoRow label="技术栈" value="React 18 + Babylon.js 6 + TypeScript" />
                  <InfoRow label="3D引擎" value="Babylon.js 6.41.0" />
                  <InfoRow label="物理引擎" value="Havok Physics" />
                </SettingsCard>

                <SettingsCard title="技术指标">
                  <InfoRow label="最大毛发数量" value="200,000 根" />
                  <InfoRow label="目标帧率" value="60 FPS @ 100,000 根" />
                  <InfoRow label="物理更新频率" value="60 Hz" />
                  <InfoRow label="粒子系统容量" value="10,000 粒子" />
                </SettingsCard>

                <SettingsCard title="开发团队">
                  <div className="text-slate-400 text-sm leading-relaxed">
                    本系统为宠物用品研发实验室定制开发，旨在提供高效、精确的毛发-梳子
                    交互仿真平台。系统采用最新的WebGPU技术和基于位置的动力学(PBD)算法，
                    可在普通PC上实现10万根毛发的实时物理仿真。
                  </div>
                </SettingsCard>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

declare const __BUILD_TIME__: string;

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function SettingSlider({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  disabled = false,
  marks,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
  marks?: { value: number; label: string }[];
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={cn('font-medium', disabled ? 'text-slate-500' : 'text-white')}>
            {label}
          </div>
          {description && (
            <div className="text-xs text-slate-500 mt-0.5">{description}</div>
          )}
        </div>
        <div className="text-blue-400 font-mono font-semibold">
          {value.toFixed(step < 1 ? 3 : 0)}
          {unit && <span className="text-slate-500 ml-1">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {marks && (
        <div className="flex justify-between mt-1 px-1">
          {marks.map((mark) => (
            <span key={mark.value} className="text-xs text-slate-600">
              {mark.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className={cn('font-medium', disabled ? 'text-slate-500' : 'text-white')}>
          {label}
        </div>
        {description && (
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          'w-12 h-6 rounded-full transition-all relative',
          checked ? 'bg-blue-500' : 'bg-slate-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div
          className={cn(
            'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md',
            checked ? 'left-6' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}

function SettingSelect({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-white">{label}</div>
        {description && (
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ShortcutRow({ shortcut, action }: { shortcut: string; action: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 text-sm">{action}</span>
      <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-300">
        {shortcut}
      </kbd>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-200 font-mono text-sm">{value}</span>
    </div>
  );
}
