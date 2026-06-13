import React, { useState, useEffect } from "react";
import {
  Users, Plus, Search, Filter, Star, Phone, Mail, MessageCircle,
  Edit3, Trash2, Clock, Tag, X, Building2, MapPin, CreditCard,
  TrendingUp, CheckCircle, AlertCircle, ChevronDown, UserCheck,
  Barcode, Calendar, Download, Upload, Eye
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from "recharts";

/* ─── Constantes ─────────────────────────────────────── */
const CATEGORIAS = ["Todos", "VIP", "Frecuente", "Nuevo", "Inactivo"];

const CAT_STYLES = {
  VIP:      { badge: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/30", dot: "bg-yellow-400", emoji: "⭐" },
  Frecuente:{ badge: "bg-blue-900/40   text-blue-300   border border-blue-700/30",   dot: "bg-blue-400",   emoji: "🔄" },
  Nuevo:    { badge: "bg-green-900/40  text-green-300  border border-green-700/30",  dot: "bg-green-400",  emoji: "🆕" },
  Inactivo: { badge: "bg-gray-800      text-gray-400   border border-gray-700",       dot: "bg-gray-500",   emoji: "😴" },
};

const INTERACCION_ICONS = {
  Llamada: "📞", Correo: "📧", WhatsApp: "💬",
  Visita: "🤝", SMS: "📱", Otro: "📌"
};

const EMPTY_CLIENT = {
  nombre: "", apellido: "", email: "", telefono: "", whatsapp: "",
  empresa: "", categoria: "Nuevo", ciudad: "", direccion: "",
  notas: "", rfc: "", fecha_nacimiento: "", total_compras: 0,
  etiquetas: [], activo: true,
};

const EMPTY_INTERACCION = {
  tipo: "Llamada", descripcion: "", resultado: "",
  agente: "Jhonny Gallardo", seguimiento_requerido: false, fecha_seguimiento: ""
};

/* ─── Helpers ─────────────────────────────────────────── */
const fmt = (v) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ═══════════════════════════════════════════════════════ */
export default function Clientes() {
  /* Estado principal */
  const [clientes, setClientes] = useState([]);
  const [interacciones, setInteracciones] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  /* UI */
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState("nombre");
  const [viewMode, setViewMode] = useState("tabla"); // tabla | tarjetas
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(null);  // cliente seleccionado
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [etiquetaInput, setEtiquetaInput] = useState("");

  /* Interacciones */
  const [showInter, setShowInter] = useState(null);
  const [newInter, setNewInter] = useState(EMPTY_INTERACCION);
  const [activeTab, setActiveTab] = useState("info"); // info | interacciones | pedidos | stats

  /* ─── Carga de datos ───────────────────────────────── */
  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/entities/Cliente/list").then(r => r.json()),
      fetch("/api/entities/Interaccion/list").then(r => r.json()),
      fetch("/api/entities/Pedido/list").then(r => r.json()),
    ]).then(([c, i, p]) => {
      setClientes(c.records || []);
      setInteracciones(i.records || []);
      setPedidos(p.records || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  /* ─── Filtro + Orden ──────────────────────────────── */
  const filtered = clientes
    .filter(c => {
      const q = search.toLowerCase();
      const matchQ = !q || `${c.nombre} ${c.apellido} ${c.empresa} ${c.email} ${c.telefono}`
        .toLowerCase().includes(q);
      const matchCat = catFilter === "Todos" || c.categoria === catFilter;
      return matchQ && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "total_compras") return (b.total_compras || 0) - (a.total_compras || 0);
      if (sortBy === "reciente") return new Date(b.created_date) - new Date(a.created_date);
      return (a.nombre || "").localeCompare(b.nombre || "");
    });

  /* ─── Estadísticas ────────────────────────────────── */
  const stats = {
    total: clientes.length,
    vip: clientes.filter(c => c.categoria === "VIP").length,
    frecuente: clientes.filter(c => c.categoria === "Frecuente").length,
    nuevo: clientes.filter(c => c.categoria === "Nuevo").length,
    inactivo: clientes.filter(c => c.categoria === "Inactivo").length,
    ventaTotal: clientes.reduce((s, c) => s + (c.total_compras || 0), 0),
  };

  /* ─── CRUD Clientes ───────────────────────────────── */
  const handleSave = async () => {
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/entities/Cliente/${form.id}` : "/api/entities/Cliente";
    await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm(EMPTY_CLIENT);
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) return;
    await fetch(`/api/entities/Cliente/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const addEtiqueta = () => {
    if (!etiquetaInput.trim()) return;
    setForm(f => ({ ...f, etiquetas: [...(f.etiquetas || []), etiquetaInput.trim()] }));
    setEtiquetaInput("");
  };

  const removeEtiqueta = (idx) =>
    setForm(f => ({ ...f, etiquetas: f.etiquetas.filter((_, i) => i !== idx) }));

  /* ─── CRUD Interacciones ──────────────────────────── */
  const addInteraccion = async (clienteId) => {
    if (!newInter.descripcion.trim()) return;
    await fetch("/api/entities/Interaccion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newInter,
        cliente_id: clienteId,
        fecha: new Date().toISOString(),
      }),
    });
    await fetch(`/api/entities/Cliente/${clienteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ultima_interaccion: new Date().toISOString() }),
    });
    setNewInter(EMPTY_INTERACCION);
    fetchAll();
  };

  /* ─── Exportar CSV ────────────────────────────────── */
  const exportCSV = () => {
    const headers = ["Nombre", "Apellido", "Email", "Teléfono", "WhatsApp", "Empresa", "Categoría", "Ciudad", "RFC", "Total Compras"];
    const rows = clientes.map(c => [
      c.nombre, c.apellido, c.email, c.telefono, c.whatsapp,
      c.empresa, c.categoria, c.ciudad, c.rfc,
      c.total_compras || 0,
    ].map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `clientes_crm_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ─── Helpers locales ─────────────────────────────── */
  const clienteInteracciones = (id) => interacciones.filter(i => i.cliente_id === id);
  const clientePedidos = (id) => pedidos.filter(p => p.cliente_id === id);

  /* ════════════════════ RENDER ══════════════════════ */
  return (
    <div className="p-6 space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Gestión de Clientes</h2>
          <p className="text-sm text-gray-400">{stats.total} clientes · Valor total {fmt(stats.ventaTotal)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={14} /> Exportar CSV
          </button>
          <button
            onClick={() => { setForm(EMPTY_CLIENT); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total",      value: stats.total,     color: "text-white" },
          { label: "VIP ⭐",     value: stats.vip,       color: "text-yellow-400" },
          { label: "Frecuente",  value: stats.frecuente, color: "text-blue-400" },
          { label: "Nuevo",      value: stats.nuevo,     color: "text-green-400" },
          { label: "Inactivo",   value: stats.inactivo,  color: "text-gray-400" },
          { label: "Venta Total",value: fmt(stats.ventaTotal), color: "text-purple-400" },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
            <div className={`text-lg font-black ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empresa, email, teléfono..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Categoría chips */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                catFilter === cat
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >{cat}</button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 focus:outline-none"
        >
          <option value="nombre">Ordenar: A-Z</option>
          <option value="reciente">Más recientes</option>
          <option value="total_compras">Mayor compra</option>
        </select>

        {/* View toggle */}
        <div className="flex border border-gray-700 rounded-xl overflow-hidden">
          {["tabla", "tarjetas"].map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-2 text-xs font-medium transition-all ${viewMode === v ? "bg-blue-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800"}`}
            >{v === "tabla" ? "Tabla" : "Tarjetas"}</button>
          ))}
        </div>
      </div>

      {/* ══════════════ VISTA TABLA ══════════════ */}
      {viewMode === "tabla" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/40">
                  {["Cliente", "Contacto", "Empresa", "Categoría", "Compras", "Última Inter.", "Acciones"].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 font-semibold px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Cargando clientes...
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-500">
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    <p>No se encontraron clientes</p>
                  </td></tr>
                ) : filtered.map(c => {
                  const cat = CAT_STYLES[c.categoria] || CAT_STYLES.Nuevo;
                  const numInter = clienteInteracciones(c.id).length;
                  return (
                    <tr key={c.id} className="hover:bg-gray-800/40 transition-colors group">
                      {/* Cliente */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                            {(c.nombre || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-tight">
                              {c.nombre} {c.apellido}
                            </p>
                            {c.ciudad && <p className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin size={9} />{c.ciudad}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Contacto */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {c.email    && <div className="flex items-center gap-1 text-xs text-gray-300"><Mail size={10} className="text-gray-500" />{c.email}</div>}
                          {c.telefono && <div className="flex items-center gap-1 text-xs text-gray-300"><Phone size={10} className="text-gray-500" />{c.telefono}</div>}
                          {c.whatsapp && <div className="flex items-center gap-1 text-xs text-green-400"><MessageCircle size={10} />{c.whatsapp}</div>}
                        </div>
                      </td>
                      {/* Empresa */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-300">
                          <Building2 size={12} className="text-gray-500" />
                          {c.empresa || <span className="text-gray-600 italic">Sin empresa</span>}
                        </div>
                        {c.rfc && <p className="text-xs text-gray-500 mt-0.5">RFC: {c.rfc}</p>}
                      </td>
                      {/* Categoría */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cat.badge}`}>
                          {cat.emoji} {c.categoria}
                        </span>
                        {/* Etiquetas */}
                        {c.etiquetas?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.etiquetas.slice(0, 2).map((e, i) => (
                              <span key={i} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">#{e}</span>
                            ))}
                            {c.etiquetas.length > 2 && <span className="text-xs text-gray-500">+{c.etiquetas.length - 2}</span>}
                          </div>
                        )}
                      </td>
                      {/* Compras */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-white">{fmt(c.total_compras)}</p>
                        <p className="text-xs text-gray-400">{numInter} interacc.</p>
                      </td>
                      {/* Última interacción */}
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {c.ultima_interaccion ? fmtDate(c.ultima_interaccion) : "—"}
                      </td>
                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setShowProfile(c); setActiveTab("info"); }}
                            title="Ver perfil"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white transition-all"
                          ><Eye size={14} /></button>
                          <button
                            onClick={() => { setShowInter(c); }}
                            title="Historial"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white transition-all"
                          ><Clock size={14} /></button>
                          <button
                            onClick={() => { setForm({ ...c }); setShowForm(true); }}
                            title="Editar"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-green-700 text-gray-400 hover:text-white transition-all"
                          ><Edit3 size={14} /></button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            title="Eliminar"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-all"
                          ><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>Mostrando {filtered.length} de {clientes.length} clientes</span>
            <span>CRM POST ADG — Jhonny Gallardo</span>
          </div>
        </div>
      )}

      {/* ══════════════ VISTA TARJETAS ══════════════ */}
      {viewMode === "tarjetas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading && <div className="col-span-4 text-center py-10 text-gray-400">Cargando...</div>}
          {!loading && filtered.map(c => {
            const cat = CAT_STYLES[c.categoria] || CAT_STYLES.Nuevo;
            const numInter = clienteInteracciones(c.id).length;
            const numPedidos = clientePedidos(c.id).length;
            return (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-all flex flex-col gap-3">
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-black shadow-sm">
                      {(c.nombre || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{c.nombre} {c.apellido}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.badge}`}>{cat.emoji} {c.categoria}</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1 text-xs text-gray-400">
                  {c.empresa   && <div className="flex items-center gap-1"><Building2 size={11} className="text-gray-500" />{c.empresa}</div>}
                  {c.email     && <div className="flex items-center gap-1"><Mail size={11} className="text-gray-500" />{c.email}</div>}
                  {c.telefono  && <div className="flex items-center gap-1"><Phone size={11} className="text-gray-500" />{c.telefono}</div>}
                  {c.ciudad    && <div className="flex items-center gap-1"><MapPin size={11} className="text-gray-500" />{c.ciudad}</div>}
                </div>

                {/* Chips */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center">
                    <div className="font-black text-white">{fmt(c.total_compras)}</div>
                    <div className="text-gray-500">Compras</div>
                  </div>
                  <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center">
                    <div className="font-black text-blue-400">{numInter}</div>
                    <div className="text-gray-500">Interacc.</div>
                  </div>
                  <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center">
                    <div className="font-black text-purple-400">{numPedidos}</div>
                    <div className="text-gray-500">Pedidos</div>
                  </div>
                </div>

                {/* Etiquetas */}
                {c.etiquetas?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.etiquetas.map((e, i) => (
                      <span key={i} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">#{e}</span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1 mt-auto pt-2 border-t border-gray-800">
                  <button
                    onClick={() => { setShowProfile(c); setActiveTab("info"); }}
                    className="flex-1 py-1.5 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1"
                  ><Eye size={11} /> Ver</button>
                  <button
                    onClick={() => setShowInter(c)}
                    className="flex-1 py-1.5 bg-gray-800 hover:bg-purple-600 text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1"
                  ><Clock size={11} /> Historial</button>
                  <button
                    onClick={() => { setForm({ ...c }); setShowForm(true); }}
                    className="py-1.5 px-2 bg-gray-800 hover:bg-green-700 text-gray-400 hover:text-white rounded-xl transition-all"
                  ><Edit3 size={13} /></button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="py-1.5 px-2 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-xl transition-all"
                  ><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════ MODAL: PERFIL COMPLETO ════════════ */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header del perfil */}
            <div className="relative bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-t-2xl p-5">
              <button onClick={() => setShowProfile(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black shadow-xl">
                  {(showProfile.nombre || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{showProfile.nombre} {showProfile.apellido}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CAT_STYLES[showProfile.categoria]?.badge || ""}`}>
                      {CAT_STYLES[showProfile.categoria]?.emoji} {showProfile.categoria}
                    </span>
                    {showProfile.empresa && <span className="text-xs text-gray-300">{showProfile.empresa}</span>}
                  </div>
                  <p className="text-sm font-bold text-blue-300 mt-1">{fmt(showProfile.total_compras)} en compras</p>
                </div>
              </div>

              {/* Tabs del perfil */}
              <div className="flex gap-2 mt-4">
                {["info", "interacciones", "pedidos"].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      activeTab === t ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >{t === "info" ? "Información" : t === "interacciones" ? "Historial" : "Pedidos"}</button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {/* Tab: Información */}
              {activeTab === "info" && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Email", value: showProfile.email, icon: Mail },
                    { label: "Teléfono", value: showProfile.telefono, icon: Phone },
                    { label: "WhatsApp", value: showProfile.whatsapp, icon: MessageCircle },
                    { label: "Ciudad", value: showProfile.ciudad, icon: MapPin },
                    { label: "Dirección", value: showProfile.direccion, icon: Building2 },
                    { label: "RFC", value: showProfile.rfc, icon: CreditCard },
                    { label: "F. Nacimiento", value: fmtDate(showProfile.fecha_nacimiento), icon: Calendar },
                    { label: "Últ. Interacción", value: fmtDate(showProfile.ultima_interaccion), icon: Clock },
                  ].map(f => f.value && (
                    <div key={f.label} className="flex items-start gap-2">
                      <f.icon size={14} className="text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">{f.label}</p>
                        <p className="text-white font-medium">{f.value}</p>
                      </div>
                    </div>
                  ))}
                  {showProfile.notas && (
                    <div className="col-span-2 bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Notas</p>
                      <p className="text-sm text-gray-200">{showProfile.notas}</p>
                    </div>
                  )}
                  {showProfile.etiquetas?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-1.5">Etiquetas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {showProfile.etiquetas.map((e, i) => (
                          <span key={i} className="text-xs bg-blue-900/40 text-blue-300 border border-blue-700/30 px-2 py-0.5 rounded-full">#{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Interacciones */}
              {activeTab === "interacciones" && (
                <div className="space-y-3">
                  {/* Agregar nueva */}
                  <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-white">Registrar Nueva Interacción</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newInter.tipo}
                        onChange={e => setNewInter({ ...newInter, tipo: e.target.value })}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                      >
                        {["Llamada", "Correo", "WhatsApp", "Visita", "SMS", "Otro"].map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        value={newInter.agente}
                        onChange={e => setNewInter({ ...newInter, agente: e.target.value })}
                        placeholder="Agente"
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400"
                      />
                    </div>
                    <textarea
                      value={newInter.descripcion}
                      onChange={e => setNewInter({ ...newInter, descripcion: e.target.value })}
                      placeholder="Descripción de la interacción..."
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 resize-none"
                    />
                    <input
                      value={newInter.resultado}
                      onChange={e => setNewInter({ ...newInter, resultado: e.target.value })}
                      placeholder="Resultado / conclusión"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={newInter.seguimiento_requerido}
                          onChange={e => setNewInter({ ...newInter, seguimiento_requerido: e.target.checked })}
                          className="rounded" />
                        Requiere seguimiento
                      </label>
                      {newInter.seguimiento_requerido && (
                        <input type="date" value={newInter.fecha_seguimiento}
                          onChange={e => setNewInter({ ...newInter, fecha_seguimiento: e.target.value })}
                          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white" />
                      )}
                    </div>
                    <button
                      onClick={() => addInteraccion(showProfile.id)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
                    >
                      ✅ Registrar Interacción
                    </button>
                  </div>

                  {/* Historial */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {clienteInteracciones(showProfile.id).length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Sin interacciones registradas</p>
                    ) : clienteInteracciones(showProfile.id)
                        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                        .map(inter => (
                      <div key={inter.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{INTERACCION_ICONS[inter.tipo] || "📌"}</span>
                            <span className="text-xs font-bold text-blue-300">{inter.tipo}</span>
                            {inter.agente && <span className="text-xs text-gray-500">· {inter.agente}</span>}
                          </div>
                          <span className="text-xs text-gray-500">{fmtDate(inter.fecha)}</span>
                        </div>
                        <p className="text-sm text-white">{inter.descripcion}</p>
                        {inter.resultado && (
                          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <CheckCircle size={10} /> {inter.resultado}
                          </p>
                        )}
                        {inter.seguimiento_requerido && (
                          <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                            <Clock size={10} /> Seguimiento: {fmtDate(inter.fecha_seguimiento)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Pedidos */}
              {activeTab === "pedidos" && (
                <div className="space-y-2">
                  {clientePedidos(showProfile.id).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Sin pedidos registrados</p>
                  ) : clientePedidos(showProfile.id).map(p => (
                    <div key={p.id} className="bg-gray-800 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{p.numero_pedido}</p>
                        <p className="text-xs text-gray-400">{p.canal} · {p.metodo_pago}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">{fmt(p.total)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          p.estado === "Entregado" ? "bg-green-900/40 text-green-400" :
                          p.estado === "En Proceso" ? "bg-blue-900/40 text-blue-400" :
                          "bg-yellow-900/40 text-yellow-400"
                        }`}>{p.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => { setForm({ ...showProfile }); setShowProfile(null); setShowForm(true); }}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Edit3 size={14} /> Editar Cliente
              </button>
              <button onClick={() => setShowProfile(null)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ MODAL: HISTORIAL (acceso rápido) ════════════ */}
      {showInter && !showProfile && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">{showInter.nombre} {showInter.apellido}</h3>
                <p className="text-xs text-gray-400">Historial de interacciones</p>
              </div>
              <button onClick={() => setShowInter(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Quick form */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <select value={newInter.tipo} onChange={e => setNewInter({ ...newInter, tipo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white">
                  {["Llamada", "Correo", "WhatsApp", "Visita", "SMS", "Otro"].map(t => <option key={t}>{t}</option>)}
                </select>
                <input value={newInter.descripcion} onChange={e => setNewInter({ ...newInter, descripcion: e.target.value })}
                  placeholder="Descripción..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400" />
                <input value={newInter.resultado} onChange={e => setNewInter({ ...newInter, resultado: e.target.value })}
                  placeholder="Resultado..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400" />
                <button
                  onClick={() => { addInteraccion(showInter.id); setShowInter(null); }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
                >Registrar</button>
              </div>

              {clienteInteracciones(showInter.id)
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .map(inter => (
                <div key={inter.id} className="bg-gray-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-300">{INTERACCION_ICONS[inter.tipo]} {inter.tipo}</span>
                    <span className="text-xs text-gray-500">{fmtDate(inter.fecha)}</span>
                  </div>
                  <p className="text-sm text-white">{inter.descripcion}</p>
                  {inter.resultado && <p className="text-xs text-green-400 mt-1">✓ {inter.resultado}</p>}
                </div>
              ))}
              {clienteInteracciones(showInter.id).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">Sin interacciones</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ MODAL: FORMULARIO CLIENTE ════════════ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{form.id ? "✏️ Editar Cliente" : "➕ Nuevo Cliente"}</h3>
                <p className="text-xs text-gray-400">Completa la información del cliente</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Sección: Datos Personales */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserCheck size={12} /> Datos Personales
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "nombre", label: "Nombre *", col: 1 },
                    { key: "apellido", label: "Apellido", col: 1 },
                    { key: "fecha_nacimiento", label: "F. Nacimiento", type: "date", col: 1 },
                    { key: "rfc", label: "RFC", col: 1 },
                  ].map(f => (
                    <div key={f.key} className={`flex flex-col gap-1 ${f.col === 2 ? "col-span-2" : ""}`}>
                      <label className="text-xs text-gray-400 font-medium">{f.label}</label>
                      <input
                        type={f.type || "text"}
                        value={form[f.key] || ""}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección: Contacto */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Phone size={12} /> Contacto
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "email", label: "Email", type: "email" },
                    { key: "telefono", label: "Teléfono" },
                    { key: "whatsapp", label: "WhatsApp" },
                    { key: "empresa", label: "Empresa" },
                  ].map(f => (
                    <div key={f.key} className="flex flex-col gap-1">
                      <label className="text-xs text-gray-400 font-medium">{f.label}</label>
                      <input
                        type={f.type || "text"}
                        value={form[f.key] || ""}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección: Dirección */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin size={12} /> Ubicación
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Ciudad</label>
                    <input value={form.ciudad || ""} onChange={e => setForm({ ...form, ciudad: e.target.value })}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Dirección</label>
                    <input value={form.direccion || ""} onChange={e => setForm({ ...form, direccion: e.target.value })}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              {/* Sección: Clasificación */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag size={12} /> Clasificación
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Categoría</label>
                    <select
                      value={form.categoria || "Nuevo"}
                      onChange={e => setForm({ ...form, categoria: e.target.value })}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {["VIP", "Frecuente", "Nuevo", "Inactivo"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Total Compras $</label>
                    <input type="number" value={form.total_compras || 0}
                      onChange={e => setForm({ ...form, total_compras: +e.target.value })}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                {/* Etiquetas */}
                <div className="mt-3">
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Etiquetas</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={etiquetaInput}
                      onChange={e => setEtiquetaInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addEtiqueta()}
                      placeholder="Nueva etiqueta (Enter)"
                      className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={addEtiqueta} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold">
                      + Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.etiquetas || []).map((e, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-blue-900/40 text-blue-300 border border-blue-700/30 px-2 py-0.5 rounded-full">
                        #{e}
                        <button onClick={() => removeEtiqueta(i)} className="text-blue-400 hover:text-red-400"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">Notas Internas</label>
                <textarea
                  value={form.notas || ""}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  rows={3}
                  placeholder="Notas sobre el cliente, preferencias, comentarios..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Cliente Activo</p>
                  <p className="text-xs text-gray-400">Los clientes inactivos no aparecen en campañas</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.activo ? "bg-green-500" : "bg-gray-600"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${form.activo ? "left-6" : "left-0.5"}`}></div>
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
              >
                {form.id ? "Guardar Cambios" : "Crear Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
