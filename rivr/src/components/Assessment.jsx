import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  Shield,
  ChevronRight,
  Stethoscope,
  Brain,
  Heart,
  Wind,
  Thermometer,
} from "lucide-react";
import { ctasLevels } from "../data/ctasDefinitions";
import { assessWithGemini } from "../services/gemini";
import { getVitalStatus } from "../services/presage";

export default function Assessment({ vitals, transcript, onComplete }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState("analyzing"); // analyzing, result
  const [assessment, setAssessment] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 300);

    const timer = setTimeout(async () => {
      const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
      const result = await assessWithGemini(vitals, transcript, apiKey);
      setAssessment(result);
      setProgress(100);
      setTimeout(() => setPhase("result"), 500);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [vitals, transcript]);

  const ctasInfo = assessment ? ctasLevels[assessment.ctasLevel] : null;

  const analysisSteps = [
    { icon: Heart, label: "Analyzing vital signs...", delay: 0 },
    { icon: Brain, label: "Processing symptom data...", delay: 0.8 },
    { icon: Stethoscope, label: "Applying CTAS criteria...", delay: 1.6 },
    { icon: Shield, label: "Generating recommendation...", delay: 2.4 },
  ];

  if (phase === "analyzing") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-dark-bg px-4 relative z-10">
        <div className="text-center max-w-sm lg:max-w-lg">
          {/* Spinning icon */}
          <div className="relative w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-8 lg:mb-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-10 lg:w-14 h-10 lg:h-14 text-primary" />
            </div>
          </div>

          <h2 className="text-xl lg:text-3xl font-semibold text-white mb-2 lg:mb-3">
            {t("assessment.title")}
          </h2>
          <p className="text-text-light text-sm lg:text-base mb-8 lg:mb-10">
            {t("assessment.subtitle")}
          </p>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-dark-bg-lighter rounded-full overflow-hidden mb-8 lg:mb-10">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Analysis steps */}
          <div className="space-y-3 lg:space-y-4 stagger-children">
            {analysisSteps.map((step, i) => {
              const Icon = step.icon;
              const active = progress > i * 25;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500
                  ${active ? "opacity-100" : "opacity-30"}`}
                >
                  <div
                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center shrink-0
                    ${active ? "bg-primary/15" : "bg-dark-bg-lighter"}`}
                  >
                    <Icon
                      className={`w-4 lg:w-5 h-4 lg:h-5 ${active ? "text-primary" : "text-text-light"}`}
                    />
                  </div>
                  <span
                    className={`text-sm lg:text-base ${active ? "text-white/80" : "text-text-light"}`}
                  >
                    {step.label}
                  </span>
                  {active &&
                    progress < 100 &&
                    i === Math.floor(progress / 25) && (
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

  // Build vitals cards dynamically from actual data
  const hrStatus = getVitalStatus("heartRate", vitals?.heartRate);
  const brStatus = getVitalStatus("breathingRate", vitals?.breathingRate);
  const stressStatus = getVitalStatus("stressLevel", vitals?.stressLevel);
  const tempStatus = vitals?.temperature > 37.5 ? "elevated" : "normal";
  const spo2Status = vitals?.oxygenLevel < 95 ? "concerning" : "normal";

  const statusColor = (status) => {
    if (status === "normal") return "text-primary";
    if (status === "elevated") return "text-warning";
    return "text-danger";
  };
  const statusDot = (status) => {
    if (status === "normal") return "bg-primary";
    if (status === "elevated") return "bg-warning";
    return "bg-danger";
  };
  const statusLabel = (status) => {
    if (status === "normal") return "Normal";
    if (status === "elevated") return "Elevated";
    return "Concerning";
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-dark-bg px-4 lg:px-8 py-8 lg:py-12 relative z-10">
      <div className="max-w-sm lg:max-w-2xl mx-auto w-full animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-10 mt-4 lg:mt-6">
          <p className="text-primary text-[10px] lg:text-xs font-bold tracking-widest uppercase mb-1 lg:mb-2">
            Your Care Stream
          </p>
          <h3 className="text-xl lg:text-3xl font-bold text-white">
            Triage Assessment
          </h3>
        </div>

        {/* Vitals Grid - 2x2 glass cards */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
          <div className="glass rounded-xl p-4 lg:p-6">
            <Heart className="w-4 lg:w-5 h-4 lg:h-5 text-primary mb-2 lg:mb-3" />
            <div className="text-[10px] lg:text-xs text-text-light mb-1">
              Heart Rate
            </div>
            <div className="font-bold text-lg lg:text-2xl text-white mb-1">
              {vitals?.heartRate || "--"}{" "}
              <span className="text-xs lg:text-sm font-normal text-text-light">
                bpm
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-[10px] lg:text-xs ${statusColor(hrStatus)}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${statusDot(hrStatus)}`}
              />
              {statusLabel(hrStatus)}
            </div>
          </div>

          <div className="glass rounded-xl p-4 lg:p-6">
            <Thermometer
              className={`w-4 lg:w-5 h-4 lg:h-5 mb-2 lg:mb-3 ${tempStatus === "elevated" ? "text-warning" : "text-primary"}`}
            />
            <div className="text-[10px] lg:text-xs text-text-light mb-1">
              Temp
            </div>
            <div className="font-bold text-lg lg:text-2xl text-white mb-1">
              {vitals?.temperature || "--"}
              <span className="text-xs lg:text-sm font-normal text-text-light">
                °C
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-[10px] lg:text-xs ${statusColor(tempStatus)}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${statusDot(tempStatus)}`}
              />
              {statusLabel(tempStatus)}
            </div>
          </div>

          <div className="glass rounded-xl p-4 lg:p-6">
            <Activity className="w-4 lg:w-5 h-4 lg:h-5 text-primary mb-2 lg:mb-3" />
            <div className="text-[10px] lg:text-xs text-text-light mb-1">
              SpO2
            </div>
            <div className="font-bold text-lg lg:text-2xl text-white mb-1">
              {vitals?.oxygenLevel || "--"}
              <span className="text-xs lg:text-sm font-normal text-text-light">
                %
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-[10px] lg:text-xs ${statusColor(spo2Status)}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${statusDot(spo2Status)}`}
              />
              {statusLabel(spo2Status)}
            </div>
          </div>

          <div className="glass rounded-xl p-4 lg:p-6">
            <Wind className="w-4 lg:w-5 h-4 lg:h-5 text-primary mb-2 lg:mb-3" />
            <div className="text-[10px] lg:text-xs text-text-light mb-1">
              Breathing
            </div>
            <div className="font-bold text-lg lg:text-2xl text-white mb-1">
              {vitals?.breathingRate || "--"}{" "}
              <span className="text-xs lg:text-sm font-normal text-text-light">
                br/min
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-[10px] lg:text-xs ${statusColor(brStatus)}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${statusDot(brStatus)}`}
              />
              {statusLabel(brStatus)}
            </div>
          </div>
        </div>

        {/* Stress level bar */}
        <div className="glass rounded-xl p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 lg:w-5 h-4 lg:h-5 text-primary" />
              <span className="text-[10px] lg:text-xs text-text-light">
                Stress Level
              </span>
            </div>
            <span
              className={`text-sm lg:text-base font-bold ${statusColor(stressStatus)}`}
            >
              {vitals?.stressLevel || "--"}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-dark-bg-lighter rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                stressStatus === "normal"
                  ? "bg-primary"
                  : stressStatus === "elevated"
                    ? "bg-warning"
                    : "bg-danger"
              }`}
              style={{ width: `${Math.min(vitals?.stressLevel || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Assessment Result */}
        <div
          className="glass rounded-xl p-5 lg:p-6 mb-4 lg:mb-6 border-l-2"
          style={{ borderLeftColor: ctasInfo?.color || "#F59E0B" }}
        >
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ctasInfo?.color || "#F59E0B" }}
            />
            <h4 className="text-xs lg:text-sm font-bold text-white uppercase tracking-wider">
              {ctasInfo?.name || "Semi-Urgent"}
            </h4>
            <span
              className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full glass-light"
              style={{ color: ctasInfo?.color }}
            >
              CTAS {assessment?.ctasLevel}
            </span>
          </div>
          <p className="text-xs lg:text-sm text-text-medium leading-relaxed mb-4 lg:mb-5">
            {ctasInfo?.careAction ||
              "Based on your symptoms and vitals, we recommend visiting a walk-in clinic within the next 4 hours."}
          </p>
          <div className="text-xs lg:text-sm text-text-light p-3 lg:p-4 bg-dark-bg-lighter/50 rounded-lg border border-white/5">
            <span className="font-medium text-white/70 block mb-1">
              Clinical Reasoning:
            </span>
            {assessment?.reasoning}
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={() => onComplete(assessment)}
          className="w-full py-4 lg:py-5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm lg:text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
        >
          See Your Care Plan
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
