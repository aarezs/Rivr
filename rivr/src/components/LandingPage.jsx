import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/LandingPage.css";
import {
  Mic,
  Activity,
  Globe,
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  Github,
} from "lucide-react";

export default function LandingPage({ onStart }) {
  const { t } = useTranslation();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-dark-bg text-white relative flex flex-col overflow-x-hidden selection:bg-primary/30 selection:text-white z-10">
      {/* 
        The background meshes (.river-bg, .river-streams) are handled globally 
        in index.css and rendered in App.jsx. 
      */}

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center animate-glow-pulse">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-2xl lg:text-3xl tracking-tight">
            Rivr
          </span>
        </div>

      <div className="hidden md:flex items-center gap-10 text-base font-medium text-text-light">
        <a href="#features" className="hover:text-white transition-colors">
          Features
        </a>
        <a href="#how-it-works" className="hover:text-white transition-colors">
          How it Works
        </a>
        <a href="#about" className="hover:text-white transition-colors">
          About
        </a>
      </div>

      <div className="flex items-center gap-4">
  <button className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-base transition-all shadow-lg shadow-primary/20">
    Sign In
  </button>

  <button
    onClick={onStart}
    className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-base transition-all shadow-lg shadow-primary/20"
  >
    Get Started
  </button>
</div>
    </nav>

      <main className="flex-1 w-full pt-20 md:pt-24 pb-20 lg:pb-32">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 test">
          {/* ===== HERO SECTION ===== */}
          <section className="text-center pt-6 md:pt-10 lg:pt-16 mb-16 md:mb-24 lg:mb-32 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 md:mb-8 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-xs lg:text-sm font-semibold tracking-wide uppercase">
                AI-Powered Triage for Canadians
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-8xl font-extrabold tracking-tight leading-tight mb-4 md:mb-6 lg:mb-8">
              Directing you to <br className="hidden md:block" />
              <span className="gradient-text">the right care</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-text-medium mx-auto leading-relaxed mb-8 md:mb-10 lg:mb-12 test2">
              Rivr reads your vitals, listens to your symptoms, and routes you
              to the care you actually need in any language.
            </p>

            <div className="box flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-12 md:mb-16 lg:mb-20">
              <button
                onClick={onStart}
                className="btn w-full sm:w-auto px-8 py-4 lg:p-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-lg lg:text-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                Start Your Assessment
              </button>
              <a
                href="#how-it-works"
                className="btn w-full sm:w-auto px-8 lg:px-10 py-4 lg:py-5 rounded-xl glass hover:bg-white/5 text-white font-medium text-lg lg:text-xl transition-all flex items-center justify-center border border-white/10"
              >
                Learn More
              </a>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-16 md:mt-20 lg:mt-32 pt-8 md:pt-12 lg:pt-16 border-t border-white/5 animate-fade-in test3"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex flex-col items-center">
                <Activity className="w-6 lg:w-8 h-6 lg:h-8 text-primary mb-3 lg:mb-4" />
                <h4 className="font-bold text-lg lg:text-xl mb-1 lg:mb-2">
                  Real-time
                </h4>
                <p className="text-text-light text-sm lg:text-base">
                  Vitals Monitored
                </p>
              </div>
              <div className="flex flex-col items-center">
                <Globe className="w-6 lg:w-8 h-6 lg:h-8 text-primary mb-3 lg:mb-4" />
                <h4 className="font-bold text-lg lg:text-xl mb-1 lg:mb-2">
                  20+
                </h4>
                <p className="text-text-light text-sm lg:text-base">
                  Languages
                </p>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="w-6 lg:w-8 h-6 lg:h-8 text-primary mb-3 lg:mb-4" />
                <h4 className="font-bold text-lg lg:text-xl mb-1 lg:mb-2">
                  Instant
                </h4>
                <p className="text-text-light text-sm lg:text-base">
                  Care Routing
                </p>
              </div>
            </div>
          </section>

          {/* ===== FEATURES GRID ===== */}
          <section
            id="features"
            className="mb-16 md:mb-24 lg:mb-40 pt-8 md:pt-12 lg:pt-16 scroll-mt-32 test4"
          >
            <div className="text-center mb-12 md:mb-16 lg:mb-20">
              <p className="text-primary text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase mb-2 md:mb-3">
                Your Care Stream
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 lg:mb-6">
                Healthcare that{" "}
                <span className="text-accent-light">flows to you</span>
              </h2>
              <p className="text-text-medium text-sm sm:text-base md:text-lg lg:text-xl test5 mx-auto">
                Feel sick? Let Rivr guide you to the care you need —
                intelligently, instantly, compassionately.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
              {[
                {
                  icon: Mic,
                  title: "Voice Symptom Input",
                  desc: "Describe your symptoms naturally in any language. Rivr listens and understands.",
                },
                {
                  icon: Activity,
                  title: "Smart Vitals Reading",
                  desc: "Connect your wearable or use your phone's sensors to stream real-time vitals.",
                },
                {
                  icon: MapPin,
                  title: "Intelligent Care Routing",
                  desc: "Rivr flows you to the nearest and most appropriate care — ER, clinic, or telehealth.",
                },
                {
                  icon: Globe,
                  title: "Multilingual Support",
                  desc: "Break language barriers. Get assessed in 20+ languages with full medical accuracy.",
                },
                {
                  icon: Shield,
                  title: "AI-Powered Triage",
                  desc: "Clinically validated algorithms assess urgency so you get the right care, fast.",
                },
                {
                  icon: Clock,
                  title: "Real-Time Wait Times",
                  desc: "See live wait times at nearby facilities before you even leave home.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl p-6 md:p-8 lg:p-10 hover:-translate-y-1 transition-transform duration-300 test6"
                >
                  <div className="w-12 md:w-13 lg:w-14 h-12 md:h-13 lg:h-14 rounded-xl bg-dark-bg-lighter border border-white/5 flex items-center justify-center mb-4 md:mb-6 lg:mb-8">
                    <f.icon className="w-6 md:w-6 lg:w-7 h-6 md:h-6 lg:h-7 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 lg:mb-4">
                    {f.title}
                  </h3>
                  <p className="text-text-medium text-xs sm:text-sm md:text-base lg:text-base leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ===== HOW IT WORKS ===== */}
          <section
            id="how-it-works"
            className="mb-16 md:mb-24 lg:mb-40 pt-8 md:pt-12 lg:pt-16 scroll-mt-32"
          >
            <div className="text-center mb-12 md:mb-16 lg:mb-20">
              <p className="text-primary text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase mb-2 md:mb-3">
                How it Works
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 lg:mb-6">
                Your care journey,{" "}
                <span className="text-primary-light">streamlined</span>
              </h2>
            </div>

            <div className="test7">
              <div className="test8 mx-auto space-y-10 md:space-y-14 lg:space-y-16 py-4">
                {[
                  {
                    step: "01",
                    title: "Tell Rivr how you feel",
                    desc: "Speak or type your symptoms in any language. Our AI understands context, severity, and nuance.",
                  },
                  {
                    step: "02",
                    title: "Rivr reads your vitals",
                    desc: "Connect a wearable or use phone sensors. Heart rate, SpO2, temperature — streamed in real-time.",
                  },
                  {
                    step: "03",
                    title: "AI triage assessment",
                    desc: "Our clinically validated AI evaluates your data and determines the urgency of your situation.",
                  },
                  {
                    step: "04",
                    title: "Routed to the right care",
                    desc: "Rivr flows you to the best option — ER, walk-in clinic, telehealth, or self-care — with live wait times.",
                  },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-6 md:gap-8">
                    <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-primary flex items-center justify-center text-dark-bg font-bold text-base md:text-lg lg:text-2xl shadow-lg shadow-primary/30">
                      {s.step}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">
                        {s.title}
                      </h3>
                      <p className="text-text-medium text-sm md:text-base lg:text-lg leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== APP PREVIEW / DIAGNOSIS MOCKUP ===== */}
          <section className="mb-16 md:mb-24 lg:mb-40 pt-8 md:pt-12 lg:pt-16 test9">
            <div className="text-center mb-12 md:mb-16 lg:mb-20 !p-4">
              <p className="text-primary text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase mb-2 md:mb-3">
                Live Preview
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 lg:mb-6">
                Assessment results{" "}
                <span className="text-primary-light">pour in</span>
              </h2>
            </div>

            {/* Mobile Phone Mockup */}
            <div className="test10">
              <div className="!p-4 relative mx-auto w-full max-w-sm lg:max-w-lg rounded-[3rem] border-8 border-dark-bg-lighter bg-[#0F172A] shadow-2xl p-6 lg:p-8 overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
                  <div className="w-32 h-6 bg-dark-bg-lighter rounded-b-3xl"></div>
                </div>

                <div className="mt-8 flex items-center justify-between mb-8">
                  <div className="text-xs font-medium text-white/50">
                    9:41 AM
                  </div>
                  <div className="w-6 h-2 rounded-full bg-primary/80"></div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-primary text-[10px] font-bold tracking-widest uppercase mb-1">
                    Your Care Stream
                  </p>
                  <h3 className="text-xl font-bold">Triage Assessment</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass rounded-xl p-4">
                    <Activity className="w-4 h-4 text-primary mb-2" />
                    <div className="text-[10px] text-text-light mb-1">
                      Heart Rate
                    </div>
                    <div className="font-bold text-lg mb-1">
                      82 <span className="text-xs font-normal">bpm</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                      Normal
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="w-4 h-4 rounded text-warning mb-2 border border-warning/50 flex items-center justify-center font-bold text-[10px]">
                      !
                    </div>
                    <div className="text-[10px] text-text-light mb-1">Temp</div>
                    <div className="font-bold text-lg mb-1">
                      37.8<span className="text-xs font-normal">°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-warning">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning" />{" "}
                      Elevated
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div
                      className="w-4 h-4 text-primary mb-2"
                      style={{
                        clipPath: "circle(50% at 50% 50%)",
                        background: "currentColor",
                      }}
                    />
                    <div className="text-[10px] text-text-light mb-1">SpO2</div>
                    <div className="font-bold text-lg mb-1">
                      97<span className="text-xs font-normal">%</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                      Normal
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <Activity className="w-4 h-4 text-primary mb-2 opacity-70" />
                    <div className="text-[10px] text-text-light mb-1">BP</div>
                    <div className="font-bold text-lg mb-1">128/82</div>
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />{" "}
                      Normal
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 mb-6 border-l-2 border-l-warning">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Semi-Urgent
                    </h4>
                  </div>
                  <p className="text-xs text-text-medium leading-relaxed">
                    Based on your symptoms and vitals, we recommend visiting a
                    walk-in clinic within the next 4 hours.
                  </p>
                </div>

                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-lg shadow-primary/20">
                  Find Nearest Clinic →
                </button>

                {/* Soft glow behind the phone */}
                <div className="absolute -inset-10 bg-primary/20 blur-[80px] -z-10 animate-glow-pulse" />
              </div>
            </div>
          </section>

          {/* ===== FINAL CTA & FOOTER ===== */}
          <section className="text-center pt-12 md:pt-16 lg:pt-24 border-t border-white/5">
            <p className="text-primary text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase mb-4 md:mb-6 lg:mb-8">
              Because care can't wait
            </p>
            <h2 className="text-2xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold mb-6 md:mb-8 lg:mb-12 leading-tight">
              Because no one should die
              <br className="hidden sm:block" /> in a waiting room they didn't
              <br className="hidden sm:block" /> need to be in.
            </h2>
            <p className="text-text-medium text-sm md:text-base lg:text-lg xl:text-xl mb-10 md:mb-12 lg:mb-20">
              AI-powered triage and care routing for underserved Canadians.
            </p>

            <div className="!p-6 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-20 md:mb-24 lg:mb-32">
              <button
                onClick={onStart}
                className="!p-4 w-full sm:w-auto px-8 lg:px-10 py-4 lg:py-5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-lg lg:text-xl transition-all shadow-lg shadow-primary/20"
              >
                Start Your Journey
              </button>
              <button className=" !p-4 w-full sm:w-auto px-8 lg:px-10 py-4 lg:py-5 rounded-xl glass hover:bg-white/5 text-white font-medium text-lg lg:text-xl transition-all border border-white/10">
                Partner With Us
              </button>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between pt-6 md:pt-8 lg:pt-12 border-t border-white/5 text-xs sm:text-sm md:text-base lg:text-base text-text-light gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="font-bold text-white mr-2">Rivr</span>
                <span className="hidden lg:inline">
                  — Directing you to the right care.
                </span>
              </div>

              <div className="text-xs lg:text-sm text-text-medium text-center lg:text-right">
                © 2026 Rivr Health. Built for Canadians who deserve better care
                access.
              </div>

              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
