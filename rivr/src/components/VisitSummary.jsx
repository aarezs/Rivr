import { useTranslation } from 'react-i18next';
import { FileText, Download, ArrowLeft, Heart, Wind, Brain, Clock, AlertTriangle, Stethoscope, Thermometer, Activity } from 'lucide-react';
import { generateVisitSummaryPDF, downloadPDF } from '../services/pdf';

export default function VisitSummary({ vitals, transcript, assessment, language, onBack }) {
  const { t } = useTranslation();
  const timestamp = new Date().toLocaleString('en-CA', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const handleDownload = () => {
    const doc = generateVisitSummaryPDF({ vitals, transcript, assessment, timestamp, language });
    downloadPDF(doc, `rivr-visit-summary-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/5 transition-all cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">{t('report.visitTitle')}</h1>
          <p className="text-xs text-text-light">{t('report.visitSubtitle')}</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium
            transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
      </div>

      {/* Report content */}
      <div className="flex-1 px-4 pb-8 overflow-y-auto">
        <div className="max-w-sm mx-auto w-full space-y-4">
          {/* Header card */}
          <div className="rounded-xl p-5" style={{ 
            background: 'linear-gradient(135deg, rgba(10,186,181,0.15), rgba(46,155,218,0.1))',
            border: '1px solid rgba(10,186,181,0.2)'
          }}>
            <div className="flex items-center gap-3 mb-3">
              <Stethoscope className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-white">{t('report.visitTitle')}</h2>
                <p className="text-xs text-text-light">{t('report.visitSubtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-light">
              <Clock className="w-3 h-3" />
              <span>{timestamp}</span>
            </div>
          </div>


          {/* Vitals snapshot */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              {t('report.vitalsSection')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('vitals.heartRate'), value: vitals?.heartRate || '--', unit: t('vitals.bpm'), icon: Heart, color: '#F56565' },
                { label: t('vitals.breathingRate'), value: vitals?.breathingRate || '--', unit: t('vitals.brpm'), icon: Wind, color: '#2E9BDA' },
                { label: 'Temp', value: vitals?.temperature || '--', unit: '°C', icon: Thermometer, color: '#ECC94B' },
                { label: 'SpO2', value: vitals?.oxygenLevel || '--', unit: '%', icon: Activity, color: '#48BB78' },
                { label: t('vitals.stressLevel'), value: vitals?.stressLevel || '--', unit: '%', icon: Brain, color: '#ECC94B' },
              ].map((vital, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-dark-bg/50">
                  <vital.icon className="w-5 h-5 mx-auto mb-1" style={{ color: vital.color }} />
                  <p className="text-xl font-bold text-white">{vital.value}</p>
                  <p className="text-[10px] text-text-light">{vital.unit}</p>
                  <p className="text-[10px] text-text-light mt-1">{vital.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What I was experiencing */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t('report.symptomsSection')}
            </h3>
            <p className="text-sm text-text-light leading-relaxed">
              {assessment?.symptomSummary || transcript || 'No symptom data recorded.'}
            </p>
          </div>

          {/* AI recommendation */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              {t('report.assessmentSection')}
            </h3>
            <p className="text-sm text-white/80 font-medium mb-2">
              {assessment?.careRecommendation === 'walkin'
                ? 'Visit a walk-in clinic within 24-48 hours'
                : assessment?.careRecommendation === 'pharmacy'
                ? 'Visit a pharmacy for assistance'
                : 'Self-care at home recommended'}
            </p>
            <p className="text-sm text-text-light leading-relaxed">
              {assessment?.carePlanDetails || assessment?.reasoning}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(46, 155, 218, 0.08)', border: '1px solid rgba(46, 155, 218, 0.2)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-text-light leading-relaxed">
                {t('report.disclaimerNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
