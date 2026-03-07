import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import LandingPage from './components/LandingPage';
import LanguageSelect from './components/LanguageSelect';
import VitalsScan from './components/VitalsScan';
import VoiceInterview from './components/VoiceInterview';
import Assessment from './components/Assessment';
import CareRouting from './components/CareRouting';
import Disclaimer from './components/Disclaimer';

const STEPS = {
  LANDING: 'landing',
  DISCLAIMER: 'disclaimer',
  LANGUAGE: 'language',
  VITALS: 'vitals',
  INTERVIEW: 'interview',
  ASSESSMENT: 'assessment',
  ROUTING: 'routing',
};

export default function App() {
  const { i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(STEPS.LANDING);
  const [sessionData, setSessionData] = useState({
    language: null,
    vitals: null,
    transcript: null,
    assessment: null,
  });

  const handleLanguageSelect = useCallback((langCode) => {
    setSessionData(prev => ({ ...prev, language: langCode }));
    setCurrentStep(STEPS.VITALS);
  }, []);

  const handleVitalsComplete = useCallback((vitals) => {
    setSessionData(prev => ({ ...prev, vitals }));
    setCurrentStep(STEPS.INTERVIEW);
  }, []);

  const handleInterviewComplete = useCallback((transcript) => {
    setSessionData(prev => ({ ...prev, transcript }));
    setCurrentStep(STEPS.ASSESSMENT);
  }, []);

  const handleAssessmentComplete = useCallback((assessment) => {
    setSessionData(prev => ({ ...prev, assessment }));
    setCurrentStep(STEPS.ROUTING);
  }, []);

  const handleStartOver = useCallback(() => {
    setSessionData({
      language: null,
      vitals: null,
      transcript: null,
      assessment: null,
    });
    setCurrentStep(STEPS.LANDING);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-dark-bg">
      {/* River flow background */}
      <div className="river-bg">
        <div className="river-stream" />
        <div className="river-stream" />
        <div className="river-stream" />
        <div className="river-stream" />
        <div className="river-stream" />
      </div>

      {currentStep === STEPS.LANDING && (
        <LandingPage onStart={() => setCurrentStep(STEPS.DISCLAIMER)} />
      )}

      {currentStep === STEPS.DISCLAIMER && (
        <Disclaimer onAccept={() => setCurrentStep(STEPS.LANGUAGE)} />
      )}

      {currentStep === STEPS.LANGUAGE && (
        <LanguageSelect onSelect={handleLanguageSelect} />
      )}

      {currentStep === STEPS.VITALS && (
        <VitalsScan onComplete={handleVitalsComplete} />
      )}

      {currentStep === STEPS.INTERVIEW && (
        <VoiceInterview
          language={sessionData.language}
          onComplete={handleInterviewComplete}
        />
      )}

      {currentStep === STEPS.ASSESSMENT && (
        <Assessment
          vitals={sessionData.vitals}
          transcript={sessionData.transcript}
          onComplete={handleAssessmentComplete}
        />
      )}

      {currentStep === STEPS.ROUTING && (
        <CareRouting
          assessment={sessionData.assessment}
          vitals={sessionData.vitals}
          transcript={sessionData.transcript}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
