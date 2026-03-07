import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Home,
  Pill,
  Building2,
  Siren,
  AlertTriangle,
  Heart,
  Shield,
  Phone,
  FileText,
  Download,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";
import { ctasLevels } from "../data/ctasDefinitions";
import { fetchERWaitTimes } from "../data/erWaitTimes";
import { fetchNearbyFacilities, getUserLocation } from "../services/maps";
import MapView from "./ui/MapView";
import TriageReport from "./TriageReport";
import VisitSummary from "./VisitSummary";

const careScreens = {
  selfcare: {
    icon: Home,
    gradient: "from-success/20 to-success/5",
    borderColor: "#48BB78",
    bgAccent: "rgba(72, 187, 120, 0.08)",
  },
  pharmacy: {
    icon: Pill,
    gradient: "from-accent/20 to-accent/5",
    borderColor: "#2E9BDA",
    bgAccent: "rgba(46, 155, 218, 0.08)",
  },
  walkin: {
    icon: Building2,
    gradient: "from-warning/20 to-warning/5",
    borderColor: "#ECC94B",
    bgAccent: "rgba(236, 201, 75, 0.08)",
  },
  er: {
    icon: Siren,
    gradient: "from-danger/20 to-danger/5",
    borderColor: "#F56565",
    bgAccent: "rgba(245, 101, 101, 0.08)",
  },
};

export default function CareRouting({
  assessment,
  transcript,
  onStartOver,
}) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState("main"); // main, report, map
  
  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  const careLevel = assessment?.careRecommendation || "walkin";
  const ctasInfo = ctasLevels[assessment?.ctasLevel] || ctasLevels[4];
  const config = careScreens[careLevel] || careScreens.walkin;
  const Icon = config.icon;
  const isER = careLevel === "er";

  // Fetch facilities dynamically based on location
  useEffect(() => {
    if (careLevel === 'selfcare' || careLevel === 'pharmacy') return;
    
    let isMounted = true;
    async function load() {
      setLoadingFacilities(true);
      try {
        // Try getting location, fallback to Waterloo, ON coordinates if blocked
        const { lat, lng } = await getUserLocation().catch(() => ({ lat: 43.4643, lng: -80.5204 }));
        
        let data = [];
        if (isER) {
          data = await fetchERWaitTimes(lat, lng);
        } else if (careLevel === 'walkin') {
          data = await fetchNearbyFacilities('walkin', lat, lng);
          if (data.length > 0) data[0].recommended = true;
        }
        
        if (isMounted) {
          setFacilities(data);
        }
      } catch (err) {
        console.error("Failed to load facilities map data", err);
      } finally {
        if (isMounted) setLoadingFacilities(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [careLevel, isER]);

  // === FULLSCREEN TRIAGE REPORT (ER) ===
  if (step === "report" && (isER || assessment?.ctasLevel <= 3)) {
    return (
      <TriageReport
        transcript={transcript}
        assessment={assessment}
        onBack={() => setStep("main")}
      />
    );
  }

  // === FULLSCREEN VISIT SUMMARY (Walk-in) ===
  if (step === "report" && careLevel === "walkin") {
    return (
      <VisitSummary
        transcript={transcript}
        assessment={assessment}
        language={i18n.language}
        onBack={() => setStep("main")}
      />
    );
  }

  // === MAP PAGE (separate page for hospitals/clinics/pharmacies) ===
  if (step === "map") {
    const mapType = isER ? "er" : "walkin";
    const mapTitle = isER
      ? "Nearest Emergency Rooms"
      : "Nearest Walk-In Clinics";

    return (
      <div className="min-h-[100dvh] flex flex-col bg-dark-bg relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 lg:px-8 pt-6 lg:pt-8 pb-4">
          <button
            onClick={() => setStep("main")}
            className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-white/5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg lg:text-2xl font-bold text-white">
              {mapTitle}
            </h1>
            <p className="text-xs lg:text-sm text-text-light">
              Sorted by distance from you
            </p>
          </div>
        </div>

        {/* Map + List */}
        <div className="flex-1 px-4 lg:px-8 pb-8 lg:pb-12 overflow-y-auto">
          <div className="max-w-sm lg:max-w-2xl mx-auto w-full animate-fade-in-up">
            {loadingFacilities ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-white/80 font-medium">Finding nearest facilities...</p>
                <p className="text-text-light text-xs mt-2 text-center max-w-xs">
                  Calculating drive times and ER capacities based on your exact location.
                </p>
              </div>
            ) : (
              <MapView
                facilities={facilities}
                type={mapType}
                showWaitTimes={isER}
              />
            )}
          </div>
        </div>

        {/* Start Over */}
        <div className="px-4 lg:px-8 pb-6 max-w-sm lg:max-w-2xl mx-auto w-full">
          <button
            onClick={onStartOver}
            className="w-full py-3.5 lg:py-4 px-5 rounded-xl font-medium text-text-light text-sm lg:text-base
              glass hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {t("app.startOver")}
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
        className="px-4 lg:px-8 pt-8 lg:pt-12 pb-6 lg:pb-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${config.borderColor}15 0%, transparent 100%)`,
        }}
      >
        <div className="relative z-10 text-center max-w-sm lg:max-w-2xl mx-auto">
          <div
            className="inline-flex items-center justify-center w-16 lg:w-20 h-16 lg:h-20 rounded-full mb-4 lg:mb-6 animate-glow-pulse"
            style={{
              backgroundColor: `${config.borderColor}20`,
              border: `2px solid ${config.borderColor}40`,
            }}
          >
            <Icon
              className="w-8 lg:w-10 h-8 lg:h-10"
              style={{ color: config.borderColor }}
            />
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold text-white mb-1 lg:mb-2">
            {t(`routing.${careLevel}.title`)}
          </h1>
          <p className="text-text-light text-sm lg:text-base">
            {t(`routing.${careLevel}.subtitle`)}
          </p>

          {/* CTAS mini badge */}
          <div className="mt-3 lg:mt-4 inline-flex items-center gap-2 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full glass-light">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ctasInfo.color }}
            />
            <span className="text-xs lg:text-sm text-text-light">
              CTAS {assessment?.ctasLevel} — {ctasInfo.name}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 lg:px-8 pb-8 lg:pb-12 max-w-sm lg:max-w-2xl mx-auto w-full">
        {/* ========== SELF-CARE ========== */}
        {careLevel === "selfcare" && (
          <div className="space-y-4 lg:space-y-5 animate-fade-in-up">
            {/* Big rest message */}
            <div
              className="rounded-xl p-6 lg:p-8 text-center"
              style={{
                backgroundColor: "rgba(72, 187, 120, 0.08)",
                border: "1px solid rgba(72, 187, 120, 0.2)",
              }}
            >
              <Home className="w-14 lg:w-16 h-14 lg:h-16 mx-auto mb-4 lg:mb-6 text-success" />
              <h2 className="text-xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
                Go home and rest.
              </h2>
              <p className="text-text-light text-sm lg:text-base leading-relaxed">
                Based on your assessment, you don't need to visit a facility
                right now. Take it easy and focus on recovery.
              </p>
            </div>

            {/* Care plan */}
            <div className="glass rounded-xl p-5 lg:p-6">
              <h3 className="font-semibold text-base lg:text-lg text-white mb-3 lg:mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-success" />
                Care Instructions
              </h3>
              <p className="text-sm lg:text-base text-text-light leading-relaxed">
                {assessment?.carePlanDetails ||
                  "Rest, stay hydrated, and monitor your symptoms for 48-72 hours. Take OTC pain relief as directed."}
              </p>
            </div>

            {/* Warning signs */}
            <div
              className="rounded-xl p-5 lg:p-6"
              style={{
                backgroundColor: "rgba(245, 101, 101, 0.06)",
                border: "1px solid rgba(245, 101, 101, 0.15)",
              }}
            >
              <h3 className="font-semibold text-base lg:text-lg text-white mb-3 lg:mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                If symptoms get worse...
              </h3>
              <p className="text-sm lg:text-base text-text-light leading-relaxed">
                Come back to{" "}
                <span className="text-primary font-semibold">Rivr</span> for a
                new assessment, or visit your nearest walk-in clinic or
                emergency room if you experience worsening or new symptoms.
              </p>
            </div>
          </div>
        )}

        {/* ========== PHARMACY ========== */}
        {careLevel === "pharmacy" && (
          <div className="space-y-4 lg:space-y-5 animate-fade-in-up">
            {/* Main message */}
            <div
              className="rounded-xl p-6 lg:p-8 text-center"
              style={{
                backgroundColor: "rgba(46, 155, 218, 0.08)",
                border: "1px solid rgba(46, 155, 218, 0.2)",
              }}
            >
              <Pill className="w-14 lg:w-16 h-14 lg:h-16 mx-auto mb-4 lg:mb-6 text-accent" />
              <h2 className="text-xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
                Visit your local pharmacy.
              </h2>
              <p className="text-text-light text-sm lg:text-base leading-relaxed">
                Based on your assessment, over-the-counter medication or a
                pharmacist consultation should help manage your symptoms.
              </p>
            </div>

            {/* Care instructions */}
            <div className="glass rounded-xl p-5 lg:p-6">
              <h3 className="font-semibold text-base lg:text-lg text-white mb-3 lg:mb-4 flex items-center gap-2">
                <Pill className="w-4 h-4 text-accent" />
                Care Instructions
              </h3>
              <p className="text-sm lg:text-base text-text-light leading-relaxed">
                {assessment?.carePlanDetails ||
                  "Speak with a pharmacist about your symptoms. They can recommend appropriate over-the-counter medication and advise if further medical attention is needed."}
              </p>
            </div>

            {/* Warning signs */}
            <div
              className="rounded-xl p-5 lg:p-6"
              style={{
                backgroundColor: "rgba(245, 101, 101, 0.06)",
                border: "1px solid rgba(245, 101, 101, 0.15)",
              }}
            >
              <h3 className="font-semibold text-base lg:text-lg text-white mb-3 lg:mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                If symptoms get worse...
              </h3>
              <p className="text-sm lg:text-base text-text-light leading-relaxed">
                Come back to{" "}
                <span className="text-primary font-semibold">Rivr</span> for a
                new assessment, or visit your nearest walk-in clinic or
                emergency room if you experience worsening or new symptoms.
              </p>
            </div>
          </div>
        )}

        {/* ========== WALK-IN ========== */}
        {careLevel === "walkin" && (
          <div className="space-y-4 lg:space-y-5 animate-fade-in-up">
            {/* Receptionist note card */}
            <div
              className="glass rounded-xl p-5 lg:p-6"
              style={{ borderLeft: `3px solid ${config.borderColor}` }}
            >
              <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <FileText className="w-4 h-4 text-warning" />
                <h3 className="font-semibold text-white text-sm lg:text-base">
                  Note for the Receptionist
                </h3>
              </div>
              <div className="space-y-2 text-xs lg:text-sm text-text-light">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-warning shrink-0" />
                  <span>
                    CTAS Level {assessment?.ctasLevel} — {ctasInfo.name}
                  </span>
                </div>
                <div className="pt-1 border-t border-white/5 mt-2">
                  <p className="leading-relaxed">
                    {assessment?.symptomSummary ||
                      "No symptom summary available."}
                  </p>
                </div>
              </div>
            </div>

            {/* View full report */}
            <button
              onClick={() => setStep("report")}
              className="w-full py-3.5 lg:py-4 px-5 rounded-xl font-medium text-white text-sm lg:text-base flex items-center justify-center gap-2
                glass hover:bg-white/5 transition-all duration-300 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              View Full Visit Summary
            </button>

            {/* Go to map button */}
            <button
              onClick={() => setStep("map")}
              className="w-full py-4 lg:py-5 px-5 rounded-xl font-semibold text-white text-sm lg:text-base flex items-center justify-center gap-2
                transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{
                backgroundColor: config.borderColor,
                boxShadow: `0 4px 15px ${config.borderColor}30`,
              }}
            >
              <MapPin className="w-5 h-5" />
              Find Nearby Walk-In Clinics
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ========== EMERGENCY ROOM ========== */}
        {careLevel === "er" && (
          <div className="space-y-4 lg:space-y-5 animate-fade-in-up">
            {/* Urgency banner */}
            {assessment?.ctasLevel <= 2 && (
              <div
                className="rounded-xl p-4 lg:p-6 flex items-center gap-3"
                style={{
                  backgroundColor: "rgba(245, 101, 101, 0.12)",
                  border: "1px solid rgba(245, 101, 101, 0.3)",
                }}
              >
                <Phone className="w-5 h-5 text-danger shrink-0" />
                <div>
                  <p className="text-sm lg:text-base font-semibold text-white">
                    {assessment?.ctasLevel === 1
                      ? "Call 911 Immediately"
                      : "Proceed to ER Now"}
                  </p>
                  <p className="text-xs lg:text-sm text-text-light">
                    {assessment?.ctasLevel === 1
                      ? "Your condition may require immediate emergency response."
                      : "Do not delay. Your condition requires emergency evaluation."}
                  </p>
                </div>
              </div>
            )}

            {/* Triage Summary Card */}
            <div
              className="glass rounded-xl p-4 lg:p-6"
              style={{ borderLeft: "3px solid #F56565" }}
            >
              <div className="flex items-center gap-2 mb-2 lg:mb-3">
                <FileText className="w-4 h-4 text-danger" />
                <h4 className="text-sm lg:text-base font-semibold text-white">
                  Triage Summary for ER Staff
                </h4>
              </div>
              <div className="space-y-2 text-xs lg:text-sm text-text-light">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-danger shrink-0" />
                  <span>
                    CTAS Level {assessment?.ctasLevel} — {ctasInfo.name}
                  </span>
                </div>
                <p className="text-text-light leading-relaxed mt-1">
                  {assessment?.symptomSummary ||
                    "No symptom summary available."}
                </p>
              </div>
            </div>

            {/* View full triage report */}
            <button
              onClick={() => setStep("report")}
              className="w-full py-3.5 lg:py-4 px-5 rounded-xl font-medium text-white text-sm lg:text-base flex items-center justify-center gap-2
                glass hover:bg-white/5 transition-all duration-300 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              View Full Triage Report
            </button>

            {/* Go to hospitals map */}
            <button
              onClick={() => setStep("map")}
              className="w-full py-4 lg:py-5 px-5 rounded-xl font-semibold text-white text-sm lg:text-base flex items-center justify-center gap-2
                transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{
                backgroundColor: config.borderColor,
                boxShadow: `0 4px 15px ${config.borderColor}30`,
              }}
            >
              <MapPin className="w-5 h-5" />
              Find Nearest Hospitals
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Start over */}
        <div className="mt-6 lg:mt-8">
          <button
            onClick={onStartOver}
            className="w-full py-3.5 lg:py-4 px-5 rounded-xl font-medium text-text-light text-sm lg:text-base
              glass hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {t("app.startOver")}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 lg:px-8 pb-6 max-w-sm lg:max-w-2xl mx-auto">
        <p className="text-xs lg:text-sm text-text-light/60 text-center leading-relaxed">
          {t("app.disclaimer")}
        </p>
      </div>
    </div>
  );
}
