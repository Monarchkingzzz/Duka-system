import React, { useState, useEffect, useRef } from "react";
import {
  Sun, Moon, Sunrise, Sunset, Sparkles, Clock, TrendingUp, TrendingDown,
  Plus, Crown, ShieldCheck, Flame, ShoppingBag, DollarSign,
  Activity, Palette, ArrowUpRight, ArrowDownRight, Zap, AlertTriangle, CheckCircle2
} from "lucide-react";

export default function GreetingHero({
  user,
  isOwner = true,
  todayRevenue = 0,
  todayProfit = 0,
  todayExpenses = 0,
  todayCOGS = 0,
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

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
    subtext: defaultSubtext,
    pillText,
    icon: TimeIcon,
    gradientTheme,
    orbGlow
  } = timeState;

  const isLoss = todayProfit < 0;
  const isProfit = todayProfit > 0;
  const isBreakEven = todayProfit === 0;
  const profitMargin = todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 0;
  const displayName = user?.name && user.name !== "You" && user.name !== "owner" ? user.name.split(" ")[0] : (isOwner ? "Maurice" : "Staff");

  // Tailored Profit vs Loss Owner Narrative
  let ownerNarrative = defaultSubtext;
  if (isOwner) {
    if (isLoss) {
      ownerNarrative = `⚠️ Attention Maurice: Store is operating at a Net Loss of -KSh ${Math.round(Math.abs(todayProfit)).toLocaleString("en-KE")} today. Recorded expenses (KSh ${Math.round(todayExpenses).toLocaleString("en-KE")}) and product buying costs exceed today's sales revenue.`;
    } else if (isProfit) {
      ownerNarrative = `🎉 Great job Maurice! Your store has generated a Net Profit of +KSh ${Math.round(todayProfit).toLocaleString("en-KE")} (${profitMargin}% margin) from KSh ${Math.round(todayRevenue).toLocaleString("en-KE")} in total sales today.`;
    } else {
      ownerNarrative = `Maurice, your store is currently at break-even (KSh 0 net profit). Ring up new sales to generate profit for today.`;
    }
  }

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
        className={`greeting-3d-card relative overflow-hidden rounded-3xl p-6 sm:p-7 border shadow-2xl transition-all duration-300 ${gradientTheme} ${
          isOwner && isLoss ? "border-rose-400/50 dark:border-rose-500/40" : "border-white/40 dark:border-stone-700/60"
        }`}
      >
        {/* Specular Light Sheen Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/25 opacity-70 mix-blend-overlay rounded-3xl" />

        {/* Ambient Floating 3D Spheres in Background */}
        <div
          className={`pointer-events-none absolute -top-16 -right-12 w-64 h-64 rounded-full blur-2xl opacity-60 transition-all duration-700 ${
            isOwner && isLoss ? "bg-rose-500/30" : orbGlow
          }`}
        />
        <div
          className={`pointer-events-none absolute -bottom-16 -left-10 w-48 h-48 rounded-full blur-2xl opacity-50 ${
            isOwner && isLoss ? "bg-rose-400/20" : "bg-emerald-400/20"
          }`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Greeting, Live Clock & Narrative */}
          <div className="space-y-3.5 flex-1 min-w-0" style={{ transform: "translateZ(30px)" }}>
            {/* Top Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Role / Tier Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-900/85 text-amber-300 backdrop-blur-md border border-amber-400/30 shadow-sm">
                {isOwner ? <Crown size={13} className="text-amber-400 animate-bounce" /> : <ShieldCheck size={13} className="text-emerald-400" />}
                <span>{isOwner ? "Store Owner & Admin" : "Sales Staff"}</span>
              </div>

              {/* Dynamic Real-time Profit / Loss Indicator Pill for Owner */}
              {isOwner && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm transition-all ${
                    isLoss
                      ? "bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/40 animate-pulse"
                      : isProfit
                      ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40"
                      : "bg-stone-500/20 text-stone-700 dark:text-stone-300 border border-stone-400/30"
                  }`}
                >
                  {isLoss ? (
                    <>
                      <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
                      <span>🔴 Loss Made: -KSh {Math.round(Math.abs(todayProfit)).toLocaleString("en-KE")}</span>
                    </>
                  ) : isProfit ? (
                    <>
                      <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>🟢 Profit Made: +KSh {Math.round(todayProfit).toLocaleString("en-KE")} ({profitMargin}%)</span>
                    </>
                  ) : (
                    <>
                      <Activity size={13} className="text-stone-500" />
                      <span>⚪ Break-even (KSh 0 Profit)</span>
                    </>
                  )}
                </div>
              )}

              {/* Time of Day Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/70 dark:bg-stone-900/60 backdrop-blur-md border border-white/60 dark:border-stone-700/60 text-stone-800 dark:text-stone-200 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLoss ? "bg-rose-400" : "bg-emerald-400"}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isLoss ? "bg-rose-500" : "bg-emerald-500"}`} />
                </span>
                <span>{pillText}</span>
              </div>

              {/* Live Real-time Clock */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-stone-900/70 text-white backdrop-blur-md border border-white/20 shadow-2xs">
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
              
              {/* Highlighted Status Narrative */}
              <p className={`text-xs sm:text-sm font-medium leading-relaxed max-w-2xl ${
                isOwner && isLoss
                  ? "text-rose-900 dark:text-rose-200 font-semibold"
                  : "text-stone-700 dark:text-stone-300"
              }`}>
                {ownerNarrative}
              </p>
            </div>

            {/* Visual Profit & Loss Breakdown Ribbon for Owner */}
            {isOwner && (
              <div className="pt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl text-xs">
                {/* 1. Sales Revenue */}
                <div className="p-2 rounded-xl bg-white/70 dark:bg-stone-800/70 border border-white/60 dark:border-stone-700/50 backdrop-blur-sm">
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">1. Sales Revenue</div>
                  <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                    +KSh {Math.round(todayRevenue).toLocaleString("en-KE")}
                  </div>
                </div>

                {/* 2. Buying Cost (COGS) */}
                <div className="p-2 rounded-xl bg-white/70 dark:bg-stone-800/70 border border-white/60 dark:border-stone-700/50 backdrop-blur-sm">
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">2. Buying Cost</div>
                  <div className="text-sm font-bold font-mono text-stone-600 dark:text-stone-300 mt-0.5">
                    −KSh {Math.round(todayCOGS).toLocaleString("en-KE")}
                  </div>
                </div>

                {/* 3. Expenses */}
                <div className="p-2 rounded-xl bg-white/70 dark:bg-stone-800/70 border border-white/60 dark:border-stone-700/50 backdrop-blur-sm">
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">3. Day Expenses</div>
                  <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                    −KSh {Math.round(todayExpenses).toLocaleString("en-KE")}
                  </div>
                </div>

                {/* 4. Net Profit / Loss Result */}
                <div className={`p-2 rounded-xl border backdrop-blur-sm shadow-2xs ${
                  isLoss
                    ? "bg-rose-100/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/60"
                    : isProfit
                    ? "bg-emerald-100/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/60"
                    : "bg-white/70 dark:bg-stone-800/70 border-white/60 dark:border-stone-700/50"
                }`}>
                  <div className="text-[10px] uppercase tracking-wider font-bold flex items-center justify-between">
                    <span className={isLoss ? "text-rose-800 dark:text-rose-300" : isProfit ? "text-emerald-800 dark:text-emerald-300" : "text-stone-500"}>
                      {isLoss ? "Net Loss" : isProfit ? "Net Profit" : "Break-even"}
                    </span>
                    {isLoss ? <TrendingDown size={12} className="text-rose-600" /> : <TrendingUp size={12} className="text-emerald-600" />}
                  </div>
                  <div className={`text-sm font-extrabold font-mono mt-0.5 ${
                    isLoss ? "text-rose-700 dark:text-rose-300" : isProfit ? "text-emerald-700 dark:text-emerald-300" : "text-stone-700"
                  }`}>
                    {isLoss ? "−" : "+"}KSh {Math.round(Math.abs(todayProfit)).toLocaleString("en-KE")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: 3D Holographic Floating Sphere & Quick Actions */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0" style={{ transform: "translateZ(50px)" }}>
            {/* 3D Visual Elemental Sphere representing time of day / store health */}
            <div className="greeting-3d-sphere-wrapper relative group cursor-pointer" title={`Current Status: ${pillText}`}>
              {/* Outer Orbit Light Ring */}
              <div className={`absolute -inset-2 rounded-full border border-dashed animate-spin-slow pointer-events-none ${
                isLoss ? "border-rose-400/60" : "border-white/40"
              }`} />
              
              {/* Core 3D Shimmering Glass Sphere */}
              <div className={`greeting-3d-sphere w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden transition-transform duration-500 group-hover:scale-110 ${
                isLoss ? "greeting-3d-sphere-loss" : ""
              }`}>
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
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-white text-[9px] font-bold tracking-wider uppercase border shadow-md ${
                isLoss ? "bg-rose-900 border-rose-400/40" : "bg-stone-900/90 border-white/20"
              }`}>
                {isLoss ? "Loss Alert" : period}
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
