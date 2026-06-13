import React, { useState, useEffect } from "react";
import {
  HeadphonesIcon, Plus, Search, Filter, X, Clock,
  CheckCircle, AlertTriangle, MessageSquare, Package
} from "lucide-react";

const PRIORIDADES = ["Baja", "Media", "Alta", "Urgente"];
const ESTADOS = ["Abierto", "En Proceso", "Resuelto", "Cerrado"];
const CATEGORIAS_TKT = ["Soporte Técnico", "Reclamo", "Consulta", "Devolución", "Pedido", "Otro"];

const PRIORIDAD_COLORS = {
  Baja: "bg-gray-800 text-gray-400", Media: "bg-blue-900/50 text-blue-400",
  Alta: "bg-orange-900/50 text-orange-400", Urgente: "bg-red-900/50 text-red-400"
};
const ESTADO_COLORS = {
  Abierto: "bg-yellow-900/50 text-yellow-400", "En Proceso": "bg-blue-900/50 text-blue-400",
  Resuelto: "bg-green-900/50 text-green-400", Cerrado: "bg-gray-800 text-gray-400"
};

const EMPTY_TKT = {
  numero_ticket: "", titulo: "", descripcion: "", categoria: "Consulta",
  prioridad: "Media", estado: "Abierto", canal: "WhatsApp", pedido_id: ""
};

export default function Soporte() {
  const [tickets, setTickets] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TKT);
  const [queryPedido, setQueryPedido] = useState("");
  const [pedidoResult, setPedidoResult] = useState(null);
  const [activeTab, setActiveTab] = useState("tickets");

  const fetchData = () => {
    Promise.all([
      fetch("/api/entities/Ticket/list").then(r => r.json()),
      fetch("/api/entities/Pedido/list").then(r => r.json()),
    ]).then(([t, p]) => {
      setTickets(t.records || []);
      setPedidos(p.records || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const num = `TKT-${String(tickets.length + 1).padStart(3, "0")}`;
    const payload = { ...form, numero_ticket: form.numero_ticket || num };
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/entities/Ticket/${form.id}` : "/api/entities/Ticket";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setShowForm(false); setForm(EMPTY_TKT); fetchData();
  };

  const updateEstado = async (id, estado) => {
    const payload = { estado };
    if (estado === "Resuelto" || estado === "Cerrado") payload.fecha_resolucion = new Date().toISOString();
    await fetch(`/api/entities/Ticket/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    fetchData();
  };

  const buscarPedido = () => {
    const found = pedidos.find(p =>
      p.numero_pedido?.toLowerCase() === queryPedido.toLowerCase().trim() ||
      p.id === queryPedido.trim()
    );
    setPedidoResult(found || "not_found");
  };

  const filtered = tickets.filter(t => {
    const matchSearch = `${t.numero_ticket} ${t.titulo} ${t.descripcion}`.toLowerCase().includes(search.toLowerCase());
    const matchEstado = estadoFilter === "Todos" || t.estado === estadoFilter;
    return matchSearch && matchEstado;
  });

  const stats = {
    abiertos: tickets.filter(t => t.estado === "Abierto").length,
    enProceso: tickets.filter(t => t.estado === "En Proceso").length,
    resueltos: tickets.filter(t => t.estado === "Resuelto").length,
    urgentes: tickets.filter(t => t.prioridad === "Urgente").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Soporte & Tickets</h2>
          <p className="text-sm text-gray-400">{tickets.length} tickets en total</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_TKT); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Nuevo Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Abiertos", value: stats.abiertos, color: "text-yellow-400" },
          { label: "En Proceso", value: stats.enProceso, color: "text-blue-400" },
          { label: "Resueltos", value: stats.resueltos, color: "text-green-400" },
          { label: "Urgentes", value: stats.urgentes, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["tickets", "consulta_pedido"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t ? "bg-blue-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >{t === "tickets" ? "Tickets" : "Consultar Pedido"}</button>
        ))}
      </div>

      {activeTab === "consulta_pedido" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                <Package size={24} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Consulta de Estatus de Pedido</h3>
                <p className="text-xs text-gray-400">Ingresa el número de pedido para ver su estado</p>
              </div>
            </div>
            <div className="flex gap-3 mb-4">
              <input
                value={queryPedido}
                onChange={e => setQueryPedido(e.target.value)}
                onKeyDown={e => e.key === "Enter" && buscarPedido()}
                placeholder="Ej: PED-2026-001"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={buscarPedido}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
              >
                Consultar
              </button>
            </div>

            {pedidoResult && (
              <div className={`rounded-xl p-5 border ${pedidoResult === "not_found" ? "bg-red-900/20 border-red-800/40" : "bg-green-900/10 border-green-800/30"}`}>
                {pedidoResult === "not_found" ? (
                  <div className="text-center">
                    <X size={32} className="text-red-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-red-300">Pedido no encontrado</p>
                    <p className="text-xs text-gray-400">Verifica el número ingresado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-white">{pedidoResult.numero_pedido}</span>
                      <span className={`text-sm px-3 py-1 rounded-full font-semibold ${
                        pedidoResult.estado === "Entregado" ? "bg-green-900/50 text-green-400" :
                        pedidoResult.estado === "En Proceso" ? "bg-blue-900/50 text-blue-400" :
                        "bg-yellow-900/50 text-yellow-400"
                      }`}>{pedidoResult.estado}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-400">Canal:</span> <span className="text-white">{pedidoResult.canal}</span></div>
                      <div><span className="text-gray-400">Total:</span> <span className="text-white font-bold">${(pedidoResult.total || 0).toLocaleString()}</span></div>
                      <div><span className="text-gray-400">Pago:</span> <span className="text-white">{pedidoResult.metodo_pago}</span></div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        {["Pendiente", "Confirmado", "En Proceso", "Enviado", "Entregado"].map(e => (
                          <span key={e} className={`${pedidoResult.estado === e ? "text-blue-400 font-semibold" : ""}`}>{e}</span>
                        ))}
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                          style={{
                            width: `${["Pendiente", "Confirmado", "En Proceso", "Enviado", "Entregado"].indexOf(pedidoResult.estado) / 4 * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar tickets..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {["Todos", ...ESTADOS].map(e => (
                <button
                  key={e}
                  onClick={() => setEstadoFilter(e)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${estadoFilter === e ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}
                >{e}</button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Cargando...</div>
            ) : filtered.map(t => (
              <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{t.numero_ticket}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORIDAD_COLORS[t.prioridad]}`}>{t.prioridad}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ESTADO_COLORS[t.estado]}`}>{t.estado}</span>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{t.categoria}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{t.titulo}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-1">Canal: {t.canal}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <select
                      value={t.estado}
                      onChange={e => updateEstado(t.id, e.target.value)}
                      className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-300"
                    >
                      {ESTADOS.map(e => <option key={e}>{e}</option>)}
                    </select>
                    <button
                      onClick={() => { setForm({ ...t }); setShowForm(true); }}
                      className="text-xs bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white px-2 py-1 rounded-lg transition-all"
                    >Editar</button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-400">
                <HeadphonesIcon size={32} className="mx-auto mb-2 opacity-30" />
                <p>No hay tickets</p>
              </div>
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{form.id ? "Editar Ticket" : "Nuevo Ticket"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input
                placeholder="Título del ticket *"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Descripción detallada..."
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                  {CATEGORIAS_TKT.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                  {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
                </select>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                  {ESTADOS.map(e => <option key={e}>{e}</option>)}
                </select>
                <input
                  placeholder="Canal (WhatsApp, Tel...)"
                  value={form.canal}
                  onChange={e => setForm({ ...form, canal: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500"
                />
              </div>
              <input
                placeholder="Número de pedido relacionado (opcional)"
                value={form.pedido_id}
                onChange={e => setForm({ ...form, pedido_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500"
              />
            </div>
            <div className="p-5 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">Guardar Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
