import React, { useState, useEffect, useRef } from "react";
import {
  Sun, Moon, Sunrise, Sunset, Sparkles, Clock, TrendingUp,
  Plus, Crown, ShieldCheck, Flame, ShoppingBag, DollarSign,
  Activity, Palette, ArrowUpRight, Zap
} from "lucide-react";

export default function GreetingHero({
  user,
  isOwner = true,
  todayRevenue = 0,
  todayProfit = 0,
  todaySalesCount = 0,
  lowStockCount = 0,
  onNavigate,
  onOpenThemes,
  themeObj
}) {
  const [timeState, setTimeState] = useState(() => getCurrentTimeInfo());
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const cardRef = useRef(null);

  // Live real-time clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(getCurrentTimeInfo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3D Tilt handler on mouse move
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within element
    const y = e.clientY - rect.top;  // y position within element
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max tilt angles: 7deg X, 8deg Y
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setTilt({ x: rotateX, y: rotateY, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
  };

  const {
    greeting,
    period,
    formattedTime,
    formattedDate,
    seconds,
    subtext,
    pillText,
    icon: TimeIcon,
    gradientTheme,
    orbGlow
  } = timeState;

  const isLoss = todayProfit < 0;
  const displayName = user?.name && user.name !== "You" && user.name !== "owner" ? user.name.split(" ")[0] : (isOwner ? "Maurice" : "Staff");

  return (
    <div className="relative mb-6 select-none" style={{ perspective: "1400px" }}>
      {/* Dynamic 3D Card Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: tilt.active
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.01, 1.01, 1.01)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: tilt.active ? "transform 0.1s ease-out" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)"
        }}
        className={`greeting-3d-card relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-white/40 shadow-2xl transition-all duration-300 ${gradientTheme}`}
      >
        {/* Specular Light Sheen Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/25 opacity-70 mix-blend-overlay rounded-3xl" />

        {/* Ambient Floating 3D Spheres in Background */}
        <div
          className={`pointer-events-none absolute -top-16 -right-12 w-64 h-64 rounded-full blur-2xl opacity-60 transition-all duration-700 ${orbGlow}`}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-emerald-400/20 blur-2xl opacity-50"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Greeting, Live Clock & Narrative */}
          <div className="space-y-3 flex-1 min-w-0" style={{ transform: "translateZ(30px)" }}>
            {/* Top Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Role / Tier Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-900/80 text-amber-300 backdrop-blur-md border border-amber-400/30 shadow-sm">
                {isOwner ? <Crown size={13} className="text-amber-400 animate-bounce" /> : <ShieldCheck size={13} className="text-emerald-400" />}
                <span>{isOwner ? "Store Owner & Admin" : "Sales Cashier"}</span>
              </div>

              {/* Time of Day Pill with live pulsing indicator */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/70 dark:bg-stone-900/60 backdrop-blur-md border border-white/60 dark:border-stone-700/60 text-stone-800 dark:text-stone-200 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{pillText}</span>
              </div>

              {/* Live Real-time Kenya Clock */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-stone-900/60 text-white backdrop-blur-md border border-white/20 shadow-2xs">
                <Clock size={12} className="text-emerald-400" />
                <span>{formattedTime}</span>
                <span className="text-[10px] text-emerald-400 opacity-80">:{seconds}</span>
              </div>
            </div>

            {/* Main Dynamic 3D Greeting Headline */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-2.5 flex-wrap">
                <span className="greeting-3d-text bg-clip-text text-transparent bg-gradient-to-r from-stone-950 via-emerald-950 to-stone-800 dark:from-white dark:via-emerald-200 dark:to-stone-100">
                  {greeting}, {displayName}
                </span>
                <span className="inline-block animate-wave origin-[70%_70%] text-2xl sm:text-3xl">👋</span>
              </h1>
              
              <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300 max-w-xl leading-relaxed">
                {subtext}
              </p>
            </div>

            {/* Quick Live Performance Ticker inside the Greeting for Owner */}
            {isOwner && (
              <div className="pt-1 flex items-center gap-4 flex-wrap text-xs font-semibold text-stone-700 dark:text-stone-200">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-white/60 dark:border-stone-700/50 backdrop-blur-sm">
                  <Flame size={13} className="text-amber-500" />
                  <span>Today's Sales:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                    KSh {Math.round(todayRevenue).toLocaleString("en-KE")}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-white/60 dark:border-stone-700/50 backdrop-blur-sm">
                  <TrendingUp size={13} className={isLoss ? "text-rose-500" : "text-emerald-600"} />
                  <span>Net Profit:</span>
                  <span className={`font-bold font-mono ${isLoss ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {isLoss ? "-" : "+"}KSh {Math.round(Math.abs(todayProfit)).toLocaleString("en-KE")}
                  </span>
                </div>

                <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 dark:bg-stone-800/60 border border-white/60 dark:border-stone-700/50 backdrop-blur-sm text-stone-500 dark:text-stone-400">
                  <span>{formattedDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: 3D Holographic Floating Sphere & Quick Actions */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0" style={{ transform: "translateZ(50px)" }}>
            {/* 3D Visual Elemental Sphere representing time of day */}
            <div className="greeting-3d-sphere-wrapper relative group cursor-pointer" title={`Current Status: ${pillText}`}>
              {/* Outer Orbit Light Ring */}
              <div className="absolute -inset-2 rounded-full border border-white/40 border-dashed animate-spin-slow pointer-events-none" />
              
              {/* Core 3D Shimmering Glass Sphere */}
              <div className="greeting-3d-sphere w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden transition-transform duration-500 group-hover:scale-110">
                {/* 3D Specular Highlight & Glass Curvature */}
                <div className="absolute top-1 left-2 w-7 h-4 rounded-full bg-white/60 blur-[1px] rotate-[-25deg]" />
                <div className="absolute bottom-1 right-2 w-9 h-5 rounded-full bg-black/20 blur-[2px]" />
                
                {/* Active Celestial Icon */}
                <TimeIcon
                  size={32}
                  className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] relative z-10 transition-transform duration-300 group-hover:rotate-12"
                />

                {/* Floating micro sparkle */}
                <Sparkles size={13} className="absolute top-2 right-2 text-amber-200 animate-pulse z-10" />
              </div>

              {/* Mini Status Tag floating below 3D Sphere */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-stone-900/90 text-white text-[9px] font-bold tracking-wider uppercase border border-white/20 shadow-md">
                {period}
              </div>
            </div>

            {/* Quick Action Button Group */}
            <div className="flex items-center gap-2 flex-wrap" style={{ transform: "translateZ(35px)" }}>
              <button
                onClick={() => onNavigate("sales")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 shadow-md shadow-emerald-900/20 hover:shadow-lg transition-all duration-200"
              >
                <Plus size={15} />
                <span>New Sale</span>
              </button>

              <button
                onClick={onOpenThemes}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 bg-white/70 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-700 active:scale-95 border border-white/60 dark:border-stone-600/60 shadow-2xs backdrop-blur-sm transition-all"
                title="Change Theme Appearance"
              >
                <Palette size={14} className="text-emerald-600" />
                <span className="hidden xl:inline">Themes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Real-Time Time Engine ----------
function getCurrentTimeInfo() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const isPM = hours >= 12;
  const displayHours = (hours % 12 || 12).toString().padStart(2, "0");
  const formattedTime = `${displayHours}:${minutes} ${isPM ? "PM" : "AM"}`;
  
  const formattedDate = now.toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "short"
  });

  // Morning (5:00 AM - 11:59 AM)
  if (hours >= 5 && hours < 12) {
    return {
      period: "Morning",
      greeting: "Good morning",
      formattedTime,
      formattedDate,
      seconds,
      subtext: "Start the day with fresh energy. Track opening stock and ring up early shoppers.",
      pillText: "🌅 Morning Shift Active",
      icon: Sunrise,
      gradientTheme: "greeting-gradient-morning",
      orbGlow: "bg-amber-400/40"
    };
  }

  // Afternoon (12:00 PM - 4:59 PM)
  if (hours >= 12 && hours < 17) {
    return {
      period: "Afternoon",
      greeting: "Good afternoon",
      formattedTime,
      formattedDate,
      seconds,
      subtext: "Peak trading hours are underway! Keep an eye on fast-moving goods & cash flow.",
      pillText: "☀️ Peak Sales Flow",
      icon: Sun,
      gradientTheme: "greeting-gradient-afternoon",
      orbGlow: "bg-emerald-400/40"
    };
  }

  // Evening (5:00 PM - 8:59 PM)
  if (hours >= 17 && hours < 21) {
    return {
      period: "Evening",
      greeting: "Good evening",
      formattedTime,
      formattedDate,
      seconds,
      subtext: "Evening closing hours. Reconcile daily register tallies, M-Pesa receipts & restock.",
      pillText: "🌇 Evening Cashout",
      icon: Sunset,
      gradientTheme: "greeting-gradient-evening",
      orbGlow: "bg-orange-500/40"
    };
  }

  // Night / Late Night (9:00 PM - 4:59 AM)
  return {
    period: "Night",
    greeting: hours >= 21 ? "Good evening" : "Late hours",
    formattedTime,
    formattedDate,
    seconds,
    subtext: "Store registers closed. Reviewing business analytics & financial performance for tomorrow.",
    pillText: "🌙 Night Operations",
    icon: Moon,
    gradientTheme: "greeting-gradient-night",
    orbGlow: "bg-indigo-500/40"
  };
}
