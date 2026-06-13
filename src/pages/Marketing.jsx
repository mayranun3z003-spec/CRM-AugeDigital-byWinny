import React, { useState, useEffect } from "react";
import {
  Megaphone, Plus, Search, X, BarChart2, Mail, MessageCircle,
  Send, Users, TrendingUp, DollarSign, Play, Pause, Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TIPOS = ["Email", "SMS", "WhatsApp", "Mixta"];
const ESTADOS_CAMP = ["Borrador", "Programada", "En Curso", "Completada", "Pausada"];
const TIPO_ICONS = { Email: Mail, SMS: MessageCircle, WhatsApp: MessageCircle, Mixta: Send };
const TIPO_COLORS = {
  Email: "bg-blue-900/40 text-blue-400", SMS: "bg-yellow-900/40 text-yellow-400",
  WhatsApp: "bg-green-900/40 text-green-400", Mixta: "bg-purple-900/40 text-purple-400"
};
const ESTADO_COLORS = {
  Borrador: "bg-gray-800 text-gray-400", Programada: "bg-blue-900/40 text-blue-400",
  "En Curso": "bg-green-900/40 text-green-400", Completada: "bg-emerald-900/40 text-emerald-400",
  Pausada: "bg-yellow-900/40 text-yellow-400"
};

const EMPTY_CAMP = {
  nombre: "", tipo: "WhatsApp", estado: "Borrador", audiencia: "Todos",
  mensaje: "", asunto: "", fecha_inicio: "", fecha_fin: "",
  total_enviados: 0, total_abiertos: 0, total_conversiones: 0,
  presupuesto: 0, costo_real: 0
};

const metricasData = [
  { nombre: "Camp. Bienvenida", enviados: 150, abiertos: 87, conversiones: 22 },
  { nombre: "Promo Verano", enviados: 300, abiertos: 145, conversiones: 41 },
  { nombre: "Reactivación", enviados: 80, abiertos: 38, conversiones: 9 },
];

export default function Marketing() {
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CAMP);
  const [activeTab, setActiveTab] = useState("campanas");
  const [search, setSearch] = useState("");

  const fetchCampanas = () => {
    fetch("/api/entities/Campana/list")
      .then(r => r.json())
      .then(d => { setCampanas(d.records || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCampanas(); }, []);

  const handleSave = async () => {
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/entities/Campana/${form.id}` : "/api/entities/Campana";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setForm(EMPTY_CAMP); fetchCampanas();
  };

  const updateEstado = async (id, estado) => {
    await fetch(`/api/entities/Campana/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado })
    });
    fetchCampanas();
  };

  const filtered = campanas.filter(c => c.nombre?.toLowerCase().includes(search.toLowerCase()));

  const totalEnviados = campanas.reduce((s, c) => s + (c.total_enviados || 0), 0);
  const totalConversiones = campanas.reduce((s, c) => s + (c.total_conversiones || 0), 0);
  const roiPromedio = campanas.length > 0 ? (campanas.reduce((s, c) => {
    const roi = c.presupuesto > 0 ? ((c.total_conversiones * 100 - c.costo_real) / c.presupuesto * 100) : 0;
    return s + roi;
  }, 0) / campanas.length).toFixed(0) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Marketing & Campañas</h2>
          <p className="text-sm text-gray-400">{campanas.length} campañas configuradas</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_CAMP); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Nueva Campaña
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Enviados", value: totalEnviados.toLocaleString(), icon: Send, color: "text-blue-400" },
          { label: "Conversiones", value: totalConversiones, icon: TrendingUp, color: "text-green-400" },
          { label: "ROI Promedio", value: `${roiPromedio}%`, icon: DollarSign, color: "text-yellow-400" },
          { label: "Campañas Activas", value: campanas.filter(c => c.estado === "En Curso").length, icon: Megaphone, color: "text-purple-400" },
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
        {["campanas", "metricas", "audiencias"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              activeTab === t ? "bg-blue-600 text-white" : "bg-gray-900 text-gray-400 border border-gray-800 hover:text-white"
            }`}
          >{t === "campanas" ? "Campañas" : t === "metricas" ? "Métricas" : "Audiencias"}</button>
        ))}
      </div>

      {activeTab === "campanas" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar campañas..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Template Quick Creates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "Bienvenida a Nuevos", tipo: "WhatsApp", mensaje: "¡Hola {nombre}! Bienvenido/a a POST ADG. Somos tu mejor aliado en [producto]. ¿En qué podemos ayudarte hoy? 😊", audiencia: "Nuevo" },
              { label: "Promo del Mes", tipo: "Email", mensaje: "¡Hola {nombre}! Tenemos ofertas exclusivas para ti este mes. Descuentos de hasta 30% en productos seleccionados.", audiencia: "Frecuente" },
              { label: "Reactivación VIP", tipo: "WhatsApp", mensaje: "¡Hola {nombre}! Te extrañamos. Como cliente VIP, tienes un beneficio especial esperándote. 🎁", audiencia: "VIP" },
            ].map(tmpl => (
              <button
                key={tmpl.label}
                onClick={() => {
                  setForm({ ...EMPTY_CAMP, nombre: tmpl.label, tipo: tmpl.tipo, mensaje: tmpl.mensaje, audiencia: tmpl.audiencia });
                  setShowForm(true);
                }}
                className="bg-gray-900 border border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-4 text-left transition-all group"
              >
                <div className="text-sm font-semibold text-gray-300 group-hover:text-white">{tmpl.label}</div>
                <div className="text-xs text-gray-500 mt-1">{tmpl.tipo} • {tmpl.audiencia}</div>
                <div className="text-xs text-blue-400 mt-2 group-hover:text-blue-300">+ Usar plantilla</div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading ? <div className="text-center py-4 text-gray-400">Cargando...</div> :
              filtered.map(c => {
                const Icon = TIPO_ICONS[c.tipo] || Send;
                const tasaApertura = c.total_enviados > 0 ? ((c.total_abiertos / c.total_enviados) * 100).toFixed(0) : 0;
                const tasaConversion = c.total_enviados > 0 ? ((c.total_conversiones / c.total_enviados) * 100).toFixed(0) : 0;
                return (
                  <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TIPO_COLORS[c.tipo]}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-white">{c.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLORS[c.estado]}`}>{c.estado}</span>
                            <span className="text-xs text-gray-400">{c.tipo}</span>
                            <span className="text-xs text-gray-500">Audiencia: {c.audiencia}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {c.estado !== "Completada" && (
                          <button
                            onClick={() => updateEstado(c.id, c.estado === "En Curso" ? "Pausada" : "En Curso")}
                            className={`p-2 rounded-lg transition-all ${c.estado === "En Curso" ? "bg-yellow-900/40 hover:bg-yellow-700 text-yellow-400" : "bg-green-900/40 hover:bg-green-700 text-green-400"}`}
                          >
                            {c.estado === "En Curso" ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        )}
                        <button onClick={() => { setForm({ ...c }); setShowForm(true); }} className="p-2 rounded-lg bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white transition-all">
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                    {c.total_enviados > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-800">
                        <div className="text-center">
                          <div className="text-sm font-bold text-white">{c.total_enviados}</div>
                          <div className="text-xs text-gray-400">Enviados</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-blue-400">{tasaApertura}%</div>
                          <div className="text-xs text-gray-400">Apertura</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-green-400">{tasaConversion}%</div>
                          <div className="text-xs text-gray-400">Conversión</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === "metricas" && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4">Comparativa de Campañas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metricasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="nombre" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 12 }} />
                <Bar dataKey="enviados" fill="#3b82f6" name="Enviados" radius={[4, 4, 0, 0]} />
                <Bar dataKey="abiertos" fill="#8b5cf6" name="Abiertos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversiones" fill="#10b981" name="Conversiones" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "audiencias" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { nombre: "Clientes VIP", descripcion: "Clientes con mayor volumen de compras", icono: "⭐", color: "yellow", filtro: "categoria=VIP" },
            { nombre: "Clientes Frecuentes", descripcion: "Clientes con compras recurrentes", icono: "🔄", color: "blue", filtro: "categoria=Frecuente" },
            { nombre: "Clientes Nuevos", descripcion: "Registros de los últimos 30 días", icono: "🆕", color: "green", filtro: "categoria=Nuevo" },
            { nombre: "Clientes Inactivos", descripcion: "Sin compras en últimos 90 días", icono: "😴", color: "gray", filtro: "categoria=Inactivo" },
          ].map(a => (
            <div key={a.nombre} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{a.icono}</div>
                  <div>
                    <h3 className="font-bold text-white">{a.nombre}</h3>
                    <p className="text-xs text-gray-400">{a.descripcion}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setForm({ ...EMPTY_CAMP, audiencia: a.nombre.replace("Clientes ", "") });
                  setShowForm(true);
                }}
                className="w-full py-2 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all"
              >
                Crear Campaña para esta Audiencia
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{form.id ? "Editar Campaña" : "Nueva Campaña"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <input
                placeholder="Nombre de la campaña *"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={form.audiencia} onChange={e => setForm({ ...form, audiencia: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                  {["Todos", "VIP", "Frecuente", "Nuevo", "Inactivo"].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              {form.tipo === "Email" && (
                <input
                  placeholder="Asunto del email"
                  value={form.asunto}
                  onChange={e => setForm({ ...form, asunto: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500"
                />
              )}
              <textarea
                placeholder="Mensaje de la campaña... Usa {nombre} para personalizar."
                value={form.mensaje}
                onChange={e => setForm({ ...form, mensaje: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Fecha Inicio</label>
                  <input type="datetime-local" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Presupuesto $</label>
                  <input type="number" value={form.presupuesto} onChange={e => setForm({ ...form, presupuesto: +e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">Guardar Campaña</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
