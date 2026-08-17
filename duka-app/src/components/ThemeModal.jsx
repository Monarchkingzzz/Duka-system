import React, { useState, useEffect } from "react";
import {
  X, Sun, Moon, Sparkles, Check, Palette, Laptop, CheckCircle2, SlidersHorizontal
} from "lucide-react";
import { THEMES, getThemeById, getOppositeModeTheme } from "../lib/themes";

export default function ThemeModal({ isOpen, onClose, currentTheme, onSelectTheme }) {
  const [filter, setFilter] = useState("all"); // 'all' | 'light' | 'dark'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentThemeObj = getThemeById(currentTheme);
  const isCurrentDark = currentThemeObj.type === "dark";

  const filteredThemes = THEMES.filter((t) => {
    if (filter === "light") return t.type === "light";
    if (filter === "dark") return t.type === "dark";
    return true;
  });

  const handleQuickToggleMode = () => {
    const nextTheme = getOppositeModeTheme(currentTheme);
    onSelectTheme(nextTheme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white border border-stone-200 rounded-3xl shadow-soft max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 grid place-items-center shrink-0">
              <Palette size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-stone-900">
                  Theme & Appearance
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {THEMES.length} styles
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Personalize your workspace palette, lighting, and chart accents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick 1-click Dark/Light switcher */}
            <button
              onClick={handleQuickToggleMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors"
              title={isCurrentDark ? "Switch to Light theme" : "Switch to Dark theme"}
            >
              {isCurrentDark ? (
                <>
                  <Sun size={14} className="text-amber-500" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-indigo-600" />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-stone-200 hover:bg-stone-100 grid place-items-center text-stone-400 hover:text-stone-700 transition-colors"
              title="Close theme picker (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-stone-50/70 border-b border-stone-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === "all"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              All Themes ({THEMES.length})
            </button>
            <button
              onClick={() => setFilter("light")}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === "light"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Sun size={13} className={filter === "light" ? "text-white" : "text-amber-500"} />
              Light Themes (5)
            </button>
            <button
              onClick={() => setFilter("dark")}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === "dark"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Moon size={13} className={filter === "dark" ? "text-white" : "text-indigo-400"} />
              Dark Themes (5)
            </button>
          </div>

          <div className="text-[11px] text-stone-400 font-medium">
            Active: <span className="font-bold text-stone-700">{currentThemeObj.name}</span>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          {filteredThemes.map((theme) => {
            const isActive = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={`relative group cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 shadow-card theme-card-active"
                    : "border-stone-200 hover:border-stone-400 bg-white hover:shadow-card"
                }`}
              >
                <div>
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{theme.name}</span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white shadow-xs">
                            <Check size={11} strokeWidth={3} /> Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 font-medium">{theme.subtitle}</div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        theme.type === "dark"
                          ? "bg-stone-900 text-stone-200 border-stone-800"
                          : "bg-stone-100 text-stone-700 border-stone-200"
                      }`}
                    >
                      {theme.type === "dark" ? (
                        <>
                          <Moon size={10} className="text-indigo-400" /> Dark
                        </>
                      ) : (
                        <>
                          <Sun size={10} className="text-amber-500" /> Light
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 mb-3.5 line-clamp-2">
                    {theme.description}
                  </p>

                  {/* Visual Mock Card Preview */}
                  <div
                    className="rounded-xl p-3 border shadow-xs transition-transform group-hover:scale-[1.01]"
                    style={{
                      backgroundColor: theme.preview.bg,
                      borderColor: theme.preview.border
                    }}
                  >
                    <div
                      className="rounded-lg p-2.5 border flex items-center justify-between"
                      style={{
                        backgroundColor: theme.preview.surface,
                        borderColor: theme.preview.border,
                        color: theme.preview.text
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-md grid place-items-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: theme.preview.primary }}
                        >
                          <Sparkles size={13} />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight truncate">
                            {theme.name}
                          </div>
                          <div
                            className="text-[10px] font-medium opacity-70"
                            style={{ color: theme.preview.primary }}
                          >
                            Sample Accent
                          </div>
                        </div>
                      </div>

                      {/* Mini action pill */}
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white"
                        style={{ backgroundColor: theme.preview.primary }}
                      >
                        Preview
                      </span>
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1.5 mt-2.5 px-1">
                      <span className="text-[9px] uppercase tracking-wider text-stone-400 font-semibold mr-1">
                        Palette:
                      </span>
                      <div
                        className="h-3.5 w-3.5 rounded-full border border-stone-300 shadow-2xs"
                        style={{ backgroundColor: theme.preview.bg }}
                        title="Background"
                      />
                      <div
                        className="h-3.5 w-3.5 rounded-full border border-stone-300 shadow-2xs"
                        style={{ backgroundColor: theme.preview.surface }}
                        title="Card Surface"
                      />
                      <div
                        className="h-3.5 w-3.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: theme.preview.primary }}
                        title="Primary Accent"
                      />
                      <div
                        className="h-3.5 w-3.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: theme.chart.line }}
                        title="Chart Accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom button */}
                <div className="mt-3 pt-2 flex items-center justify-between border-t border-stone-100">
                  <span className="text-[11px] text-stone-400 group-hover:text-stone-600 font-medium transition-colors">
                    {isActive ? "Currently in use" : "Click to apply theme"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTheme(theme.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-emerald-700 text-white"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                    }`}
                  >
                    {isActive ? "Applied" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-stone-500">
            Selected theme is automatically saved for future visits.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTheme("light")}
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 hover:bg-white text-xs font-medium text-stone-600 transition-colors"
            >
              Reset to Default (Emerald Light)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
