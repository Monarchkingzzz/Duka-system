export const THEMES = [
  // --- Light Themes ---
  {
    id: "light",
    name: "Emerald Light",
    subtitle: "Duka Classic",
    type: "light",
    description: "Crisp white surfaces, clean stone background with rich emerald accents.",
    accentColor: "#047857",
    preview: {
      bg: "#f7f8f7",
      surface: "#ffffff",
      primary: "#047857",
      border: "#e7e5e4",
      text: "#1c1917"
    },
    chart: {
      line: "#059669",
      grid: "#f0efed",
      text: "#a8a29e",
      gradient: "#10b981"
    }
  },
  {
    id: "pure-white",
    name: "Minimal Slate",
    subtitle: "Pure White & Indigo",
    type: "light",
    description: "Ultra-clean pure white and cool slate surfaces with royal indigo accents.",
    accentColor: "#2563eb",
    preview: {
      bg: "#f8fafc",
      surface: "#ffffff",
      primary: "#2563eb",
      border: "#e2e8f0",
      text: "#0f172a"
    },
    chart: {
      line: "#2563eb",
      grid: "#f1f5f9",
      text: "#94a3b8",
      gradient: "#3b82f6"
    }
  },
  {
    id: "sunset",
    name: "Savannah Sunset",
    subtitle: "Warm Terracotta",
    type: "light",
    description: "Warm desert sand, earthy terracotta, and glowing amber highlights.",
    accentColor: "#c2410c",
    preview: {
      bg: "#fbf7f0",
      surface: "#fffdfa",
      primary: "#c2410c",
      border: "#e8dacf",
      text: "#2b1d14"
    },
    chart: {
      line: "#ea580c",
      grid: "#f0e6dd",
      text: "#a8998d",
      gradient: "#f97316"
    }
  },
  {
    id: "matcha",
    name: "Matcha Zen",
    subtitle: "Organic Herbal",
    type: "light",
    description: "Calming botanical tea tones, soothing sage green, and soft ivory.",
    accentColor: "#2e7d32",
    preview: {
      bg: "#f4f6f0",
      surface: "#ffffff",
      primary: "#2e7d32",
      border: "#dce3d4",
      text: "#1e291e"
    },
    chart: {
      line: "#2e7d32",
      grid: "#e9eee3",
      text: "#829680",
      gradient: "#4caf50"
    }
  },
  {
    id: "nordic",
    name: "Nordic Glacier",
    subtitle: "Arctic Sky Blue",
    type: "light",
    description: "Crisp arctic ice-blue tinted surfaces with deep oceanic contrasts.",
    accentColor: "#0284c7",
    preview: {
      bg: "#f0f7ff",
      surface: "#ffffff",
      primary: "#0284c7",
      border: "#c7e2fe",
      text: "#0c2340"
    },
    chart: {
      line: "#0284c7",
      grid: "#e0effe",
      text: "#7498c2",
      gradient: "#38bdf8"
    }
  },

  // --- Dark Themes ---
  {
    id: "dark",
    name: "Onyx Dark",
    subtitle: "Emerald Pro",
    type: "dark",
    description: "Deep obsidian charcoal with glowing emerald indicators and sleek contrast.",
    accentColor: "#10b981",
    preview: {
      bg: "#090d16",
      surface: "#111827",
      primary: "#10b981",
      border: "#223049",
      text: "#f8fafc"
    },
    chart: {
      line: "#10b981",
      grid: "#1e293b",
      text: "#64748b",
      gradient: "#10b981"
    }
  },
  {
    id: "midnight",
    name: "Midnight Nebula",
    subtitle: "Cosmic Indigo",
    type: "dark",
    description: "Deep oceanic midnight navy with vibrant electric sapphire accents.",
    accentColor: "#3b82f6",
    preview: {
      bg: "#060913",
      surface: "#0c1222",
      primary: "#3b82f6",
      border: "#1d2a4a",
      text: "#f1f5f9"
    },
    chart: {
      line: "#3b82f6",
      grid: "#17223b",
      text: "#64748b",
      gradient: "#3b82f6"
    }
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    subtitle: "High-Tech Cyan",
    type: "dark",
    description: "Pitch black obsidian with luminous cyber teal and neon cyan styling.",
    accentColor: "#06b6d4",
    preview: {
      bg: "#030712",
      surface: "#0a0f1d",
      primary: "#06b6d4",
      border: "#1e293b",
      text: "#f8fafc"
    },
    chart: {
      line: "#06b6d4",
      grid: "#162036",
      text: "#6b7280",
      gradient: "#06b6d4"
    }
  },
  {
    id: "amethyst",
    name: "Amethyst Dream",
    subtitle: "Royal Velvet",
    type: "dark",
    description: "Imperial plum and dark velvet with vivid lilac, violet, and rose-gold accents.",
    accentColor: "#a855f7",
    preview: {
      bg: "#0d0814",
      surface: "#171024",
      primary: "#a855f7",
      border: "#2d1f47",
      text: "#faf5ff"
    },
    chart: {
      line: "#a855f7",
      grid: "#231838",
      text: "#8b7aa6",
      gradient: "#c084fc"
    }
  },
  {
    id: "coffee",
    name: "Artisan Café",
    subtitle: "Espresso & Caramel",
    type: "dark",
    description: "Rich roasted coffee beans, dark bronze surfaces, and honey caramel warmth.",
    accentColor: "#d97706",
    preview: {
      bg: "#150f0c",
      surface: "#1f1612",
      primary: "#d97706",
      border: "#3d2c23",
      text: "#fdf8f5"
    },
    chart: {
      line: "#d97706",
      grid: "#2c201a",
      text: "#997e6e",
      gradient: "#f59e0b"
    }
  }
];

const THEME_STORAGE_KEY = "duka_theme";

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch (e) {
    console.warn("Unable to access localStorage:", e);
  }
  return "light";
}

export function saveTheme(themeId) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (e) {
    console.warn("Unable to write to localStorage:", e);
  }
  applyThemeToDOM(themeId);
}

export function applyThemeToDOM(themeId) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", themeId);
  }
}

export function getThemeById(themeId) {
  return THEMES.find((t) => t.id === themeId) || THEMES[0];
}

export function getOppositeModeTheme(currentThemeId) {
  const current = getThemeById(currentThemeId);
  if (current.type === "light") {
    // If switching to dark, prefer 'dark' or a matching dark pair
    return "dark";
  } else {
    // If switching to light, default to 'light'
    return "light";
  }
}
