import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  Heart,
  Wind,
  Brain,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { generateMockVitals, getVitalStatus } from "../services/presage";
import VitalsDisplay from "./ui/VitalsDisplay";

export default function VitalsScan({ onComplete }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const [phase, setPhase] = useState("permission"); // permission, scanning, complete
  const [timeLeft, setTimeLeft] = useState(10);
  const [vitals, setVitals] = useState(null);
  const [cameraError, setCameraError] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPhase("scanning");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(true);
      // Proceed with mock data even without camera
      setTimeout(() => {
        setPhase("scanning");
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (phase === "permission") {
      startCamera();
    }
  }, [phase, startCamera]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "scanning") return;

    if (timeLeft <= 0) {
      const mockVitals = generateMockVitals();
      setVitals(mockVitals);
      setPhase("complete");

      // Stop camera
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  const progress = ((10 - timeLeft) / 10) * 100;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden bg-dark-bg">
      {/* Header */}
      <div className="text-center pt-8 lg:pt-12 pb-4 px-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-primary text-sm lg:text-base font-medium">
            {t("vitals.title")}
          </span>
        </div>
        <p className="text-text-light text-sm lg:text-base max-w-xs mx-auto">
          {phase === "complete"
            ? t("vitals.complete")
            : t("vitals.instruction")}
        </p>
      </div>

      {/* Camera / Vitals Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {phase !== "complete" ? (
          <div className="relative w-full max-w-sm lg:max-w-md aspect-[3/4] rounded-3xl overflow-hidden glass border-white/10 shadow-2xl">
            {/* Camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-dark-bg-lighter"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Scanning overlay */}
            {phase === "scanning" && (
              <>
                {/* Corner guides */}
                <div className="absolute inset-8 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
                </div>

                {/* Scan line animation */}
                <div
                  className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
                  style={{
                    animation: "scan-line 3s ease-in-out infinite",
                    position: "absolute",
                  }}
                />

                {/* Progress ring overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="rgba(26,35,50,0.7)"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#0ABAB5"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {timeLeft}
                      </span>
                      <span className="text-xs text-text-light">sec</span>
                    </div>
                  </div>
                </div>

                {/* Pulse dots in corners */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  <span className="text-xs text-white/70 font-medium">
                    SCANNING
                  </span>
                </div>
              </>
            )}

            {/* No camera fallback */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-bg-lighter">
                <AlertCircle className="w-12 h-12 text-warning mb-3" />
                <p className="text-text-light text-sm text-center px-4">
                  {t("vitals.cameraError")}
                </p>
                <p className="text-text-light text-xs mt-2">
                  Using simulated scan...
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Vitals Results */
          <div className="w-full max-w-sm lg:max-w-md animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-6 lg:mb-8">
              <CheckCircle className="w-6 h-6 text-success" />
              <span className="text-success font-semibold text-lg lg:text-xl">
                {t("vitals.complete")}
              </span>
            </div>
            <VitalsDisplay vitals={vitals} />
          </div>
        )}
      </div>

      {/* Continue button */}
      {phase === "complete" && (
        <div
          className="px-4 pb-8 relative z-10 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <button
            onClick={() => onComplete(vitals)}
            className="w-full max-w-sm mx-auto block py-4 px-6 rounded-xl bg-primary hover:bg-primary-dark
              text-white font-semibold text-lg transition-all duration-300
              shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 cursor-pointer"
          >
            {t("app.continue")}
          </button>
        </div>
      )}
    </div>
  );
}
