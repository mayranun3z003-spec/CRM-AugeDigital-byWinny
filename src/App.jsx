import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Ventas from "./pages/Ventas";
import Inventario from "./pages/Inventario";
import Marketing from "./pages/Marketing";
import Soporte from "./pages/Soporte";
import BotMagdis from "./pages/BotMagdis";
import POS from "./pages/POS";
import Workflows from "./pages/Workflows";
import {
  LayoutDashboard, Users, TrendingUp, Package, Megaphone,
  HeadphonesIcon, Bot, ShoppingCart, GitBranch, Menu, X,
  Bell, ChevronRight, Sparkles
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard",   label: "Dashboard",       icon: LayoutDashboard, group: "Principal" },
  { id: "clientes",    label: "Clientes",         icon: Users,           group: "CRM" },
  { id: "ventas",      label: "Ventas",           icon: TrendingUp,      group: "CRM" },
  { id: "inventario",  label: "Inventario",       icon: Package,         group: "Operaciones" },
  { id: "pos",         label: "Punto de Venta",   icon: ShoppingCart,    group: "Operaciones" },
  { id: "soporte",     label: "Soporte",          icon: HeadphonesIcon,  group: "Servicio" },
  { id: "marketing",   label: "Marketing",        icon: Megaphone,       group: "Servicio" },
  { id: "bot",         label: "Bot Magdis",       icon: Bot,             group: "Automatización" },
  { id: "workflows",   label: "Workflows",        icon: GitBranch,       group: "Automatización" },
];

const GROUPS = ["Principal", "CRM", "Operaciones", "Servicio", "Automatización"];

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([
    "🎉 PED-2026-003 registrado por Magdis",
    "⚠️ Stock bajo: Cartucho HP 664 (8 uds)",
    "📋 Nuevo ticket TKT-002 abierto",
  ]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [orderAlert, setOrderAlert] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = (msg) => setNotifications(prev => [msg, ...prev]);

  const sharedProps = { setOrderAlert, addNotification };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":  return <Dashboard  {...sharedProps} />;
      case "clientes":   return <Clientes   {...sharedProps} />;
      case "ventas":     return <Ventas     {...sharedProps} />;
      case "inventario": return <Inventario {...sharedProps} />;
      case "marketing":  return <Marketing  {...sharedProps} />;
      case "soporte":    return <Soporte    {...sharedProps} />;
      case "bot":        return <BotMagdis  {...sharedProps} />;
      case "pos":        return <POS        {...sharedProps} />;
      case "workflows":  return <Workflows  {...sharedProps} />;
      default:           return <Dashboard  {...sharedProps} />;
    }
  };

  const activeItem = NAV_ITEMS.find(n => n.id === activePage);

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden font-sans">

      {/* ──────────── SIDEBAR ──────────── */}
      <aside
        className={`${sidebarOpen ? "w-60" : "w-16"} transition-all duration-300 bg-gray-900
          border-r border-gray-800 flex flex-col shrink-0 z-40`}
      >
        {/* Logo */}
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <span className="text-white font-black text-xs tracking-tight">CP</span>
            </div>
            {sidebarOpen && (
              <div className="min-w-0 leading-tight">
                <div className="font-black text-white text-sm truncate">CRM POST ADG</div>
                <div className="text-xs text-blue-400 truncate">Jhonny Gallardo</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto space-y-3">
          {GROUPS.map(group => {
            const items = NAV_ITEMS.filter(n => n.group === group);
            return (
              <div key={group}>
                {sidebarOpen && (
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">
                    {group}
                  </p>
                )}
                {items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActivePage(id)}
                    title={!sidebarOpen ? label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-sm font-medium mb-0.5
                      ${activePage === id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    {sidebarOpen && <span className="truncate">{label}</span>}
                    {sidebarOpen && activePage === id && (
                      <ChevronRight size={12} className="ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Magdis Status */}
        {sidebarOpen ? (
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={() => setActivePage("bot")}
              className="w-full bg-gradient-to-r from-purple-900/60 to-blue-900/60 rounded-xl p-3 border border-purple-700/30 hover:border-purple-500/50 transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-bold text-purple-300">Magdis Online</span>
                <Bot size={12} className="text-purple-400 ml-auto" />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Bot activo • Toca para configurar</p>
            </button>
          </div>
        ) : (
          <div className="p-2 border-t border-gray-800">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mx-auto"></div>
          </div>
        )}
      </aside>

      {/* ──────────── MAIN AREA ──────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-gray-500 hidden sm:block">CRM POST ADG</span>
            <ChevronRight size={12} className="text-gray-600 hidden sm:block" />
            <div className="flex items-center gap-2">
              {activeItem && <activeItem.icon size={15} className="text-blue-400" />}
              <span className="text-sm font-bold text-white truncate">{activeItem?.label}</span>
            </div>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-gray-800"
            >
              <Bell size={17} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-800">
                  <span className="text-sm font-bold text-white">Notificaciones</span>
                  <button onClick={() => setNotifications([])} className="text-xs text-gray-400 hover:text-red-400">Limpiar</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3">Sin notificaciones</p>
                  ) : notifications.map((n, i) => (
                    <div key={i} className="px-3 py-2.5 text-xs text-gray-300 border-b border-gray-800 hover:bg-gray-800 cursor-pointer">
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User chip */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-gray-700 transition-colors">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-black">J</div>
            <span className="text-xs text-gray-300 hidden sm:block font-medium">Jhonny G.</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          {renderPage()}
        </main>
      </div>

      {/* ──────────── WELCOME TOAST ──────────── */}
      {showWelcome && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl px-5 py-3 shadow-2xl shadow-blue-500/30 flex items-center gap-3 animate-fade-in">
          <Sparkles size={18} className="text-yellow-300" />
          <div>
            <p className="text-sm font-black text-white">¡Bienvenido a CRM POST ADG!</p>
            <p className="text-xs text-blue-200">Sistema completo activo • Magdis online</p>
          </div>
          <button onClick={() => setShowWelcome(false)} className="text-white/60 hover:text-white ml-2"><X size={14} /></button>
        </div>
      )}

      {/* ──────────── ORDER ALERT POPUP ──────────── */}
      {orderAlert && (
        <div className="fixed bottom-5 right-5 z-50 w-80 bg-gradient-to-br from-green-950 to-emerald-900 border border-green-600/40 rounded-2xl shadow-2xl shadow-green-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs font-black text-green-400 uppercase tracking-wide">🎉 Pedido Exitoso</span>
              </div>
              <p className="text-sm font-bold text-white truncate">{orderAlert.numero}</p>
              <p className="text-xs text-green-200">{orderAlert.cliente}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-white font-black">${(orderAlert.total || 0).toLocaleString()}</span>
                <span className="text-xs text-gray-400">{orderAlert.canal}</span>
              </div>
            </div>
            <button onClick={() => setOrderAlert(null)} className="text-gray-400 hover:text-white shrink-0">
              <X size={15} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => { setActivePage("soporte"); setOrderAlert(null); }}
              className="py-1.5 bg-green-700/60 hover:bg-green-600/80 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Ver Pedido
            </button>
            <button
              onClick={() => setOrderAlert(null)}
              className="py-1.5 bg-gray-700/60 hover:bg-gray-600/80 text-gray-300 text-xs font-medium rounded-xl transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
