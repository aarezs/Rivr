import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Pill, Building2, Siren, AlertTriangle, Heart, Shield, Phone, FileText, Download, RotateCcw, ChevronRight, ArrowLeft, MapPin, Wind, Brain, Clock } from 'lucide-react';
import { ctasLevels } from '../data/ctasDefinitions';
import { getERsSortedByWait } from '../data/erWaitTimes';
import { getMockFacilities } from '../services/maps';
import MapView from './ui/MapView';
import TriageReport from './TriageReport';
import VisitSummary from './VisitSummary';

const careScreens = {
  selfcare: { icon: Home, gradient: 'from-success/20 to-success/5', borderColor: '#48BB78', bgAccent: 'rgba(72, 187, 120, 0.08)' },
  pharmacy: { icon: Pill, gradient: 'from-accent/20 to-accent/5', borderColor: '#2E9BDA', bgAccent: 'rgba(46, 155, 218, 0.08)' },
  walkin: { icon: Building2, gradient: 'from-warning/20 to-warning/5', borderColor: '#ECC94B', bgAccent: 'rgba(236, 201, 75, 0.08)' },
  er: { icon: Siren, gradient: 'from-danger/20 to-danger/5', borderColor: '#F56565', bgAccent: 'rgba(245, 101, 101, 0.08)' },
};

export default function CareRouting({ assessment, vitals, transcript, onStartOver }) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState('main'); // main, report, map

  const careLevel = assessment?.careRecommendation || 'walkin';
  const ctasInfo = ctasLevels[assessment?.ctasLevel] || ctasLevels[4];
  const config = careScreens[careLevel] || careScreens.walkin;
  const Icon = config.icon;
  const isER = careLevel === 'er';

  // Get facilities based on care level
  const erHospitals = getERsSortedByWait().map((h, i) => ({
    ...h,
    recommended: i === 0,
  }));
  const pharmacies = getMockFacilities('pharmacy');
  const walkins = getMockFacilities('walkin');

  // === FULLSCREEN TRIAGE REPORT (ER) ===
  if (step === 'report' && (isER || assessment?.ctasLevel <= 3)) {
    return (
      <TriageReport
        vitals={vitals}
        transcript={transcript}
        assessment={assessment}
        onBack={() => setStep('main')}
      />
    );
  }

  // === FULLSCREEN VISIT SUMMARY (Walk-in or Pharmacy) ===
  if (step === 'report' && (careLevel === 'walkin' || careLevel === 'pharmacy')) {
    return (
      <VisitSummary
        vitals={vitals}
        transcript={transcript}
        assessment={assessment}
        language={i18n.language}
        onBack={() => setStep('main')}
      />
    );
  }

  // === MAP PAGE (separate page for hospitals/clinics/pharmacies) ===
  if (step === 'map') {
    const mapFacilities = isER ? erHospitals : careLevel === 'walkin' ? walkins : pharmacies;
    const mapType = isER ? 'er' : careLevel === 'walkin' ? 'walkin' : 'pharmacy';
    const mapTitle = isER ? 'Nearest Emergency Rooms' : careLevel === 'walkin' ? 'Nearest Walk-In Clinics' : 'Nearest Pharmacies';

    return (
      <div className="min-h-[100dvh] flex flex-col bg-dark-bg relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button onClick={() => setStep('main')} className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/5 transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{mapTitle}</h1>
            <p className="text-xs text-text-light">Sorted by distance from you</p>
          </div>
        </div>

        {/* Map + List */}
        <div className="flex-1 px-4 pb-8 overflow-y-auto">
          <div className="max-w-sm mx-auto w-full animate-fade-in-up">
            <MapView facilities={mapFacilities} type={mapType} showWaitTimes={isER} />
          </div>
        </div>

        {/* Start Over */}
        <div className="px-4 pb-6 max-w-sm mx-auto w-full">
          <button
            onClick={onStartOver}
            className="w-full py-3.5 px-5 rounded-xl font-medium text-text-light
              glass hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {t('app.startOver')}
          </button>
        </div>
      </div>
    );
  }

  // === MAIN CARE ROUTING PAGE ===
  return (
    <div className="min-h-[100dvh] flex flex-col bg-dark-bg relative z-10">
      {/* Colored header */}
      <div
        className="px-4 pt-8 pb-6 relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${config.borderColor}15 0%, transparent 100%)` }}
      >
        <div className="relative z-10 text-center max-w-sm mx-auto">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-glow-pulse"
            style={{ backgroundColor: `${config.borderColor}20`, border: `2px solid ${config.borderColor}40` }}
          >
            <Icon className="w-8 h-8" style={{ color: config.borderColor }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {t(`routing.${careLevel}.title`)}
          </h1>
          <p className="text-text-light text-sm">{t(`routing.${careLevel}.subtitle`)}</p>

          {/* CTAS mini badge */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ctasInfo.color }} />
            <span className="text-xs text-text-light">CTAS {assessment?.ctasLevel} — {ctasInfo.name}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 max-w-sm mx-auto w-full">

        {/* ========== SELF-CARE ========== */}
        {careLevel === 'selfcare' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Big rest message */}
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgba(72, 187, 120, 0.08)', border: '1px solid rgba(72, 187, 120, 0.2)' }}>
              <Home className="w-14 h-14 mx-auto mb-4 text-success" />
              <h2 className="text-xl font-bold text-white mb-2">Go home and rest.</h2>
              <p className="text-text-light text-sm leading-relaxed">
                Based on your assessment, you don't need to visit a facility right now. Take it easy and focus on recovery.
              </p>
            </div>

            {/* Care plan */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-success" />
                Care Instructions
              </h3>
              <p className="text-sm text-text-light leading-relaxed">
                {assessment?.carePlanDetails || 'Rest, stay hydrated, and monitor your symptoms for 48-72 hours. Take OTC pain relief as directed.'}
              </p>
            </div>

            {/* Warning signs */}
            <div className="rounded-xl p-5" style={{ backgroundColor: 'rgba(245, 101, 101, 0.06)', border: '1px solid rgba(245, 101, 101, 0.15)' }}>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                If symptoms get worse...
              </h3>
              <p className="text-sm text-text-light leading-relaxed">
                Come back to <span className="text-primary font-semibold">Rivr</span> for a new assessment, or visit your nearest walk-in clinic or emergency room if you experience worsening or new symptoms.
              </p>
            </div>
          </div>
        )}

        {/* ========== PHARMACY ========== */}
        {careLevel === 'pharmacy' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Quick summary card */}
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Pill className="w-4 h-4 text-accent" />
                What to tell the pharmacist
              </h3>
              <p className="text-sm text-text-light leading-relaxed">
                {assessment?.symptomSummary || 'Show this summary to the pharmacist for faster assistance.'}
              </p>
            </div>

            {/* View visit summary */}
            <button
              onClick={() => setStep('report')}
              className="w-full py-3.5 px-5 rounded-xl font-medium text-white flex items-center justify-center gap-2
                glass hover:bg-white/5 transition-all duration-300 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              View Visit Summary
            </button>

            {/* Go to map button */}
            <button
              onClick={() => setStep('map')}
              className="w-full py-4 px-5 rounded-xl font-semibold text-white flex items-center justify-center gap-2
                transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{ backgroundColor: config.borderColor, boxShadow: `0 4px 15px ${config.borderColor}30` }}
            >
              <MapPin className="w-5 h-5" />
              Find Nearby Pharmacies
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ========== WALK-IN ========== */}
        {careLevel === 'walkin' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Receptionist note card */}
            <div className="glass rounded-xl p-5" style={{ borderLeft: `3px solid ${config.borderColor}` }}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-warning" />
                <h3 className="font-semibold text-white text-sm">Note for the Receptionist</h3>
              </div>
              <div className="space-y-2 text-xs text-text-light">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-warning shrink-0" />
                  <span>CTAS Level {assessment?.ctasLevel} — {ctasInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-3 h-3 text-primary shrink-0" />
                  <span>HR: {vitals?.heartRate || '--'} | BR: {vitals?.breathingRate || '--'} | Temp: {vitals?.temperature || '--'}°C | SpO2: {vitals?.oxygenLevel || '--'}%</span>
                </div>
                <div className="pt-1 border-t border-white/5 mt-2">
                  <p className="leading-relaxed">
                    {assessment?.symptomSummary || 'No symptom summary available.'}
                  </p>
                </div>
              </div>
            </div>

            {/* View full report */}
            <button
              onClick={() => setStep('report')}
              className="w-full py-3.5 px-5 rounded-xl font-medium text-white flex items-center justify-center gap-2
                glass hover:bg-white/5 transition-all duration-300 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              View Full Visit Summary
            </button>

            {/* Go to map button */}
            <button
              onClick={() => setStep('map')}
              className="w-full py-4 px-5 rounded-xl font-semibold text-white flex items-center justify-center gap-2
                transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{ backgroundColor: config.borderColor, boxShadow: `0 4px 15px ${config.borderColor}30` }}
            >
              <MapPin className="w-5 h-5" />
              Find Nearby Walk-In Clinics
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ========== EMERGENCY ROOM ========== */}
        {careLevel === 'er' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Urgency banner */}
            {assessment?.ctasLevel <= 2 && (
              <div className="rounded-xl p-4 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(245, 101, 101, 0.12)', border: '1px solid rgba(245, 101, 101, 0.3)' }}>
                <Phone className="w-5 h-5 text-danger shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {assessment?.ctasLevel === 1 ? 'Call 911 Immediately' : 'Proceed to ER Now'}
                  </p>
                  <p className="text-xs text-text-light">
                    {assessment?.ctasLevel === 1
                      ? 'Your condition may require immediate emergency response.'
                      : 'Do not delay. Your condition requires emergency evaluation.'}
                  </p>
                </div>
              </div>
            )}

            {/* Triage Summary Card */}
            <div className="glass rounded-xl p-4" style={{ borderLeft: '3px solid #F56565' }}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-danger" />
                <h4 className="text-sm font-semibold text-white">Triage Summary for ER Staff</h4>
              </div>
              <div className="space-y-2 text-xs text-text-light">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-danger shrink-0" />
                  <span>CTAS Level {assessment?.ctasLevel} — {ctasInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-3 h-3 text-primary shrink-0" />
                  <span>HR: {vitals?.heartRate || '--'} | BR: {vitals?.breathingRate || '--'} | Temp: {vitals?.temperature || '--'}°C | SpO2: {vitals?.oxygenLevel || '--'}%</span>
                </div>
                <p className="text-text-light leading-relaxed mt-1">
                  {assessment?.symptomSummary || 'No symptom summary available.'}
                </p>
              </div>
            </div>

            {/* View full triage report */}
            <button
              onClick={() => setStep('report')}
              className="w-full py-3.5 px-5 rounded-xl font-medium text-white flex items-center justify-center gap-2
                glass hover:bg-white/5 transition-all duration-300 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              View Full Triage Report
            </button>

            {/* Go to hospitals map */}
            <button
              onClick={() => setStep('map')}
              className="w-full py-4 px-5 rounded-xl font-semibold text-white flex items-center justify-center gap-2
                transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{ backgroundColor: config.borderColor, boxShadow: `0 4px 15px ${config.borderColor}30` }}
            >
              <MapPin className="w-5 h-5" />
              Find Nearest Hospitals
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Start over */}
        <div className="mt-6">
          <button
            onClick={onStartOver}
            className="w-full py-3.5 px-5 rounded-xl font-medium text-text-light
              glass hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {t('app.startOver')}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-6 max-w-sm mx-auto">
        <p className="text-xs text-text-light/60 text-center leading-relaxed">
          {t('app.disclaimer')}
        </p>
      </div>
    </div>
  );
}
