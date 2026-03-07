import { useTranslation } from 'react-i18next';
import { FileText, Download, ArrowLeft, Shield, Clock, Heart, Wind, Brain, AlertTriangle, Thermometer, Activity } from 'lucide-react';
import { ctasLevels } from '../data/ctasDefinitions';
import { generateTriageReportPDF, downloadPDF } from '../services/pdf';

export default function TriageReport({ vitals, transcript, assessment, onBack }) {
  const { t } = useTranslation();
  const ctasInfo = ctasLevels[assessment?.ctasLevel] || ctasLevels[3];
  const timestamp = new Date().toLocaleString('en-CA', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const handleDownload = () => {
    const doc = generateTriageReportPDF({ vitals, transcript, assessment, timestamp });
    downloadPDF(doc, `rivr-triage-report-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/5 transition-all cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">{t('report.triageTitle')}</h1>
          <p className="text-xs text-text-light">{t('report.triageSubtitle')}</p>
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

      {/* Report content - English only for clinical staff */}
      <div className="flex-1 px-4 pb-8 overflow-y-auto">
        <div className="max-w-sm mx-auto w-full space-y-4">
          {/* Report header card */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold gradient-text">RIVR</h2>
                <p className="text-xs text-text-light">AI-Powered Triage Pre-Assessment</p>
              </div>
              <div
                className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                style={{ backgroundColor: ctasInfo.bgColor, border: `2px solid ${ctasInfo.color}` }}
              >
                <span className="text-2xl font-extrabold" style={{ color: ctasInfo.color }}>
                  {assessment?.ctasLevel}
                </span>
                <span className="text-[10px] font-medium" style={{ color: ctasInfo.color }}>CTAS</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-light">
              <Clock className="w-3 h-3" />
              <span>{timestamp}</span>
            </div>
          </div>


          {/* Vitals table */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Vital Signs
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Heart Rate', value: `${vitals?.heartRate || '--'} BPM`, range: '60-100 BPM', icon: Heart },
                { label: 'Breathing Rate', value: `${vitals?.breathingRate || '--'} br/min`, range: '12-20 br/min', icon: Wind },
                { label: 'Temperature', value: `${vitals?.temperature || '--'} °C`, range: '36.1-37.2 °C', icon: Thermometer },
                { label: 'SpO2', value: `${vitals?.oxygenLevel || '--'}%`, range: '95-100%', icon: Activity },
                { label: 'Stress Level', value: `${vitals?.stressLevel || '--'}%`, range: '< 40%', icon: Brain },
              ].map((vital, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <vital.icon className="w-4 h-4 text-text-light" />
                    <span className="text-sm text-text-light">{vital.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">{vital.value}</span>
                    <span className="text-xs text-text-light ml-2">({vital.range})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Symptom summary */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Symptom Summary
            </h3>
            <p className="text-sm text-text-light leading-relaxed">
              {assessment?.symptomSummary || transcript || 'No symptom data available.'}
            </p>
          </div>

          {/* Assessment */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              AI Assessment
            </h3>
            <div
              className="rounded-lg p-3 mb-3"
              style={{ backgroundColor: ctasInfo.bgColor, border: `1px solid ${ctasInfo.color}30` }}
            >
              <p className="text-sm font-semibold" style={{ color: ctasInfo.color }}>
                CTAS Level {assessment?.ctasLevel} — {ctasInfo.name}
              </p>
              <p className="text-xs text-text-light mt-1">{ctasInfo.description}</p>
            </div>
            <p className="text-sm text-text-light leading-relaxed">{assessment?.reasoning}</p>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(236, 201, 75, 0.08)', border: '1px solid rgba(236, 201, 75, 0.2)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
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
