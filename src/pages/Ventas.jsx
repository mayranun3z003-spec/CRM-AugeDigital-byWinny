import React, { useState, useEffect } from "react";
import {
  TrendingUp, Plus, Search, X, ChevronRight, DollarSign,
  Target, BarChart2, Download, FileText, Calendar
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const ETAPAS = ["Prospecto", "Calificación", "Propuesta", "Negociación", "Cierre Ganado", "Cierre Perdido"];
const ETAPA_COLORS = {
  "Prospecto": "bg-gray-700 text-gray-300",
  "Calificación": "bg-blue-900/50 text-blue-400",
  "Propuesta": "bg-purple-900/50 text-purple-400",
  "Negociación": "bg-yellow-900/50 text-yellow-400",
  "Cierre Ganado": "bg-green-900/50 text-green-400",
  "Cierre Perdido": "bg-red-900/50 text-red-400",
};

const EMPTY_OPP = {
  titulo: "", cliente_id: "", etapa: "Prospecto", valor: 0,
  probabilidad: 0, descripcion: "", fecha_cierre_estimada: ""
};

const ventasReporte = [
  { periodo: "Ene", valor: 28000 }, { periodo: "Feb", valor: 35000 },
  { periodo: "Mar", valor: 42000 }, { periodo: "Abr", valor: 38000 },
  { periodo: "May", valor: 51000 }, { periodo: "Jun", valor: 47000 },
];

export default function Ventas() {
  const [oportunidades, setOportunidades] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_OPP);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [search, setSearch] = useState("");

  const fetchData = () => {
    Promise.all([
      fetch("/api/entities/Oportunidad/list").then(r => r.json()),
      fetch("/api/entities/Pedido/list").then(r => r.json()),
      fetch("/api/entities/Cliente/list").then(r => r.json()),
    ]).then(([o, p, c]) => {
      setOportunidades(o.records || []);
      setPedidos(p.records || []);
      setClientes(c.records || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/entities/Oportunidad/${form.id}` : "/api/entities/Oportunidad";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setForm(EMPTY_OPP);
    fetchData();
  };

  const updateEtapa = async (id, etapa) => {
    await fetch(`/api/entities/Oportunidad/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa })
    });
    fetchData();
  };

  const getClientName = (id) => {
    const c = clientes.find(c => c.id === id);
    return c ? `${c.nombre} ${c.apellido}` : "Cliente";
  };

  const totalPipeline = oportunidades.reduce((s, o) => s + (o.valor || 0), 0);
  const ganadas = oportunidades.filter(o => o.etapa === "Cierre Ganado").reduce((s, o) => s + (o.valor || 0), 0);
  const totalPedidos = pedidos.reduce((s, p) => s + (p.total || 0), 0);

  const filteredOpps = oportunidades.filter(o =>
    o.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    getClientName(o.cliente_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Gestión de Ventas</h2>
          <p className="text-sm text-gray-400">Pipeline, reportes y facturación</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_OPP); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Nueva Oportunidad
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Pipeline", value: `$${totalPipeline.toLocaleString()}`, color: "text-blue-400", icon: Target },
          { label: "Ventas Ganadas", value: `$${ganadas.toLocaleString()}`, color: "text-green-400", icon: TrendingUp },
          { label: "Pedidos Totales", value: `$${totalPedidos.toLocaleString()}`, color: "text-purple-400", icon: DollarSign },
          { label: "Oportunidades", value: oportunidades.length, color: "text-yellow-400", icon: BarChart2 },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <k.icon size={18} className={`${k.color} mb-2`} />
            <div className={`text-xl font-black ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-400">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["pipeline", "pedidos", "reportes"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              activeTab === t ? "bg-blue-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >{t === "pipeline" ? "Pipeline" : t === "pedidos" ? "Pedidos" : "Reportes"}</button>
        ))}
      </div>

      {activeTab === "pipeline" && (
        <div>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar oportunidades..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Kanban Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
            {ETAPAS.map(etapa => {
              const opps = filteredOpps.filter(o => o.etapa === etapa);
              return (
                <div key={etapa} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 min-w-[160px]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-300">{etapa}</span>
                    <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">{opps.length}</span>
                  </div>
                  <div className="space-y-2">
                    {opps.map(o => (
                      <div key={o.id} className="bg-gray-800 rounded-xl p-3 cursor-pointer hover:bg-gray-700 transition-all border border-gray-700">
                        <p className="text-xs font-semibold text-white leading-tight">{o.titulo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{getClientName(o.cliente_id)}</p>
                        <p className="text-sm font-bold text-blue-400 mt-1">${(o.valor || 0).toLocaleString()}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                            <span>Prob.</span><span>{o.probabilidad || 0}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-700 rounded-full">
                            <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${o.probabilidad || 0}%` }}></div>
                          </div>
                        </div>
                        <select
                          value={o.etapa}
                          onChange={e => updateEtapa(o.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full mt-2 text-xs bg-gray-700 border-0 rounded-lg py-1 px-2 text-gray-300"
                        >
                          {ETAPAS.map(e => <option key={e}>{e}</option>)}
                        </select>
                      </div>
                    ))}
                    {opps.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-600">Sin oportunidades</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "pedidos" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-white">Registro de Pedidos</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors">
              <Download size={13} /> Exportar CSV
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Pedido</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Canal</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Método Pago</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Total</th>
                <th className="text-left text-xs text-gray-400 font-semibold px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {pedidos.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm font-semibold text-white">{p.numero_pedido}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{p.canal}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{p.metodo_pago}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">${(p.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      p.estado === "Entregado" ? "bg-green-900/50 text-green-400" :
                      p.estado === "En Proceso" ? "bg-blue-900/50 text-blue-400" :
                      "bg-yellow-900/50 text-yellow-400"
                    }`}>{p.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "reportes" && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Ventas por Periodo</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium">
                <Download size={13} /> Exportar
              </button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ventasReporte}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="periodo" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 12 }} />
                <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ventas $" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Mejor Mes", value: "Mayo 2026", detail: "$51,000", icon: TrendingUp, color: "green" },
              { label: "Promedio Mensual", value: "$40,167", detail: "Últimos 6 meses", icon: BarChart2, color: "blue" },
              { label: "Meta Anual", value: "68%", detail: "Avance $483K / $710K", icon: Target, color: "purple" },
            ].map(r => (
              <div key={r.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <r.icon size={20} className={`text-${r.color}-400 mb-2`} />
                <div className="text-xl font-black text-white">{r.value}</div>
                <div className="text-sm font-semibold text-gray-300">{r.label}</div>
                <div className="text-xs text-gray-400">{r.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Nueva Oportunidad</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <input
                placeholder="Título *"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <select
                value={form.cliente_id}
                onChange={e => setForm({ ...form, cliente_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Valor $</label>
                  <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: +e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Probabilidad %</label>
                  <input type="number" min={0} max={100} value={form.probabilidad} onChange={e => setForm({ ...form, probabilidad: +e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <select
                value={form.etapa}
                onChange={e => setForm({ ...form, etapa: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
              >
                {ETAPAS.map(e => <option key={e}>{e}</option>)}
              </select>
              <input
                type="date"
                value={form.fecha_cierre_estimada}
                onChange={e => setForm({ ...form, fecha_cierre_estimada: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
              />
              <textarea
                placeholder="Descripción..."
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 resize-none"
              />
            </div>
            <div className="p-5 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
