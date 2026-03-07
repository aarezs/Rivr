import { useTranslation } from 'react-i18next';
import { Heart, Wind, Brain, Thermometer, Activity } from 'lucide-react';
import { getVitalStatus } from '../../services/presage';

const vitalConfig = {
  heartRate: { icon: Heart, key: 'heartRate', unit: 'bpm', range: '60-100' },
  breathingRate: { icon: Wind, key: 'breathingRate', unit: 'brpm', range: '12-20' },
  stressLevel: { icon: Brain, key: 'stressLevel', unit: '%', range: '< 40%' },
};

const statusColors = {
  normal: { bg: 'rgba(72, 187, 120, 0.12)', border: 'rgba(72, 187, 120, 0.3)', text: '#48BB78', label: 'normal' },
  elevated: { bg: 'rgba(236, 201, 75, 0.12)', border: 'rgba(236, 201, 75, 0.3)', text: '#ECC94B', label: 'elevated' },
  concerning: { bg: 'rgba(245, 101, 101, 0.12)', border: 'rgba(245, 101, 101, 0.3)', text: '#F56565', label: 'concerning' },
};

export default function VitalsDisplay({ vitals }) {
  const { t } = useTranslation();

  if (!vitals) return null;

  // Additional vitals (temperature, SpO2) as a compact row
  const hasExtendedVitals = vitals.temperature || vitals.oxygenLevel;

  return (
    <div className="space-y-3">
      {/* Extended vitals row */}
      {hasExtendedVitals && (
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {vitals.temperature && (
            <div className="glass rounded-xl p-4 flex items-center gap-3" style={{
              borderColor: vitals.temperature > 37.5 ? 'rgba(236, 201, 75, 0.3)' : 'rgba(72, 187, 120, 0.3)',
              borderWidth: '1px'
            }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: vitals.temperature > 37.5 ? 'rgba(236, 201, 75, 0.12)' : 'rgba(72, 187, 120, 0.12)' }}>
                <Thermometer className="w-5 h-5" style={{ color: vitals.temperature > 37.5 ? '#ECC94B' : '#48BB78' }} />
              </div>
              <div>
                <p className="text-text-light text-xs">Temp</p>
                <span className="text-xl font-bold text-white">{vitals.temperature}</span>
                <span className="text-text-light text-xs ml-1">°C</span>
              </div>
            </div>
          )}
          {vitals.oxygenLevel && (
            <div className="glass rounded-xl p-4 flex items-center gap-3" style={{
              borderColor: vitals.oxygenLevel < 95 ? 'rgba(245, 101, 101, 0.3)' : 'rgba(72, 187, 120, 0.3)',
              borderWidth: '1px'
            }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: vitals.oxygenLevel < 95 ? 'rgba(245, 101, 101, 0.12)' : 'rgba(72, 187, 120, 0.12)' }}>
                <Activity className="w-5 h-5" style={{ color: vitals.oxygenLevel < 95 ? '#F56565' : '#48BB78' }} />
              </div>
              <div>
                <p className="text-text-light text-xs">SpO2</p>
                <span className="text-xl font-bold text-white">{vitals.oxygenLevel}</span>
                <span className="text-text-light text-xs ml-1">%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Core vitals */}
      <div className="stagger-children space-y-3">
        {Object.entries(vitalConfig).map(([key, config]) => {
          const Icon = config.icon;
          const value = vitals[key];
          const status = getVitalStatus(key, value);
          const colors = statusColors[status] || statusColors.normal;

          return (
            <div
              key={key}
              className="glass rounded-xl p-4 flex items-center gap-4 transition-all duration-300"
              style={{ borderColor: colors.border, borderWidth: '1px' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: colors.bg }}
              >
                <Icon className="w-6 h-6" style={{ color: colors.text }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-text-light text-xs font-medium">{t(`vitals.${config.key}`)}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white animate-count-up">{value}</span>
                  <span className="text-text-light text-sm">{t(`vitals.${config.unit}`)}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {t(`vitals.${colors.label}`)}
                </span>
                <p className="text-text-light text-xs mt-1">{config.range}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
