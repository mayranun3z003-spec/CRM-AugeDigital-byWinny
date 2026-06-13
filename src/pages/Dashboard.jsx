import React, { useState, useEffect } from "react";
import { read_entities } from "../api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Users, TrendingUp, Package, Ticket, ShoppingCart,
  AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Download
} from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const salesData = [
  { mes: "Ene", ventas: 28000, pedidos: 45 },
  { mes: "Feb", ventas: 35000, pedidos: 62 },
  { mes: "Mar", ventas: 42000, pedidos: 71 },
  { mes: "Abr", ventas: 38000, pedidos: 58 },
  { mes: "May", ventas: 51000, pedidos: 89 },
  { mes: "Jun", ventas: 47000, pedidos: 76 },
];

const canalData = [
  { name: "WhatsApp/Bot", value: 42 },
  { name: "POS Presencial", value: 31 },
  { name: "Web/Tel", value: 27 },
];

export default function Dashboard({ setOrderAlert }) {
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/entities/Cliente/list").then(r => r.json()).catch(() => ({ records: [] })),
      fetch("/api/entities/Pedido/list").then(r => r.json()).catch(() => ({ records: [] })),
      fetch("/api/entities/Ticket/list").then(r => r.json()).catch(() => ({ records: [] })),
      fetch("/api/entities/Producto/list").then(r => r.json()).catch(() => ({ records: [] })),
    ]).then(([c, p, t, pr]) => {
      setClientes(c.records || []);
      setPedidos(p.records || []);
      setTickets(t.records || []);
      setProductos(pr.records || []);
      setLoading(false);
    });
  }, []);

  const totalVentas = pedidos.reduce((s, p) => s + (p.total || 0), 0);
  const ticketsAbiertos = tickets.filter(t => t.estado === "Abierto" || t.estado === "En Proceso").length;
  const stockBajo = productos.filter(p => p.stock <= p.stock_minimo).length;
  const pedidosPendientes = pedidos.filter(p => p.estado === "Pendiente" || p.estado === "En Proceso").length;

  const kpis = [
    { label: "Clientes Totales", value: clientes.length, icon: Users, color: "blue", trend: "+12%", up: true },
    { label: "Ventas del Mes", value: `$${totalVentas.toLocaleString()}`, icon: TrendingUp, color: "green", trend: "+8%", up: true },
    { label: "Pedidos Activos", value: pedidosPendientes, icon: ShoppingCart, color: "purple", trend: "+5", up: true },
    { label: "Tickets Abiertos", value: ticketsAbiertos, icon: Ticket, color: "orange", trend: "-2", up: false },
    { label: "Stock Bajo Alerta", value: stockBajo, icon: AlertTriangle, color: "red", trend: "Urgente", up: false },
    { label: "Nuevos Clientes", value: clientes.filter(c => c.categoria === "Nuevo").length, icon: ArrowUpRight, color: "teal", trend: "+3 hoy", up: true },
  ];

  const colorMap = {
    blue: "from-blue-500 to-blue-700",
    green: "from-emerald-500 to-green-700",
    purple: "from-purple-500 to-violet-700",
    orange: "from-orange-500 to-amber-700",
    red: "from-red-500 to-rose-700",
    teal: "from-teal-500 to-cyan-700",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Dashboard Analítico</h2>
          <p className="text-sm text-gray-400">CRM POST ADG — Jhonny Gallardo | Tiempo real</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOrderAlert({ numero: "PED-DEMO", cliente: "Demo Cliente", total: 2500, canal: "Bot Magdis" })}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-medium transition-colors"
          >
            <ShoppingCart size={14} /> Simular Pedido
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors">
            <Download size={14} /> Exportar
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors">
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, trend, up }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-xl font-black text-white">{loading ? "..." : value}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</div>
            <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${up ? "text-green-400" : "text-red-400"}`}>
              {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white">Ventas & Pedidos</h3>
              <p className="text-xs text-gray-400">Últimos 6 meses</p>
            </div>
            <select className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-300">
              <option>Últimos 6 meses</option>
              <option>Este año</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="mes" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 12 }} />
              <Area type="monotone" dataKey="ventas" stroke="#3b82f6" fill="url(#colorVentas)" strokeWidth={2} name="Ventas $" />
              <Bar dataKey="pedidos" fill="#8b5cf6" name="Pedidos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Canal Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-1">Ventas por Canal</h3>
          <p className="text-xs text-gray-400 mb-4">Distribución actual</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={canalData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {canalData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1">
            {canalData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }}></div>
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="text-white font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Pedidos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">Pedidos Recientes</h3>
          <div className="space-y-3">
            {pedidos.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-white">{p.numero_pedido || "N/A"}</p>
                  <p className="text-xs text-gray-400">{p.canal} • {p.metodo_pago}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">${(p.total || 0).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.estado === "Entregado" ? "bg-green-900/50 text-green-400" :
                    p.estado === "En Proceso" ? "bg-blue-900/50 text-blue-400" :
                    p.estado === "Pendiente" ? "bg-yellow-900/50 text-yellow-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>{p.estado}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">Alertas del Sistema</h3>
          <div className="space-y-3">
            {productos.filter(p => p.stock <= p.stock_minimo).map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-xl p-3">
                <AlertTriangle size={16} className="text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Stock Bajo: {p.nombre}</p>
                  <p className="text-xs text-gray-400">Stock actual: {p.stock} | Mínimo: {p.stock_minimo}</p>
                </div>
              </div>
            ))}
            {tickets.filter(t => t.prioridad === "Urgente").map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-orange-900/20 border border-orange-800/30 rounded-xl p-3">
                <AlertTriangle size={16} className="text-orange-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Ticket Urgente: {t.numero_ticket}</p>
                  <p className="text-xs text-gray-400">{t.titulo}</p>
                </div>
              </div>
            ))}
            {ticketsAbiertos === 0 && stockBajo === 0 && (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-sm text-gray-400">Sin alertas críticas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
