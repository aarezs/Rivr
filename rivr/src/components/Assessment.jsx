import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity, Shield, ChevronRight, Stethoscope, Brain,
  MessageSquare, AlertTriangle,
} from 'lucide-react';
import { ctasLevels } from '../data/ctasDefinitions';
import { assessTranscript } from '../services/ai';

export default function Assessment({ transcript, onComplete }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState('analyzing'); // analyzing, result
  const [result, setResult] = useState(null); // { extraction, assessment }
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0-3 for analysis steps
  const hasRun = useRef(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return 95;
        return p + Math.random() * 8 + 2;
      });
    }, 400);

    const run = async () => {
      const apiKey = import.meta.env?.VITE_BACKBOARD_API_KEY;

      try {
        const { extraction, assessment } = await assessTranscript(
          transcript,
          apiKey,
          (step) => setCurrentStep(step),
        );

        setResult({ extraction, assessment });
        setProgress(100);
        clearInterval(progressInterval);
        setTimeout(() => setPhase('result'), 600);
      } catch (err) {
        console.error("Assessment error", err);
        setError(err.message || "Failed to analyze chat. Please try again.");
        clearInterval(progressInterval);
        setPhase('error');
      }
    };

    setTimeout(run, 800);

    return () => clearInterval(progressInterval);
  }, [transcript]);

  const assessment = result?.assessment;
  const extraction = result?.extraction;
  const ctasInfo = assessment ? ctasLevels[assessment.ctasLevel] : null;

  // Analysis steps
  const analysisSteps = [
    { icon: MessageSquare, label: 'Reading interview transcript...' },
    { icon: Brain, label: 'Extracting symptoms (Pass 1)...' },
    { icon: Stethoscope, label: 'Running CTAS assessment (Pass 2)...' },
    { icon: Shield, label: 'Generating care recommendation...' },
  ];

  // --------------- ERROR SCREEN ---------------
  if (phase === 'error') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-dark-bg px-4 relative z-10">
        <div className="text-center max-w-sm animate-fade-in-up">
          <div className="w-24 h-24 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-danger" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Assessment Failed</h2>
          <p className="text-white/80 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 rounded-xl bg-primary text-white font-semibold transition-all hover:bg-primary-dark shadow-lg shadow-primary/20 cursor-pointer"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // --------------- ANALYZING SCREEN ---------------
  if (phase === 'analyzing') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-dark-bg px-4 relative z-10">
        <div className="text-center max-w-sm">
          {/* Spinning icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">{t('assessment.title')}</h2>
          <p className="text-text-light text-sm mb-2">{t('assessment.subtitle')}</p>
          <p className="text-primary/70 text-xs mb-8 font-mono">Two-pass agentic AI pipeline</p>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-dark-bg-lighter rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Analysis steps */}
          <div className="space-y-3">
            {analysisSteps.map((step, i) => {
              const Icon = step.icon;
              const active = i <= currentStep || progress > i * 25;
              const isCurrent = i === currentStep && progress < 100;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    active ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      active ? 'bg-primary/15' : 'bg-dark-bg-lighter'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-text-light'}`} />
                  </div>
                  <span className={`text-sm ${active ? 'text-white/80' : 'text-text-light'}`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <div className="ml-auto w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --------------- RESULT SCREEN ---------------
  return (
    <div className="min-h-[100dvh] flex flex-col bg-dark-bg px-4 py-8 relative z-10">
      <div className="max-w-sm mx-auto w-full animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6 mt-4">
          <p className="text-primary text-[10px] font-bold tracking-widest uppercase mb-1">
            Your Care Stream
          </p>
          <h3 className="text-xl font-bold text-white">Triage Assessment</h3>
        </div>

        {/* Extracted symptoms (from Pass 1) */}
        {extraction?.symptoms && extraction.symptoms.length > 0 && (
          <div className="glass rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Symptoms Identified
              </span>
            </div>
            <div className="space-y-2">
              {extraction.symptoms.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      s.severity === 'severe'
                        ? 'bg-danger'
                        : s.severity === 'moderate'
                          ? 'bg-warning'
                          : 'bg-primary'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white/90">{s.name}</span>
                    {s.duration && (
                      <span className="text-xs text-text-light ml-2">({s.duration})</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      s.severity === 'severe'
                        ? 'bg-danger/15 text-danger'
                        : s.severity === 'moderate'
                          ? 'bg-warning/15 text-warning'
                          : 'bg-primary/15 text-primary'
                    }`}
                  >
                    {s.severity}
                  </span>
                </div>
              ))}
            </div>
            {extraction.chiefComplaint && (
              <p className="text-xs text-text-light mt-3 pt-3 border-t border-white/5 italic">
                Chief complaint: {extraction.chiefComplaint}
              </p>
            )}
          </div>
        )}

        {/* Assessment Result */}
        <div
          className="glass rounded-xl p-5 mb-4 border-l-2"
          style={{ borderLeftColor: ctasInfo?.color || '#F59E0B' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ctasInfo?.color || '#F59E0B' }}
            />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {ctasInfo?.name || 'Semi-Urgent'}
            </h4>
            <span
              className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full glass-light"
              style={{ color: ctasInfo?.color }}
            >
              CTAS {assessment?.ctasLevel}
            </span>
          </div>
          <p className="text-xs text-text-medium leading-relaxed mb-4">
            {ctasInfo?.careAction ||
              'Based on your symptoms, we recommend visiting a walk-in clinic within the next 4 hours.'}
          </p>
          <div className="text-xs text-text-light p-3 bg-dark-bg-lighter/50 rounded-lg border border-white/5">
            <span className="font-medium text-white/70 block mb-1">Clinical Reasoning:</span>
            {assessment?.reasoning}
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={() => onComplete(result)}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
        >
          See Your Care Plan
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
