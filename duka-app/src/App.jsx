import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";
import {
  Home, Package, ShoppingCart, Receipt, BarChart3, Users, Wifi, WifiOff,
  Plus, Trash2, LogOut, AlertTriangle, TrendingUp, TrendingDown, Banknote, X, ChevronDown,
  ChevronRight, Clock, Lock, Search, Bell, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Minus, Check, CreditCard, Smartphone, Wallet, RefreshCw,
  CalendarDays, CircleDollarSign, Boxes, UserRound, Settings, Zap,
  Sun, Moon, Palette, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area
} from "recharts";
import {
  getSavedTheme, saveTheme, applyThemeToDOM, getThemeById, getOppositeModeTheme, THEMES
} from "./lib/themes";
import ThemeModal from "./components/ThemeModal";
import GreetingHero from "./components/GreetingHero";

// ---------- helpers ----------
const ksh = (n) => "KSh " + Math.round(n).toLocaleString("en-KE");
const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 9);
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short" });
const daysAgo = (n, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, Math.floor(Math.random() * 59), 0, 0);
  return d.toISOString();
};
const isValidUuid = (str) =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

function groupSalesWithItems(events, products, filterActorId = null) {
  const saleEvents = events.filter((e) => e.type === "SALE" && (!filterActorId || e.actorId === filterActorId));
  const grouped = {};

  saleEvents.forEach((e) => {
    const sid = e.payload?.saleId || e.id;
    if (!grouped[sid]) {
      grouped[sid] = {
        saleId: sid,
        ts: e.ts,
        actorId: e.actorId,
        payment: e.payload?.payment || "Cash",
        total: 0,
        items: []
      };
    }
    const p = products.find((prod) => prod.id === e.productId);
    const pName = e.payload?.productName || p?.name || (p?.sku ? `SKU: ${p.sku}` : "Item");
    const qty = Math.abs(e.delta);
    const itemPrice = e.payload?.price || p?.sellPrice || 0;
    const itemTotal = e.payload?.total || qty * itemPrice;

    grouped[sid].total += itemTotal;
    grouped[sid].items.push({
      productId: e.productId,
      name: pName,
      qty,
      price: itemPrice,
      total: itemTotal,
      category: p?.category || "Other"
    });
  });

  return Object.values(grouped).sort((a, b) => new Date(b.ts) - new Date(a.ts));
}

const EXPENSE_CATEGORIES = ["Rent", "Electricity", "Water", "Transport", "Salaries", "Supplier payments", "Internet", "Maintenance", "Other"];
const PAYMENT_METHODS = ["Cash", "M-Pesa", "Card", "Other"];
const PRODUCT_CATEGORIES = ["Beverages", "Bakery", "Dairy", "Household", "Snacks", "Other"];

// ---------- seed data ----------
const seedProducts = [
  { id: "p1", name: "Coca-Cola 500ml", category: "Beverages", sku: "BEV-001", buyPrice: 45, sellPrice: 70, minStock: 10, supplier: "Softdrinks Ltd", dateAdded: daysAgo(30) },
  { id: "p2", name: "Bread - White Loaf", category: "Bakery", sku: "BAK-001", buyPrice: 55, sellPrice: 65, minStock: 8, supplier: "Daily Bakers", dateAdded: daysAgo(30) },
  { id: "p3", name: "Milk 500ml", category: "Dairy", sku: "DAI-001", buyPrice: 48, sellPrice: 60, minStock: 15, supplier: "Fresh Farm Co", dateAdded: daysAgo(28) },
  { id: "p4", name: "Cooking Oil 1L", category: "Household", sku: "HH-001", buyPrice: 210, sellPrice: 250, minStock: 6, supplier: "Bidco", dateAdded: daysAgo(28) },
  { id: "p5", name: "Sugar 1kg", category: "Household", sku: "HH-002", buyPrice: 130, sellPrice: 150, minStock: 10, supplier: "Mumias Sugar", dateAdded: daysAgo(20) },
  { id: "p6", name: "Biscuits - Digestive", category: "Snacks", sku: "SNK-001", buyPrice: 35, sellPrice: 55, minStock: 12, supplier: "Manji", dateAdded: daysAgo(15) },
];

const employees = [
  { id: "owner", name: "Maurice", username: "maurice", role: "Owner / Administrator" },
  { id: "john", name: "John Mwangi", username: "john", role: "Sales Staff" },
];

function buildSeedEvents() {
  const ev = [];
  const push = (type, productId, delta, actorId, ts, payload = {}) => ev.push({ id: uid("ev"), type, productId, delta, actorId, ts, payload, synced: true });
  push("STOCK_ADD", "p1", 60, "owner", daysAgo(29), { buyPrice: 45 });
  push("STOCK_ADD", "p2", 25, "owner", daysAgo(29), { buyPrice: 55 });
  push("STOCK_ADD", "p3", 40, "owner", daysAgo(27), { buyPrice: 48 });
  push("STOCK_ADD", "p4", 15, "owner", daysAgo(27), { buyPrice: 210 });
  push("STOCK_ADD", "p5", 30, "owner", daysAgo(19), { buyPrice: 130 });
  push("STOCK_ADD", "p6", 40, "owner", daysAgo(14), { buyPrice: 35 });

  const mix = [["p1", 70], ["p2", 65], ["p3", 60], ["p4", 250], ["p5", 150], ["p6", 55]];
  let saleCounter = 1000;
  for (let day = 6; day >= 1; day--) {
    const nSales = 4 + Math.floor(Math.random() * 5);
    for (let s = 0; s < nSales; s++) {
      const saleId = "S" + saleCounter++;
      const actor = Math.random() > 0.5 ? "owner" : "john";
      const ts = daysAgo(day, 8 + Math.floor(Math.random() * 10));
      const nItems = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < nItems; i++) {
        const [pid, price] = mix[Math.floor(Math.random() * mix.length)];
        const qty = 1 + Math.floor(Math.random() * 3);
        push("SALE", pid, -qty, actor, ts, { saleId, price, total: qty * price, payment: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)] });
      }
    }
  }
  return ev;
}

const seedExpenses = [
  { id: uid("exp"), category: "Rent", amount: 15000, description: "Shop rent - August", date: daysAgo(10), actorId: "owner" },
  { id: uid("exp"), category: "Transport", amount: 1500, description: "Supplier transport", date: daysAgo(3), actorId: "owner" },
  { id: uid("exp"), category: "Electricity", amount: 2200, description: "KPLC bill", date: daysAgo(5), actorId: "owner" },
];

// ---------- app ----------
export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(seedProducts);
  const [events, setEvents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [employeeList, setEmployeeList] = useState(employees);
  const [online, setOnline] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme());
  const [showThemeModal, setShowThemeModal] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  const activeThemeObj = getThemeById(currentTheme);
  const isDark = activeThemeObj.type === "dark";

  const handleSelectTheme = (themeId) => {
    setCurrentTheme(themeId);
    saveTheme(themeId);
    const themeObj = getThemeById(themeId);
    showToast(`Applied theme: ${themeObj.name}`);
  };

  const handleQuickToggleTheme = () => {
    const nextTheme = getOppositeModeTheme(currentTheme);
    handleSelectTheme(nextTheme);
  };

  const loadAllData = async () => {
    if (!supabase) {
      console.warn("Supabase is not configured.");
      return;
    }

    try {
      // 1. Fetch Products
      const { data: pData, error: pErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (pErr) {
        console.error("Failed to load products from Supabase:", pErr);
      } else if (pData && pData.length > 0) {
        setProducts(
          pData.map((product) => ({
            id: product.id,
            name: product.name,
            category: product.category || "Other",
            sku: product.sku || "",
            buyPrice: Number(product.buy_price) || 0,
            sellPrice: Number(product.sell_price) || 0,
            minStock: Number(product.min_stock) || 0,
            supplier: product.supplier || "",
            dateAdded: product.created_at,
          }))
        );
      }

      // 2. Fetch Stock Movements
      const { data: mData, error: mErr } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: true });

      if (mErr) {
        console.error("Failed to load stock movements from Supabase:", mErr);
      } else if (mData) {
        setEvents(
          mData.map((m) => ({
            id: m.id,
            type: m.movement_type,
            productId: m.product_id,
            delta: m.delta,
            actorId: m.actor_id || m.metadata?.actorId || "owner",
            ts: m.created_at,
            payload: m.metadata || {},
            synced: true,
          }))
        );
      }

      // 3. Fetch Expenses
      const { data: eData, error: eErr } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (eErr) {
        console.error("Failed to load expenses from Supabase:", eErr);
      } else if (eData) {
        setExpenses(
          eData.map((e) => ({
            id: e.id,
            category: e.category,
            amount: Number(e.amount) || 0,
            description: e.description || "",
            date: e.created_at,
            actorId: e.actor_id || "owner",
          }))
        );
      }

      // 4. Fetch Profiles
      const { data: profData, error: profErr } = await supabase
        .from("profiles")
        .select("*");

      if (!profErr && profData && profData.length > 0) {
        setEmployeeList(
          profData.map((pr) => ({
            id: pr.id,
            name: pr.full_name,
            username: pr.username || pr.full_name.toLowerCase().replace(/\s+/g, ""),
            role: pr.role === "owner" ? "Owner / Administrator" : "Sales Staff",
          }))
        );
      }
    } catch (err) {
      console.error("Error loading Supabase data:", err);
    }
  };

  useEffect(() => {
    loadAllData();

    if (!supabase) return;

    const channel = supabase
      .channel("duka-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_movements" }, () => loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => loadAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addEvent = (type, productId, delta, payload = {}) => {
    const e = { id: uid("ev"), type, productId, delta, actorId: user?.id || "owner", ts: new Date().toISOString(), payload, synced: online };
    setEvents((prev) => [...prev, e]);
    return e;
  };

  const pendingCount = events.filter((e) => !e.synced).length;
  const syncNow = () => {
    setEvents((prev) => prev.map((e) => ({ ...e, synced: true })));
    showToast(`Synced ${pendingCount} event${pendingCount === 1 ? "" : "s"} to server`);
  };
  const toggleOnline = () => {
    setOnline((v) => !v);
    showToast(online ? "Now offline — changes will sync later" : "Back online");
  };
  const stockOf = (productId) => events.filter((e) => e.productId === productId).reduce((s, e) => s + e.delta, 0);

  if (!user) return (
    <>
      <Login
        onLogin={setUser}
        currentTheme={currentTheme}
        onToggleTheme={handleQuickToggleTheme}
        onOpenThemes={() => setShowThemeModal(true)}
      />
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />
    </>
  );

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: Home, ownerOnly: false },
    { id: "sales", label: "Sales", icon: ShoppingCart, ownerOnly: false },
    { id: "products", label: "Products & stock", icon: Package, ownerOnly: false },
    { id: "expenses", label: "Expenses", icon: Receipt, ownerOnly: true },
    { id: "reports", label: "Reports", icon: BarChart3, ownerOnly: true },
    { id: "employees", label: "Employees", icon: Users, ownerOnly: true },
  ];
  const isOwner = user.id === "owner";
  const current = nav.find((n) => n.id === tab) || nav[0];
  const pageTitles = {
    dashboard: ["Dashboard", "A quick look at how the shop is doing today."],
    sales: ["Sales", "Record a sale and keep stock up to date."],
    products: ["Products & stock", "Manage prices, stock levels and movements."],
    expenses: ["Expenses", "Keep track of the money going out of the business."],
    reports: ["Reports", "Understand sales, costs, profit and inventory."],
    employees: ["Employees", "Manage who can access the Duka system."],
  };

  return (
    <div className="duka-shell min-h-screen text-stone-900 flex">
      <aside className="duka-sidebar w-60 shrink-0 border-r border-stone-200/80 bg-white flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white grid place-items-center shadow-sm"><Zap size={17} fill="currentColor" /></div>
            <div>
              <div className="text-sm font-bold tracking-wide">DUKA</div>
              <div className="text-[11px] text-stone-400">Sales & inventory</div>
            </div>
          </div>
        </div>
        <div className="px-3 pt-4 pb-2 text-[10px] uppercase tracking-[.16em] font-semibold text-stone-400">Workspace</div>
        <nav className="px-2 space-y-1 flex-1">
          {nav.filter((n) => !n.ownerOnly || isOwner).map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} className={`duka-nav-button w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? "bg-emerald-50 text-emerald-800 font-semibold shadow-sm" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"}`}>
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                <span className="duka-sidebar-label">{n.label}</span>
                {n.id === "products" && isOwner && <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" title="Stock alerts" />}
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-3 space-y-2">
          <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-stone-900 text-white grid place-items-center text-xs font-semibold">{user.name === "You" ? "YO" : "JM"}</div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{user.name}</div>
                <div className="text-[11px] text-stone-500 truncate">{user.role}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowThemeModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg border border-stone-200 transition-colors group"
            title="Open theme customization studio"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Palette size={14} className="text-emerald-700 shrink-0" />
              <span className="truncate">Theme: <strong>{activeThemeObj.name}</strong></span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 font-bold uppercase tracking-wider text-stone-500 shrink-0 ml-1">
              {activeThemeObj.type}
            </span>
          </button>

          <button onClick={() => setUser(null)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"><LogOut size={14} /> Switch user</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[72px] shrink-0 border-b border-stone-200/80 bg-white/90 backdrop-blur flex items-center justify-between px-7 sticky top-0 z-20">
          <div>
            <div className="text-[15px] font-semibold">{pageTitles[tab][0]}</div>
            <div className="text-xs text-stone-400 mt-0.5 hidden sm:block">{pageTitles[tab][1]}</div>
          </div>
          <div className="flex items-center gap-2.5">
            {pendingCount > 0 && <button onClick={online ? syncNow : undefined} className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${online ? "border-amber-200 bg-amber-50 text-amber-800" : "border-stone-200 bg-stone-50 text-stone-500"}`}><RefreshCw size={12} /> {pendingCount} pending</button>}
            
            {/* Quick Theme Switcher in Header */}
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 p-1 rounded-xl shadow-2xs">
              <button
                onClick={handleQuickToggleTheme}
                className="h-7 w-7 grid place-items-center rounded-lg hover:bg-white text-stone-600 transition-colors"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <Sun size={15} className="text-amber-500" />
                ) : (
                  <Moon size={15} className="text-indigo-600" />
                )}
              </button>
              <button
                onClick={() => setShowThemeModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white text-stone-700 transition-colors"
                title="Explore and change creative themes"
              >
                <Palette size={13} className="text-emerald-700" />
                <span className="hidden md:inline">{activeThemeObj.name}</span>
              </button>
            </div>

            <button className="h-9 w-9 grid place-items-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"><Bell size={16} /></button>
            <button onClick={toggleOnline} className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border font-medium ${online ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {online ? <Wifi size={13} /> : <WifiOff size={13} />}{online ? "Online" : "Offline"}
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7 overflow-auto duka-responsive-main">
          {tab === "dashboard" && <Dashboard products={products} events={events} expenses={expenses} stockOf={stockOf} isOwner={isOwner} user={user} onNavigate={setTab} themeObj={activeThemeObj} onOpenThemes={() => setShowThemeModal(true)} />}
          {tab === "sales" && <Sales products={products} stockOf={stockOf} events={events} addEvent={addEvent} user={user} online={online} showToast={showToast} onNavigate={setTab} />}
          {tab === "products" && <Products products={products} setProducts={setProducts} stockOf={stockOf} events={events} addEvent={addEvent} isOwner={isOwner} user={user} online={online} showToast={showToast} />}
          {tab === "expenses" && isOwner && <Expenses expenses={expenses} setExpenses={setExpenses} user={user} online={online} showToast={showToast} />}
          {tab === "reports" && isOwner && <Reports products={products} events={events} expenses={expenses} stockOf={stockOf} themeObj={activeThemeObj} />}
          {tab === "employees" && isOwner && <Employees list={employeeList} />}
        </main>
      </div>
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-sm px-4 py-3 rounded-xl shadow-soft flex items-center gap-2"><Check size={15} className="text-emerald-300" />{toast}</div>}
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />
    </div>
  );
}

// ---------- login ----------
function Login({ onLogin, currentTheme, onToggleTheme, onOpenThemes }) {
  const themeObj = getThemeById(currentTheme);
  const isDark = themeObj.type === "dark";

  return (
    <div className="min-h-screen duka-shell flex flex-col items-center justify-center p-6 relative">
      {/* Top right theme controls on Login page */}
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white border border-stone-200 p-1 rounded-xl shadow-soft">
          <button
            onClick={onToggleTheme}
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-stone-50 text-stone-600 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun size={16} className="text-amber-500" />
            ) : (
              <Moon size={16} className="text-indigo-600" />
            )}
          </button>
          <button
            onClick={onOpenThemes}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-stone-50 text-stone-700 transition-colors"
            title="Explore and change creative themes"
          >
            <Palette size={14} className="text-emerald-700" />
            <span>{themeObj.name}</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-700 text-white grid place-items-center shadow-soft mb-4"><Zap size={25} fill="currentColor" /></div>
          <div className="text-2xl font-bold tracking-tight">Welcome to Duka</div>
          <div className="text-sm text-stone-500 mt-1">Sales, stock and business management in one place.</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl shadow-soft p-2 space-y-2">
          <RoleButton onClick={() => onLogin(employees[0])} initials="MN" name="Continue as Maurice" role="Owner / Full access" description="Sales, stock, expenses, reports and staff" />
          <RoleButton onClick={() => onLogin(employees[1])} initials="JM" name="Continue as John Mwangi" role="Sales staff" description="Record sales and view stock" />
        </div>
        
        <div className="flex items-center justify-between text-[11px] text-stone-400 mt-5 px-1">
          <span className="flex items-center gap-1.5"><Wifi size={12} /> Works with or without a connection</span>
          <button
            onClick={onOpenThemes}
            className="text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
          >
            <Sparkles size={11} className="text-amber-500" /> Choose theme
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleButton({ onClick, initials, name, role, description }) {
  return <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-emerald-50 transition-colors group">
    <div className="h-11 w-11 rounded-xl bg-stone-100 group-hover:bg-white border border-stone-200 grid place-items-center text-xs font-bold text-stone-700">{initials}</div>
    <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{name}</div><div className="text-xs text-emerald-700 font-medium mt-0.5">{role}</div><div className="text-xs text-stone-400 mt-0.5 truncate">{description}</div></div>
    <ChevronRight size={17} className="text-stone-300 group-hover:text-emerald-600" />
  </button>;
}

// ---------- dashboard ----------
function Dashboard({ products, events, expenses, stockOf, isOwner, user, onNavigate, themeObj, onOpenThemes }) {
  const today = dayKey(new Date());
  const [shiftFilter, setShiftFilter] = useState("today"); // 'today' | 'all'
  const [searchSaleQuery, setSearchSaleQuery] = useState("");
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  // Group all sales with itemized product details
  const allSalesWithItems = useMemo(() => groupSalesWithItems(events, products), [events, products]);
  
  // Staff sales metrics
  const mySales = useMemo(() => allSalesWithItems.filter((s) => s.actorId === user.id), [allSalesWithItems, user.id]);
  const myTodaySales = useMemo(() => mySales.filter((s) => dayKey(s.ts) === today), [mySales, today]);
  const myTodayRevenue = useMemo(() => myTodaySales.reduce((sum, s) => sum + s.total, 0), [myTodaySales]);
  const myTodayUnits = useMemo(() => myTodaySales.reduce((sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.qty, 0), 0), [myTodaySales]);

  // Overall store metrics for Owner
  const todaySales = useMemo(() => allSalesWithItems.filter((s) => dayKey(s.ts) === today), [allSalesWithItems, today]);
  const todayRevenue = todaySales.reduce((s, e) => s + e.total, 0);
  const todayExpenseTotal = expenses.filter((x) => dayKey(x.date) === today).reduce((s, x) => s + x.amount, 0);
  const todayCOGS = todaySales.reduce((s, sale) => {
    return s + sale.items.reduce((iSum, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return iSum + (p ? p.buyPrice * item.qty : 0);
    }, 0);
  }, 0);
  const todayProfit = todayRevenue - todayCOGS - todayExpenseTotal;
  const stockValue = products.reduce((s, p) => s + Math.max(0, stockOf(p.id)) * p.buyPrice, 0);
  const lowStock = products.filter((p) => stockOf(p.id) <= p.minStock);

  const chartData = useMemo(() => Array.from({ length: 7 }, (_, idx) => {
    const i = 6 - idx; const d = new Date(); d.setDate(d.getDate() - i); const k = dayKey(d);
    return {
      day: d.toLocaleDateString("en-KE", { weekday: "short" }),
      total: allSalesWithItems.filter((s) => dayKey(s.ts) === k).reduce((sum, s) => sum + s.total, 0)
    };
  }), [allSalesWithItems]);

  const qtyByProduct = {};
  allSalesWithItems.forEach((s) => {
    s.items.forEach((it) => {
      qtyByProduct[it.productId] = (qtyByProduct[it.productId] || 0) + it.qty;
    });
  });
  const bestSellers = Object.entries(qtyByProduct).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([pid, qty]) => ({ product: products.find((p) => p.id === pid), qty })).filter((x) => x.product);
  const recentSales = allSalesWithItems.slice(0, 6);

  // Staff-specific filtered sales list
  const displayedStaffSales = (shiftFilter === "today" ? myTodaySales : mySales).filter((s) => {
    if (!searchSaleQuery) return true;
    const q = searchSaleQuery.toLowerCase();
    if (s.saleId.toLowerCase().includes(q)) return true;
    if (s.payment.toLowerCase().includes(q)) return true;
    if (s.items.some((it) => it.name.toLowerCase().includes(q))) return true;
    return false;
  });

  if (!isOwner) return (
    <div className="max-w-6xl mx-auto space-y-6">
      <GreetingHero
        user={user}
        isOwner={false}
        todayRevenue={myTodayRevenue}
        todayProfit={0}
        todaySalesCount={myTodaySales.length}
        lowStockCount={lowStock.length}
        onNavigate={onNavigate}
        onOpenThemes={onOpenThemes}
        themeObj={themeObj}
      />

      {/* Metrics Row for Staff */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Your sales today"
          value={ksh(myTodayRevenue)}
          sub={`${myTodaySales.length} sale transaction${myTodaySales.length === 1 ? "" : "s"}`}
          icon={Banknote}
          tone="emerald"
        />
        <StatCard
          label="Goods sold today"
          value={`${myTodayUnits} units`}
          sub="Recorded on your account"
          icon={ShoppingCart}
          tone="emerald"
        />
        <StatCard
          label="Stock alerts"
          value={lowStock.length}
          sub="Items needing restock"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Products available"
          value={products.length}
          sub="Active catalog items"
          icon={Boxes}
          tone="stone"
        />
      </div>

      {/* Detailed Goods Sold Section for Staff */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Your Sales & Goods Sold</h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {displayedStaffSales.length} transactions
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Review what goods you have sold during your shift.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setShiftFilter("today")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  shiftFilter === "today"
                    ? "bg-white text-stone-900 shadow-2xs font-bold"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                Today's Shift ({myTodaySales.length})
              </button>
              <button
                onClick={() => setShiftFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  shiftFilter === "all"
                    ? "bg-white text-stone-900 shadow-2xs font-bold"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                All My Sales ({mySales.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar for Staff Sales */}
        <div className="pt-4 pb-2">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={searchSaleQuery}
              onChange={(e) => setSearchSaleQuery(e.target.value)}
              placeholder="Search by receipt # or product name (e.g. Milk)..."
              className="in pl-9 text-xs"
            />
          </div>
        </div>

        {/* Sales List with Itemized Goods */}
        <div className="divide-y divide-stone-100 mt-2">
          {displayedStaffSales.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-stone-100 grid place-items-center text-stone-400 mb-3">
                <Receipt size={20} />
              </div>
              <div className="text-sm font-medium text-stone-700">No sales recorded for this period</div>
              <div className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                {searchSaleQuery
                  ? "No sales match your search query."
                  : "Tap 'Record a sale' to ring up your first customer."}
              </div>
              {!searchSaleQuery && (
                <button
                  onClick={() => onNavigate("sales")}
                  className="mt-4 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  <Plus size={14} /> New sale
                </button>
              )}
            </div>
          ) : (
            displayedStaffSales.map((sale) => {
              const isExpanded = expandedSaleId === sale.saleId || displayedStaffSales.length <= 4;
              const itemCount = sale.items.reduce((s, it) => s + it.qty, 0);

              return (
                <div key={sale.saleId} className="py-4 first:pt-2 last:pb-0">
                  <div
                    onClick={() => setExpandedSaleId(isExpanded ? null : sale.saleId)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/70 p-2.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 grid place-items-center shrink-0">
                        <Receipt size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-stone-900">
                            Sale #{sale.saleId.length > 8 ? sale.saleId.slice(0, 8) : sale.saleId}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            {sale.payment}
                          </span>
                          <span className="text-[11px] text-stone-400 font-medium">
                            {itemCount} unit{itemCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-2">
                          <span>{fmtDate(sale.ts)} · {fmtTime(sale.ts)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-stone-900">{ksh(sale.total)}</div>
                        <div className="text-[10px] text-emerald-700 font-medium">Recorded by you</div>
                      </div>
                      <button
                        type="button"
                        className="h-7 w-7 rounded-lg hover:bg-stone-200/60 grid place-items-center text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breakdown of Specific Goods Sold */}
                  {isExpanded && (
                    <div className="mt-2.5 ml-0 sm:ml-13 p-3.5 bg-stone-50 border border-stone-200/70 rounded-xl space-y-2 animate-in fade-in duration-150">
                      <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold flex items-center justify-between">
                        <span>Goods sold in this transaction ({sale.items.length} item type{sale.items.length === 1 ? "" : "s"}):</span>
                        <span>Item Subtotal</span>
                      </div>
                      <div className="divide-y divide-stone-200/50">
                        {sale.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="h-5 px-1.5 rounded bg-emerald-100/70 text-emerald-800 font-bold text-[11px] grid place-items-center shrink-0">
                                {it.qty}×
                              </span>
                              <span className="font-medium text-stone-800 truncate">
                                {it.name}
                              </span>
                              <span className="text-[11px] text-stone-400 shrink-0">
                                (@ {ksh(it.price)})
                              </span>
                            </div>
                            <span className="font-semibold text-stone-800 shrink-0">
                              {ksh(it.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Products Low on Stock for Staff */}
      <SectionCard
        title="Products running low"
        action={
          <button onClick={() => onNavigate("products")} className="text-xs font-semibold text-emerald-700">
            View all stock
          </button>
        }
      >
        {lowStock.length === 0 ? (
          <Empty text="Everything is comfortably stocked." />
        ) : (
          <div className="space-y-1">
            {lowStock.slice(0, 4).map((p) => (
              <StockRow key={p.id} product={p} stock={stockOf(p.id)} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Confidentiality Notice */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 flex items-start gap-3 shadow-2xs">
        <div className="h-9 w-9 rounded-lg bg-stone-100 grid place-items-center text-stone-600 shrink-0">
          <Lock size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold text-stone-800">Owner-only metrics protected</div>
          <div className="text-xs text-stone-500 mt-0.5">
            Store purchase margins, buying costs, store expenses, and overall business profit are securely restricted to administrator accounts.
          </div>
        </div>
      </div>
    </div>
  );

  // OWNER DASHBOARD
  const isLoss = todayProfit < 0;

  return (
    <div className={`max-w-7xl mx-auto owner-dashboard-container ${isLoss ? "owner-loss-backdrop" : "owner-profit-backdrop"}`}>
      {/* Ambient background glow aura */}
      <div
        className={`pointer-events-none absolute -top-12 -left-6 -right-6 h-96 rounded-full blur-3xl transition-all duration-700 opacity-60 ${
          isLoss ? "bg-rose-500/20" : "bg-emerald-500/18"
        }`}
        style={{
          background: isLoss
            ? "radial-gradient(ellipse at center, rgba(244, 63, 94, 0.22) 0%, rgba(225, 29, 72, 0.08) 50%, transparent 80%)"
            : "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.20) 0%, rgba(5, 150, 105, 0.07) 50%, transparent 80%)"
        }}
      />

      <GreetingHero
        user={user}
        isOwner={true}
        todayRevenue={todayRevenue}
        todayProfit={todayProfit}
        todayExpenses={todayExpenseTotal}
        todayCOGS={todayCOGS}
        todaySalesCount={todaySales.length}
        lowStockCount={lowStock.length}
        onNavigate={onNavigate}
        onOpenThemes={onOpenThemes}
        themeObj={themeObj}
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5 relative z-10">
        <StatCard label="Today's sales" value={ksh(todayRevenue)} sub={`${todaySales.length} transactions`} icon={Banknote} tone="emerald" trend="Today" />
        <StatCard
          label={todayProfit < 0 ? "Today's Net Loss" : "Today's Net Profit"}
          value={(todayProfit < 0 ? "− " : "+ ") + ksh(Math.abs(todayProfit))}
          sub={
            todayRevenue
              ? (todayProfit < 0
                  ? `Loss: ${Math.round((Math.abs(todayProfit) / todayRevenue) * 100)}% negative margin`
                  : `${Math.round((todayProfit / todayRevenue) * 100)}% profit margin`)
              : isLoss
              ? "Expenses exceed sales"
              : "No sales yet"
          }
          icon={todayProfit < 0 ? TrendingDown : TrendingUp}
          tone={todayProfit >= 0 ? "emerald" : "rose"}
        />
        <StatCard label="Today's expenses" value={ksh(todayExpenseTotal)} icon={Receipt} tone="rose" sub="Operating expenses" />
        <StatCard label="Low stock" value={lowStock.length} sub={`${products.length} products total`} icon={AlertTriangle} tone="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5 relative z-10">
        <SectionCard title="Sales overview · 7 days" className="xl:col-span-2" action={<span className="text-[11px] text-stone-400">Revenue</span>}>
          <div className="h-64 mt-2"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
            <defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={themeObj?.chart?.gradient || "#10b981"} stopOpacity={0.24} /><stop offset="100%" stopColor={themeObj?.chart?.gradient || "#10b981"} stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke={themeObj?.chart?.grid || "#f0efed"} /><XAxis dataKey="day" tick={{ fontSize: 11, fill: themeObj?.chart?.text || "#a8a29e" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: themeObj?.chart?.text || "#a8a29e" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip formatter={(v) => ksh(v)} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--border-main)", backgroundColor: "var(--bg-surface)", color: "var(--text-main)" }} /><Area type="monotone" dataKey="total" stroke={themeObj?.chart?.line || "#059669"} strokeWidth={2.5} fill="url(#salesFill)" />
          </AreaChart></ResponsiveContainer></div>
        </SectionCard>
        <SectionCard title="Best sellers" action={<button onClick={() => onNavigate("products")} className="text-xs text-emerald-700 font-medium">Inventory</button>}>
          <div className="space-y-1">{bestSellers.map((b, i) => <div key={b.product.id} className="flex items-center gap-3 py-2.5 border-b border-stone-50 last:border-0"><div className="h-8 w-8 rounded-lg bg-stone-100 grid place-items-center text-xs font-semibold text-stone-500">{i + 1}</div><div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{b.product.name}</div><div className="text-[11px] text-stone-400">{b.qty} units sold</div></div><ArrowUpRight size={14} className="text-emerald-600" /></div>)}</div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 relative z-10">
        <SectionCard title="Recent transactions" action={<button onClick={() => onNavigate("sales")} className="text-xs text-emerald-700 font-medium">New sale</button>}>
          {recentSales.length === 0 ? (
            <Empty text="No sales recorded yet." />
          ) : (
            recentSales.map((s) => {
              const sellerName = employees.find((e) => e.id === s.actorId)?.name || (s.actorId === "owner" ? "Owner" : s.actorId);
              const goodsSummary = s.items.map((it) => `${it.qty}× ${it.name}`).join(", ");
              return (
                <div key={s.saleId} className="py-3 border-b border-stone-50 last:border-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center shrink-0">
                        <Receipt size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          Sale #{s.saleId.length > 8 ? s.saleId.slice(0, 8) : s.saleId}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">
                          {fmtTime(s.ts)} · {sellerName} · {s.payment}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-right shrink-0">
                      {ksh(s.total)}
                    </div>
                  </div>
                  {goodsSummary && (
                    <div className="mt-1.5 pl-12 text-[11px] text-stone-500 truncate">
                      📦 {goodsSummary}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </SectionCard>
        <SectionCard title="Stock alerts" action={<button onClick={() => onNavigate("products")} className="text-xs text-emerald-700 font-medium">View all</button>}>
          {lowStock.length === 0 ? <Empty text="No stock alerts right now." /> : lowStock.slice(0, 5).map((p) => <StockRow key={p.id} product={p} stock={stockOf(p.id)} />)}
        </SectionCard>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-stone-400 relative z-10"><CalendarDays size={13} /> Current stock value: <span className="font-semibold text-stone-600">{ksh(stockValue)}</span></div>
    </div>
  );
}

function PageIntro({ eyebrow, title, text, action, onAction, statusBadge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 relative z-10">
      <div>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <div className="text-[11px] uppercase tracking-[.16em] text-emerald-700 font-semibold">{eyebrow}</div>
          {statusBadge}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-stone-500 mt-1">{text}</p>
      </div>
      {action && (
        <button onClick={onAction} className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm">
          <Plus size={16} />{action}
        </button>
      )}
    </div>
  );
}

// ---------- sales ----------
function Sales({ products, stockOf, events, addEvent, user, online, showToast, onNavigate }) {
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState("Cash");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showRecentSales, setShowRecentSales] = useState(true);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (category === "All" || p.category === category)
  );

  const subtotal = cart.reduce((s, i) => s + (Number(i.qty) || 0) * i.price, 0);
  const itemCount = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);

  const addToCart = (p, defaultQty = 1) => {
    const stock = stockOf(p.id);
    if (stock <= 0) return showToast(`${p.name} is out of stock`);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        const currentQty = typeof existing.qty === "number" ? existing.qty : 1;
        return prev.map((i) =>
          i.productId === p.id
            ? { ...i, qty: Math.min(stock, currentQty + defaultQty) }
            : i
        );
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, price: p.sellPrice, qty: Math.min(stock, defaultQty) }
      ];
    });
  };

  const changeQty = (pid, delta) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== pid) return i;
        const stock = stockOf(pid);
        const currentQty = typeof i.qty === "number" ? i.qty : 1;
        return {
          ...i,
          qty: Math.min(stock, Math.max(1, currentQty + delta))
        };
      })
    );
  };

  const setManualQty = (pid, val) => {
    const stock = stockOf(pid);
    if (val === "" || val === null) {
      setCart((prev) =>
        prev.map((i) => (i.productId === pid ? { ...i, qty: "" } : i))
      );
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    if (parsed <= 0) {
      setCart((prev) =>
        prev.map((i) => (i.productId === pid ? { ...i, qty: 1 } : i))
      );
      return;
    }
    if (parsed > stock) {
      showToast(`Only ${stock} units of this item in stock`);
      setCart((prev) =>
        prev.map((i) => (i.productId === pid ? { ...i, qty: stock } : i))
      );
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.productId === pid ? { ...i, qty: parsed } : i))
    );
  };

  const handleBlurQty = (pid) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== pid) return i;
        if (!i.qty || typeof i.qty !== "number" || i.qty < 1) {
          return { ...i, qty: 1 };
        }
        return i;
      })
    );
  };

  const addBulkQty = (pid, addAmount) => {
    const stock = stockOf(pid);
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== pid) return i;
        const currentQty = typeof i.qty === "number" ? i.qty : 1;
        const nextQty = Math.min(stock, currentQty + addAmount);
        return { ...i, qty: nextQty };
      })
    );
  };

  const removeItem = (pid) => setCart((prev) => prev.filter((i) => i.productId !== pid));

  const completeSale = async () => {
    if (!cart.length) return;
    
    // Ensure all cart items have valid integer quantities
    const sanitizedCart = cart.map((i) => ({
      ...i,
      qty: Math.max(1, typeof i.qty === "number" ? i.qty : parseInt(i.qty, 10) || 1)
    }));

    const finalSubtotal = sanitizedCart.reduce((s, i) => s + i.qty * i.price, 0);
    const clientSaleCode = "S" + Math.floor(Math.random() * 900000 + 100000);
    let recordedSaleId = clientSaleCode;

    // Push to Supabase if connected
    if (supabase && online) {
      try {
        const salePayload = {
          payment_method: payment,
          total: finalSubtotal
        };
        if (user && isValidUuid(user.id)) {
          salePayload.actor_id = user.id;
        }

        const { data: saleRow, error: saleErr } = await supabase
          .from("sales")
          .insert(salePayload)
          .select()
          .single();

        if (!saleErr && saleRow) {
          recordedSaleId = saleRow.id;

          // Insert sale items for UUID products
          const validItems = sanitizedCart.filter((i) => isValidUuid(i.productId));
          if (validItems.length > 0) {
            const saleItemsPayload = validItems.map((i) => ({
              sale_id: saleRow.id,
              product_id: i.productId,
              quantity: i.qty,
              unit_price: i.price
            }));
            await supabase.from("sale_items").insert(saleItemsPayload);

            const movementsPayload = validItems.map((i) => ({
              product_id: i.productId,
              delta: -i.qty,
              movement_type: "SALE",
              sale_id: saleRow.id,
              metadata: {
                saleId: saleRow.id,
                price: i.price,
                total: i.qty * i.price,
                payment,
                productName: i.name,
                actorName: user?.name || "Staff",
                actorId: user?.id || "owner"
              }
            }));
            await supabase.from("stock_movements").insert(movementsPayload);
          }
        }
      } catch (err) {
        console.error("Error saving sale to Supabase:", err);
      }
    }

    // Update local events state for instant UI response
    sanitizedCart.forEach((i) =>
      addEvent("SALE", i.productId, -i.qty, {
        saleId: recordedSaleId,
        productName: i.name,
        price: i.price,
        total: i.qty * i.price,
        payment
      })
    );

    const displaySaleId = typeof recordedSaleId === "string" && recordedSaleId.length > 8 ? recordedSaleId.slice(0, 8) : recordedSaleId;
    showToast(`Sale #${displaySaleId} recorded — ${ksh(finalSubtotal)}`);
    setCart([]);
  };

  // Recent sales for quick cashier reference
  const recentCounterSales = useMemo(() => {
    if (!events) return [];
    const myOrAll = groupSalesWithItems(events, products, user ? user.id : null);
    return myOrAll.slice(0, 4);
  }, [events, products, user]);

  return (
    <div className="max-w-7xl mx-auto h-full space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_410px] gap-5 items-start">
        <div>
          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products by name or SKU…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
              />
            </div>
            <div className="text-xs text-stone-400 flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl self-start sm:self-auto">
              <Sparkles size={13} className="text-amber-500" />
              <span>Tap card to add, then type quantity in cart</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {["All", ...PRODUCT_CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  category === c
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => {
              const stock = stockOf(p.id);
              const low = stock <= p.minStock;
              const out = stock <= 0;
              const inCartItem = cart.find((i) => i.productId === p.id);

              return (
                <button
                  disabled={out}
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`text-left p-4 rounded-2xl border bg-white transition-all relative ${
                    out
                      ? "opacity-50 cursor-not-allowed border-stone-200"
                      : inCartItem
                      ? "border-emerald-400 ring-2 ring-emerald-100 hover:shadow-card"
                      : "border-stone-200 hover:border-emerald-300 hover:shadow-card"
                  }`}
                >
                  {inCartItem && (
                    <span className="absolute top-2.5 right-2.5 h-6 px-2 rounded-full bg-emerald-600 text-white text-[10px] font-bold grid place-items-center">
                      In cart: {inCartItem.qty}
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-xl bg-stone-100 grid place-items-center text-stone-600">
                      <Package size={18} />
                    </div>
                    {low && !out && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Low stock
                      </span>
                    )}
                    {out && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-stone-900 mt-4 truncate">{p.name}</div>
                  <div className="text-xs font-semibold text-emerald-700 mt-1">{ksh(p.sellPrice)}</div>
                  <div className={`text-xs mt-3 flex items-center justify-between ${low ? "text-amber-700 font-medium" : "text-stone-400"}`}>
                    <span>{stock} in stock</span>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase">{p.category}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {!filtered.length && (
            <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-10 text-center text-sm text-stone-400">
              No products match your search.
            </div>
          )}

          {/* Recent Counter Sales Quick Reference */}
          {recentCounterSales.length > 0 && (
            <div className="mt-8 bg-white border border-stone-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-emerald-700" />
                  <h3 className="text-sm font-bold text-stone-900">Your Recent Counter Transactions</h3>
                </div>
                <button
                  onClick={() => setShowRecentSales(!showRecentSales)}
                  className="text-xs text-stone-400 hover:text-stone-700 font-medium"
                >
                  {showRecentSales ? "Hide" : "Show"}
                </button>
              </div>

              {showRecentSales && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {recentCounterSales.map((sale) => (
                    <div
                      key={sale.saleId}
                      className="p-3 bg-stone-50 border border-stone-200/70 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900">
                          Sale #{sale.saleId.length > 8 ? sale.saleId.slice(0, 8) : sale.saleId}
                        </span>
                        <span className="font-bold text-emerald-800">{ksh(sale.total)}</span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {fmtTime(sale.ts)} · {sale.payment}
                      </div>
                      <div className="text-[11px] text-stone-600 pt-1 border-t border-stone-200/50">
                        <span className="font-semibold text-stone-700">Goods: </span>
                        {sale.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Sale / Cart Sidebar */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-card xl:sticky xl:top-24 overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-stone-900">Current sale cart</div>
              <div className="text-xs text-stone-400 mt-0.5">
                {itemCount} total item{itemCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-stone-100 grid place-items-center text-stone-700">
              <ShoppingCart size={16} />
            </div>
          </div>

          <div className="p-5">
            {cart.length === 0 ? (
              <div className="border border-dashed border-stone-200 rounded-xl py-12 text-center">
                <div className="h-11 w-11 mx-auto rounded-full bg-stone-100 grid place-items-center text-stone-400 mb-3">
                  <ShoppingCart size={18} />
                </div>
                <div className="text-sm font-medium text-stone-600">Your cart is empty</div>
                <div className="text-xs text-stone-400 mt-1 max-w-[200px] mx-auto">
                  Tap any product to add it, then type the exact quantity to sell.
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {cart.map((i) => {
                  const stock = stockOf(i.productId);
                  return (
                    <div
                      key={i.productId}
                      className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl space-y-2"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="h-9 w-9 rounded-lg bg-emerald-100/70 text-emerald-800 grid place-items-center shrink-0">
                          <Package size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-stone-900 truncate">{i.name}</div>
                          <div className="text-[11px] text-stone-400">
                            {ksh(i.price)} each · Stock: {stock}
                          </div>
                        </div>

                        {/* Direct Typing Quantity Box with Minus/Plus */}
                        <div className="flex items-center gap-1 border border-stone-200 rounded-lg p-0.5 bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => changeQty(i.productId, -1)}
                            className="h-7 w-7 grid place-items-center text-stone-500 hover:bg-stone-100 rounded transition-colors"
                            title="Decrease quantity by 1"
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={stock}
                            value={i.qty}
                            onChange={(e) => setManualQty(i.productId, e.target.value)}
                            onBlur={() => handleBlurQty(i.productId)}
                            className="w-13 text-center text-xs font-bold py-1 bg-stone-50 border border-stone-200 rounded focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            title="Type any quantity directly"
                          />
                          <button
                            type="button"
                            onClick={() => changeQty(i.productId, 1)}
                            className="h-7 w-7 grid place-items-center text-stone-500 hover:bg-stone-100 rounded transition-colors"
                            title="Increase quantity by 1"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(i.productId)}
                          className="text-stone-300 hover:text-rose-600 transition-colors p-1"
                          title="Remove from cart"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Quick Bulk Presets Chips & Line Total */}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 text-[10px]">
                        <div className="flex items-center gap-1 text-stone-500">
                          <span className="font-medium text-stone-400">Bulk:</span>
                          <button
                            type="button"
                            onClick={() => addBulkQty(i.productId, 5)}
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-stone-200 font-semibold transition-colors"
                            title="Add 5 more"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => addBulkQty(i.productId, 10)}
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-stone-200 font-semibold transition-colors"
                            title="Add 10 more"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualQty(i.productId, stock)}
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-50 hover:text-amber-700 border border-stone-200 font-semibold transition-colors"
                            title="Sell all remaining stock"
                          >
                            Max ({stock})
                          </button>
                        </div>
                        <span className="font-bold text-xs text-stone-900">
                          {ksh((Number(i.qty) || 0) * i.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-stone-100 mt-5 pt-4">
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span>{ksh(subtotal)}</span>
              </div>
              <div className="flex justify-between mt-2 text-lg font-bold text-stone-900">
                <span>Total</span>
                <span>{ksh(subtotal)}</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold text-stone-500 mb-2">Payment method</div>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon =
                    m === "Cash"
                      ? Wallet
                      : m === "M-Pesa"
                      ? Smartphone
                      : m === "Card"
                      ? CreditCard
                      : MoreHorizontal;
                  return (
                    <button
                      key={m}
                      onClick={() => setPayment(m)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                        payment === m
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      <Icon size={14} />
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={completeSale}
              disabled={!cart.length}
              className="w-full mt-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-soft disabled:bg-stone-100 disabled:text-stone-400 transition-colors"
            >
              Complete sale · {ksh(subtotal)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- products ----------
function Products({ products, setProducts, stockOf, events, addEvent, isOwner, user, online, showToast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [receiving, setReceiving] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const [form, setForm] = useState({
    name: "",
    category: PRODUCT_CATEGORIES[0],
    sku: "",
    buyPrice: "",
    sellPrice: "",
    minStock: "",
    supplier: "",
    initialStock: "0"
  });

  const [receiveQty, setReceiveQty] = useState("");

  const visible = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (category === "All" || p.category === category)
  );

  const lowCount = products.filter(
    (p) => stockOf(p.id) <= p.minStock
  ).length;

  const stockValue = products.reduce(
    (s, p) => s + Math.max(0, stockOf(p.id)) * p.buyPrice,
    0
  );

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete ${productName}?`)) {
      if (supabase && isValidUuid(productId)) {
        try {
          await supabase.from("products").delete().eq("id", productId);
        } catch (err) {
          console.error("Error deleting product from Supabase:", err);
        }
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`${productName} removed`);
    }
  };

  const submitAdd = async () => {
    if (!form.name || !form.sellPrice) {
      showToast("Product name and selling price are required");
      return;
    }

    const initialQty = Number(form.initialStock) || 0;

    const productData = {
      name: form.name.trim(),
      category: form.category,
      sku: form.sku.trim() || null,
      buy_price: Number(form.buyPrice) || 0,
      sell_price: Number(form.sellPrice) || 0,
      min_stock: Number(form.minStock) || 0,
      supplier: form.supplier.trim() || null
    };

    let createdProduct = null;

    if (supabase && online) {
      try {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (error) {
          console.error("Failed to add product to Supabase:", error);
          createdProduct = {
            id: uid("p"),
            name: form.name.trim(),
            category: form.category,
            sku: form.sku.trim() || "",
            buyPrice: Number(form.buyPrice) || 0,
            sellPrice: Number(form.sellPrice) || 0,
            minStock: Number(form.minStock) || 0,
            supplier: form.supplier.trim() || "",
            dateAdded: new Date().toISOString()
          };
          setProducts((prev) => [createdProduct, ...prev]);
          showToast(`${createdProduct.name} saved`);
        } else if (data) {
          createdProduct = {
            id: data.id,
            name: data.name,
            category: data.category,
            sku: data.sku || "",
            buyPrice: Number(data.buy_price) || 0,
            sellPrice: Number(data.sell_price) || 0,
            minStock: data.min_stock || 0,
            supplier: data.supplier || "",
            dateAdded: data.created_at
          };
          setProducts((prev) => [createdProduct, ...prev]);
          showToast(`${createdProduct.name} added successfully`);
        }
      } catch (err) {
        console.error("Error inserting product:", err);
        createdProduct = {
          id: uid("p"),
          name: form.name.trim(),
          category: form.category,
          sku: form.sku.trim() || "",
          buyPrice: Number(form.buyPrice) || 0,
          sellPrice: Number(form.sellPrice) || 0,
          minStock: Number(form.minStock) || 0,
          supplier: form.supplier.trim() || "",
          dateAdded: new Date().toISOString()
        };
        setProducts((prev) => [createdProduct, ...prev]);
        showToast(`${createdProduct.name} added`);
      }
    } else {
      createdProduct = {
        id: uid("p"),
        name: form.name.trim(),
        category: form.category,
        sku: form.sku.trim() || "",
        buyPrice: Number(form.buyPrice) || 0,
        sellPrice: Number(form.sellPrice) || 0,
        minStock: Number(form.minStock) || 0,
        supplier: form.supplier.trim() || "",
        dateAdded: new Date().toISOString()
      };
      setProducts((prev) => [createdProduct, ...prev]);
      showToast(`${createdProduct.name} added`);
    }

    if (createdProduct && initialQty > 0) {
      if (supabase && online && isValidUuid(createdProduct.id)) {
        try {
          const movePayload = {
            product_id: createdProduct.id,
            delta: initialQty,
            movement_type: "STOCK_ADD",
            metadata: {
              buyPrice: createdProduct.buyPrice,
              actorName: user?.name || "Owner",
              actorId: user?.id || "owner"
            }
          };
          if (user && isValidUuid(user.id)) {
            movePayload.actor_id = user.id;
          }
          await supabase.from("stock_movements").insert(movePayload);
        } catch (err) {
          console.error("Error logging initial stock to Supabase:", err);
        }
      }

      addEvent("STOCK_ADD", createdProduct.id, initialQty, {
        buyPrice: createdProduct.buyPrice
      });
    }

    setShowAdd(false);
    setForm({
      name: "",
      category: PRODUCT_CATEGORIES[0],
      sku: "",
      buyPrice: "",
      sellPrice: "",
      minStock: "",
      supplier: "",
      initialStock: "0"
    });
  };

  const submitReceive = async (p) => {
    const qty = Number(receiveQty);

    if (!qty || qty < 1) {
      return;
    }

    if (supabase && online && isValidUuid(p.id)) {
      try {
        const movePayload = {
          product_id: p.id,
          delta: qty,
          movement_type: "STOCK_ADD",
          metadata: {
            buyPrice: p.buyPrice,
            actorName: user?.name || "Owner",
            actorId: user?.id || "owner"
          }
        };
        if (user && isValidUuid(user.id)) {
          movePayload.actor_id = user.id;
        }
        await supabase.from("stock_movements").insert(movePayload);
      } catch (err) {
        console.error("Error logging stock reception to Supabase:", err);
      }
    }

    addEvent("STOCK_ADD", p.id, qty, {
      buyPrice: p.buyPrice
    });

    showToast(`+${qty} ${p.name} added to stock`);

    setReceiving(null);
    setReceiveQty("");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <MiniMetric label="Products" value={products.length} icon={Boxes} />
        <MiniMetric label="Low stock" value={lowCount} icon={AlertTriangle} tone="amber" />
        <MiniMetric label="Stock value" value={ksh(stockValue)} icon={CircleDollarSign} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 justify-between mb-4">
        <div className="flex gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="in pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="in w-40"
          >
            <option>All</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} /> Add product
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Add a new product</div>
              <div className="text-xs text-stone-400 mt-0.5">Set pricing, initial stock, and threshold.</div>
            </div>
            <button
              onClick={() => setShowAdd(false)}
              className="h-8 w-8 rounded-lg hover:bg-stone-100 grid place-items-center text-stone-400 hover:text-stone-700"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <Field label="Product name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="in"
                placeholder="e.g. Water 500ml"
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="in"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="SKU / code">
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="in"
                placeholder="Optional"
              />
            </Field>
            <Field label="Supplier">
              <input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="in"
                placeholder="Optional"
              />
            </Field>
            <Field label="Buying price (KSh)">
              <input
                type="number"
                value={form.buyPrice}
                onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                className="in"
                placeholder="0"
              />
            </Field>
            <Field label="Selling price (KSh)">
              <input
                type="number"
                value={form.sellPrice}
                onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                className="in"
                placeholder="0"
              />
            </Field>
            <Field label="Initial stock quantity">
              <input
                type="number"
                min="0"
                value={form.initialStock}
                onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                className="in"
                placeholder="0"
              />
            </Field>
            <Field label="Minimum stock alert">
              <input
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                className="in"
                placeholder="0"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              onClick={submitAdd}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm"
            >
              Save product
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50/80 text-left text-[11px] uppercase tracking-wide text-stone-400 border-b border-stone-200">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                {isOwner && <th className="px-5 py-3 font-semibold">Margin</th>}
                <th className="px-5 py-3 font-semibold">Stock</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const stock = stockOf(p.id);
                const low = stock <= p.minStock;
                const history = events
                  .filter((e) => e.productId === p.id)
                  .sort((a, b) => new Date(b.ts) - new Date(a.ts))
                  .slice(0, 8);
                const marginAmount = p.sellPrice - p.buyPrice;
                const marginPercent = p.buyPrice > 0 ? Math.round((marginAmount / p.buyPrice) * 100) : null;

                return (
                  <React.Fragment key={p.id}>
                    <tr className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                          className="flex items-center gap-3 text-left w-full group"
                        >
                          <span className="h-9 w-9 rounded-lg bg-stone-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 grid place-items-center text-stone-500 transition-colors shrink-0">
                            <Package size={15} />
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors">{p.name}</div>
                            <div className="text-[11px] text-stone-400">{p.sku || "No SKU"} {p.supplier ? `· ${p.supplier}` : ""}</div>
                          </div>
                          <span className="ml-auto text-stone-300 group-hover:text-stone-500">
                            {expanded === p.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-stone-500">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600 font-medium">
                          {p.category}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-stone-900">{ksh(marginAmount)}</div>
                          <div className="text-[11px] text-stone-400">
                            {marginPercent !== null ? `${marginPercent}% markup` : "—"} (Buy: {ksh(p.buyPrice)} · Sell: {ksh(p.sellPrice)})
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            stock <= 0
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : low
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {stock} {stock <= 0 ? "in stock" : low ? "low stock" : "in stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isOwner && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setReceiving(receiving === p.id ? null : p.id)}
                              className="text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
                            >
                              Receive stock
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="h-8 w-8 rounded-lg border border-stone-200 hover:border-rose-200 hover:bg-rose-50 text-stone-400 hover:text-rose-600 grid place-items-center transition-colors"
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {receiving === p.id && (
                      <tr className="bg-emerald-50/60 border-b border-emerald-100">
                        <td colSpan={isOwner ? 5 : 4} className="px-5 py-3.5">
                          <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                            <div className="text-xs text-emerald-900 font-medium">
                              Add stock quantity for <span className="font-bold">{p.name}</span>:
                            </div>
                            <input
                              type="number"
                              min="1"
                              placeholder="Quantity"
                              value={receiveQty}
                              onChange={(e) => setReceiveQty(e.target.value)}
                              className="in sm:w-32 bg-white"
                              autoFocus
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => submitReceive(p)}
                                className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm"
                              >
                                Record stock
                              </button>
                              <button
                                onClick={() => {
                                  setReceiving(null);
                                  setReceiveQty("");
                                }}
                                className="px-3 py-2 text-xs text-stone-500 hover:text-stone-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {expanded === p.id && (
                      <tr className="bg-stone-50/50 border-b border-stone-100">
                        <td colSpan={isOwner ? 5 : 4} className="px-5 pb-4 pt-1">
                          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4">
                            <div className="text-[11px] uppercase tracking-wide text-stone-400 font-semibold mb-2.5 flex items-center gap-1.5">
                              <Clock size={12} /> Recent stock movements for {p.name}
                            </div>
                            {history.length === 0 ? (
                              <div className="text-xs text-stone-400 py-2">No stock movements recorded yet.</div>
                            ) : (
                              <div className="divide-y divide-stone-200/60">
                                {history.map((h) => (
                                  <div key={h.id} className="flex justify-between gap-3 py-2 text-xs">
                                    <span className="text-stone-600">
                                      {h.type === "SALE" ? "Customer Sale" : "Stock Received"} ·{" "}
                                      {employees.find((e) => e.id === h.actorId)?.name || h.actorId}
                                    </span>
                                    <span
                                      className={`font-semibold ${
                                        h.delta < 0 ? "text-rose-600" : "text-emerald-700"
                                      }`}
                                    >
                                      {h.delta > 0 ? "+" : ""}
                                      {h.delta} units · {fmtDate(h.ts)} {fmtTime(h.ts)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <div className="p-12 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-stone-100 grid place-items-center text-stone-400 mb-3">
              <Package size={20} />
            </div>
            <div className="text-sm font-medium text-stone-600">No products found</div>
            <div className="text-xs text-stone-400 mt-1">
              {query || category !== "All"
                ? "Try adjusting your search or category filter."
                : "Add your first product above to get started."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- expenses ----------
function Expenses({ expenses, setExpenses, user, online, showToast }) {
  const [form, setForm] = useState({ category: EXPENSE_CATEGORIES[0], amount: "", description: "" });
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const monthTotal = expenses.filter((e) => new Date(e.date).getMonth() === new Date().getMonth()).reduce((s, e) => s + e.amount, 0);

  const submit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    const expAmount = Number(form.amount);
    const e = {
      id: uid("exp"),
      category: form.category,
      amount: expAmount,
      description: form.description,
      date: new Date().toISOString(),
      actorId: user?.id || "owner"
    };

    if (supabase && online) {
      try {
        const expPayload = {
          category: form.category,
          amount: expAmount,
          description: form.description.trim() || null
        };
        if (user && isValidUuid(user.id)) {
          expPayload.actor_id = user.id;
        }
        const { data: expRow, error: expErr } = await supabase
          .from("expenses")
          .insert(expPayload)
          .select()
          .single();

        if (!expErr && expRow) {
          e.id = expRow.id;
          e.date = expRow.created_at;
        }
      } catch (err) {
        console.error("Error saving expense to Supabase:", err);
      }
    }

    setExpenses((prev) => [e, ...prev]);
    setForm({ category: EXPENSE_CATEGORIES[0], amount: "", description: "" });
    showToast(`Expense recorded — ${ksh(expAmount)}`);
  };

  const handleDeleteExpense = async (id) => {
    if (supabase && online && isValidUuid(id)) {
      try {
        await supabase.from("expenses").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting expense from Supabase:", err);
      }
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast("Expense removed");
  };

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="max-w-6xl mx-auto">
      <PageIntro eyebrow="Money out" title="Business expenses" text="Record costs so your profit picture stays realistic." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <StatCard label="This month" value={ksh(monthTotal)} icon={Receipt} tone="rose" />
        <StatCard label="All recorded" value={ksh(total)} icon={CircleDollarSign} tone="stone" />
        <StatCard label="Entries" value={expenses.length} icon={Clock} tone="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-5 items-start">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-700 grid place-items-center">
              <Receipt size={16} />
            </div>
            <div>
              <div className="font-semibold text-sm">Record expense</div>
              <div className="text-[11px] text-stone-400">Keep every business cost visible.</div>
            </div>
          </div>
          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="in">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount (KSh)">
            <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="in" placeholder="0" />
          </Field>
          <Field label="Description">
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="in" placeholder="What was this expense for?" />
          </Field>
          <button onClick={submit} className="w-full mt-2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors">
            Save expense
          </button>
        </div>
        <SectionCard title="Recent expenses" action={<span className="text-[11px] text-stone-400">Newest first</span>}>
          {sorted.length === 0 ? (
            <Empty text="No expenses recorded." />
          ) : (
            sorted.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-4 py-3 border-b border-stone-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-700 grid place-items-center">
                    <Receipt size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{e.category}</div>
                    <div className="text-xs text-stone-400 truncate">
                      {e.description || "No description"} · {fmtDate(e.date)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="text-sm font-semibold text-rose-700">− {ksh(e.amount)}</div>
                  <button onClick={() => handleDeleteExpense(e.id)} className="h-7 w-7 rounded-lg border border-stone-200 hover:border-rose-200 hover:bg-rose-50 text-stone-400 hover:text-rose-600 grid place-items-center transition-colors" title="Delete expense">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ---------- reports ----------
function Reports({ products, events, expenses, stockOf, themeObj }) {
  const [range, setRange] = useState(7); const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - range);
  const saleEvents = events.filter((e) => e.type === "SALE" && new Date(e.ts) >= cutoff); const revenue = saleEvents.reduce((s, e) => s + e.payload.total, 0); const cogs = saleEvents.reduce((s, e) => { const p = products.find((p) => p.id === e.productId); return s + (p ? p.buyPrice * -e.delta : 0); }, 0); const txCount = new Set(saleEvents.map((e) => e.payload.saleId)).size;
  const periodExpenses = expenses.filter((x) => new Date(x.date) >= cutoff); const expenseTotal = periodExpenses.reduce((s, x) => s + x.amount, 0); const byCategory = {}; periodExpenses.forEach((x) => { byCategory[x.category] = (byCategory[x.category] || 0) + x.amount; }); const grossProfit = revenue - cogs; const netProfit = grossProfit - expenseTotal; const stockValue = products.reduce((s, p) => s + Math.max(0, stockOf(p.id)) * p.buyPrice, 0); const lowStock = products.filter((p) => stockOf(p.id) <= p.minStock);
  const chartData = Array.from({ length: Math.min(range, 14) }, (_, idx) => { const i = Math.min(range, 14) - 1 - idx; const d = new Date(); d.setDate(d.getDate() - i); const k = dayKey(d); return { day: d.toLocaleDateString("en-KE", { day: "2-digit", month: "short" }), revenue: saleEvents.filter((e) => dayKey(e.ts) === k).reduce((s, e) => s + e.payload.total, 0) }; });
  return <div className="max-w-7xl mx-auto"><PageIntro eyebrow="Business intelligence" title="Reports & insights" text="Track the numbers behind your Duka." />
    <div className="flex gap-2 mb-5">{[7, 30, 90].map((r) => <button key={r} onClick={() => setRange(r)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold border ${range === r ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-500 border-stone-200"}`}>Last {r} days</button>)}</div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5"><StatCard label="Revenue" value={ksh(revenue)} icon={Banknote} tone="emerald" /><StatCard label="Gross profit" value={ksh(grossProfit)} icon={TrendingUp} tone="emerald" /><StatCard label="Expenses" value={ksh(expenseTotal)} icon={Receipt} tone="rose" /><StatCard label="Net profit" value={ksh(netProfit)} icon={CircleDollarSign} tone={netProfit >= 0 ? "emerald" : "rose"} /></div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5"><SectionCard title={`Revenue trend · ${range} days`} className="xl:col-span-2"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke={themeObj?.chart?.grid || "#f0efed"} /><XAxis dataKey="day" tick={{ fontSize: 10, fill: themeObj?.chart?.text || "#a8a29e" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: themeObj?.chart?.text || "#a8a29e" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip formatter={(v) => ksh(v)} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--border-main)", backgroundColor: "var(--bg-surface)", color: "var(--text-main)" }} /><Bar dataKey="revenue" fill={themeObj?.chart?.line || "#059669"} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></SectionCard><SectionCard title="Expense breakdown">{Object.keys(byCategory).length === 0 ? <Empty text="No expenses in this period." /> : Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => <div key={cat} className="mb-4 last:mb-0"><div className="flex justify-between text-xs mb-1.5"><span className="text-stone-600">{cat}</span><span className="font-semibold">{ksh(amt)}</span></div><div className="h-2 rounded-full bg-stone-100 overflow-hidden"><div className="h-full rounded-full bg-rose-400" style={{ width: `${expenseTotal ? Math.max(4, (amt / expenseTotal) * 100) : 0}%` }} /></div></div>)}</SectionCard></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5"><SectionCard title="Sales performance"><ReportLine label="Transactions" value={txCount} /><ReportLine label="Average sale" value={ksh(txCount ? revenue / txCount : 0)} /><ReportLine label="Gross margin" value={revenue ? `${Math.round((grossProfit / revenue) * 100)}%` : "0%"} /><ReportLine label="Net margin" value={revenue ? `${Math.round((netProfit / revenue) * 100)}%` : "0%"} bold tone={netProfit >= 0 ? "emerald" : "rose"} /></SectionCard><SectionCard title="Inventory health"><ReportLine label="Current stock value" value={ksh(stockValue)} /><ReportLine label="Products tracked" value={products.length} /><ReportLine label="Low stock products" value={lowStock.length} bold tone={lowStock.length ? "rose" : "emerald"} />{lowStock.slice(0, 4).map((p) => <RowLine key={p.id} left={p.name} right={`${stockOf(p.id)} left`} tone="amber" />)}</SectionCard></div>
  </div>;
}

// ---------- employees ----------
function Employees({ list }) {
  return <div className="max-w-5xl mx-auto"><PageIntro eyebrow="Access control" title="Employees" text="Keep track of who can use the system." /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{list.map((e) => { const owner = e.id === "owner"; return <div key={e.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className={`h-11 w-11 rounded-xl grid place-items-center text-xs font-bold ${owner ? "bg-stone-900 text-white" : "bg-emerald-50 text-emerald-700"}`}>{owner ? "MN" : "JM"}</div><div><div className="font-semibold">{e.name}</div><div className="text-xs text-stone-400">@{e.username}</div></div></div><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${owner ? "bg-stone-100 text-stone-600" : "bg-emerald-50 text-emerald-700"}`}>{owner ? "Administrator" : "Sales staff"}</span></div><div className="mt-5 pt-4 border-t border-stone-100"><div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-2">Permissions</div><div className="flex flex-wrap gap-2">{(owner ? ["Sales", "Inventory", "Expenses", "Reports", "Employees"] : ["Sales", "View inventory"]).map((x) => <span key={x} className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-50 text-stone-600 border border-stone-100">{x}</span>)}</div></div></div>; })}</div><div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3"><Lock size={16} className="text-amber-700 mt-0.5" /><div><div className="text-sm font-semibold text-amber-900">Supabase will enforce these permissions later</div><div className="text-xs text-amber-800/80 mt-1">For now this is a local demo. In Phase 3, authentication and Row Level Security will protect the data at database level.</div></div></div></div>;
}

// ---------- shared UI ----------
function StatCard({ label, value, sub, icon: Icon, tone = "stone" }) {
  const tones = { emerald: "text-emerald-700 bg-emerald-50", rose: "text-rose-700 bg-rose-50", amber: "text-amber-700 bg-amber-50", stone: "text-stone-700 bg-stone-100" };
  return <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-medium text-stone-400">{label}</div><div className="text-xl font-bold tracking-tight mt-1.5">{value}</div>{sub && <div className="text-[11px] text-stone-400 mt-1">{sub}</div>}</div><div className={`h-9 w-9 rounded-xl grid place-items-center ${tones[tone]}`}><Icon size={16} /></div></div></div>;
}
function MiniMetric({ label, value, icon: Icon, tone = "stone" }) { return <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-center gap-3"><div className={`h-9 w-9 rounded-lg grid place-items-center ${tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-600"}`}><Icon size={16} /></div><div><div className="text-xs text-stone-400">{label}</div><div className="font-bold text-sm mt-0.5">{value}</div></div></div>; }
function SectionCard({ title, children, className = "", action }) { return <div className={`bg-white border border-stone-200 rounded-2xl p-5 shadow-card ${className}`}><div className="flex items-center justify-between gap-3 mb-3"><div className="text-xs uppercase tracking-[.13em] text-stone-400 font-semibold">{title}</div>{action}</div>{children}</div>; }
function RowLine({ left, sub, right, tone }) { return <div className="flex items-center justify-between gap-4 py-2.5 text-sm border-b border-stone-50 last:border-0"><div className="min-w-0"><div className="text-stone-800 truncate">{left}</div>{sub && <div className="text-xs text-stone-400">{sub}</div>}</div><div className={tone === "amber" ? "text-amber-700 font-semibold text-xs" : "text-stone-700 font-medium text-xs"}>{right}</div></div>; }
function StockRow({ product, stock }) { const out = stock <= 0; return <div className="flex items-center justify-between gap-4 py-2.5 border-b border-stone-50 last:border-0"><div className="flex items-center gap-3 min-w-0"><div className={`h-9 w-9 rounded-lg grid place-items-center ${out ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}><AlertTriangle size={15} /></div><div className="min-w-0"><div className="text-sm font-medium truncate">{product.name}</div><div className="text-[11px] text-stone-400">Minimum {product.minStock}</div></div></div><span className={`text-xs font-bold ${out ? "text-rose-700" : "text-amber-700"}`}>{stock} left</span></div>; }
function ReportLine({ label, value, bold, tone }) { const toneCls = tone === "emerald" ? "text-emerald-700" : tone === "rose" ? "text-rose-700" : "text-stone-800"; return <div className={`flex justify-between py-2 text-sm ${bold ? "font-semibold border-t border-stone-100 mt-1 pt-3" : ""}`}><span className="text-stone-500">{label}</span><span className={toneCls}>{value}</span></div>; }
function Field({ label, children }) { return <div><div className="text-xs font-medium text-stone-500 mb-1.5">{label}</div>{children}</div>; }
function Empty({ text }) { return <div className="text-sm text-stone-400 py-3">{text}</div>; }
