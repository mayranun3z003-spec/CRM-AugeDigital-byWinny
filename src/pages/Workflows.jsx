import React, { useState, useEffect } from "react";
import {
  GitBranch, Plus, Play, Pause, Trash2, Edit3, X, Zap,
  CheckCircle, Clock, Mail, MessageCircle, Bell, Users,
  ArrowRight, Settings, Activity
} from "lucide-react";

const EVENTOS = [
  "Cliente nuevo registrado",
  "Pedido creado",
  "Pedido entregado",
  "Ticket abierto",
  "Ticket urgente",
  "Stock bajo",
  "Oportunidad actualizada",
  "Campaña iniciada",
];

const ACCIONES_TIPOS = [
  { id: "email", label: "Enviar Email", icon: Mail },
  { id: "whatsapp", label: "Enviar WhatsApp", icon: MessageCircle },
  { id: "notificacion", label: "Notificación interna", icon: Bell },
  { id: "asignar", label: "Asignar a agente", icon: Users },
  { id: "crear_ticket", label: "Crear Ticket", icon: Plus },
  { id: "actualizar", label: "Actualizar registro", icon: Settings },
];

const EMPTY_WF = {
  nombre: "", descripcion: "", evento_disparador: "Cliente nuevo registrado",
  condiciones: [], acciones: [], activo: true, ejecuciones: 0
};

const TEMPLATES = [
  {
    nombre: "Bienvenida a Cliente Nuevo",
    descripcion: "Envía un mensaje de bienvenida vía WhatsApp cuando se registra un cliente nuevo",
    evento_disparador: "Cliente nuevo registrado",
    acciones: [{ tipo: "whatsapp", mensaje: "¡Hola {nombre}! Bienvenido/a a POST ADG. Estamos aquí para ayudarte 😊" }],
    activo: true
  },
  {
    nombre: "Alerta de Stock Bajo",
    descripcion: "Notifica al administrador cuando un producto llega al stock mínimo",
    evento_disparador: "Stock bajo",
    acciones: [{ tipo: "notificacion", mensaje: "Alerta: {producto} tiene stock bajo ({stock} unidades)" }],
    activo: true
  },
  {
    nombre: "Seguimiento Post-Venta",
    descripcion: "Envía mensaje de seguimiento 3 días después de entrega del pedido",
    evento_disparador: "Pedido entregado",
    acciones: [{ tipo: "whatsapp", mensaje: "Hola {nombre}, ¿cómo te fue con tu pedido? Nos interesa tu opinión 🌟" }],
    activo: true
  },
  {
    nombre: "Escalamiento de Ticket Urgente",
    descripcion: "Asigna automáticamente tickets urgentes al supervisor",
    evento_disparador: "Ticket urgente",
    acciones: [{ tipo: "asignar", agente: "Supervisor" }, { tipo: "notificacion", mensaje: "Ticket urgente: {titulo}" }],
    activo: true
  },
];

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_WF);
  const [activeTab, setActiveTab] = useState("lista");

  const fetchWorkflows = () => {
    fetch("/api/entities/Workflow/list")
      .then(r => r.json())
      .then(d => { setWorkflows(d.records || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchWorkflows(); }, []);

  const handleSave = async () => {
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/entities/Workflow/${form.id}` : "/api/entities/Workflow";
    await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, acciones: form.acciones || [], condiciones: form.condiciones || [] })
    });
    setShowForm(false); setForm(EMPTY_WF); fetchWorkflows();
  };

  const toggleActivo = async (wf) => {
    await fetch(`/api/entities/Workflow/${wf.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !wf.activo })
    });
    fetchWorkflows();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este workflow?")) return;
    await fetch(`/api/entities/Workflow/${id}`, { method: "DELETE" });
    fetchWorkflows();
  };

  const instalarTemplate = async (tmpl) => {
    await fetch("/api/entities/Workflow", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tmpl, ejecuciones: 0 })
    });
    fetchWorkflows();
    setActiveTab("lista");
  };

  const totalEjecuciones = workflows.reduce((s, w) => s + (w.ejecuciones || 0), 0);
  const activos = workflows.filter(w => w.activo).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Automatización de Flujos</h2>
          <p className="text-sm text-gray-400">{workflows.length} workflows • {activos} activos</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_WF); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Nuevo Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <Activity size={18} className="text-blue-400 mb-2" />
          <div className="text-xl font-black text-white">{activos}</div>
          <div className="text-xs text-gray-400">Workflows Activos</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <Zap size={18} className="text-yellow-400 mb-2" />
          <div className="text-xl font-black text-white">{totalEjecuciones}</div>
          <div className="text-xs text-gray-400">Ejecuciones Totales</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <CheckCircle size={18} className="text-green-400 mb-2" />
          <div className="text-xl font-black text-white">{TEMPLATES.length}</div>
          <div className="text-xs text-gray-400">Plantillas Disponibles</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["lista", "templates"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t ? "bg-blue-600 text-white" : "bg-gray-900 text-gray-400 border border-gray-800 hover:text-white"
            }`}
          >{t === "lista" ? "Mis Workflows" : "Plantillas"}</button>
        ))}
      </div>

      {activeTab === "lista" && (
        <div className="space-y-3">
          {loading ? <div className="text-center py-8 text-gray-400">Cargando...</div> :
            workflows.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 border border-dashed border-gray-700 rounded-2xl">
                <GitBranch size={36} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold">Sin workflows configurados</p>
                <p className="text-sm text-gray-500 mt-1">Usa las plantillas para comenzar rápido</p>
                <button
                  onClick={() => setActiveTab("templates")}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
                >Ver Plantillas</button>
              </div>
            ) : workflows.map(wf => (
              <div key={wf.id} className={`bg-gray-900 border rounded-2xl p-4 hover:border-gray-600 transition-all ${wf.activo ? "border-gray-800" : "border-gray-800 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${wf.activo ? "bg-blue-900/40" : "bg-gray-800"}`}>
                      <GitBranch size={18} className={wf.activo ? "text-blue-400" : "text-gray-500"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-white">{wf.nombre}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${wf.activo ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                          {wf.activo ? "Activo" : "Pausado"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{wf.descripcion}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-purple-400">
                          <Zap size={10} /> {wf.evento_disparador}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Activity size={10} /> {wf.ejecuciones || 0} ejecuciones
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActivo(wf)}
                      className={`p-2 rounded-lg transition-all ${wf.activo ? "bg-yellow-900/40 hover:bg-yellow-700 text-yellow-400" : "bg-green-900/40 hover:bg-green-700 text-green-400"}`}
                    >
                      {wf.activo ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => { setForm({ ...wf }); setShowForm(true); }} className="p-2 rounded-lg bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white transition-all">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(wf.id)} className="p-2 rounded-lg bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Actions preview */}
                {wf.acciones?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Acciones:</span>
                    {wf.acciones.map((a, i) => {
                      const accionDef = ACCIONES_TIPOS.find(t => t.id === a.tipo);
                      return (
                        <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          {accionDef && <accionDef.icon size={10} />}
                          {accionDef?.label || a.tipo}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((tmpl, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center shrink-0">
                  <Zap size={18} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{tmpl.nombre}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{tmpl.descripcion}</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                  <div className="w-6 h-6 rounded bg-yellow-900/40 flex items-center justify-center shrink-0">
                    <Zap size={10} className="text-yellow-400" />
                  </div>
                  <span className="font-semibold text-yellow-300">Disparador:</span>
                  <span>{tmpl.evento_disparador}</span>
                </div>
                {tmpl.acciones.map((a, j) => {
                  const def = ACCIONES_TIPOS.find(t => t.id === a.tipo);
                  return (
                    <div key={j} className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                      <div className="w-6 h-6 rounded bg-blue-900/40 flex items-center justify-center shrink-0">
                        {def ? <def.icon size={10} className="text-blue-400" /> : <ArrowRight size={10} className="text-blue-400" />}
                      </div>
                      <span className="font-semibold text-blue-300">Acción:</span>
                      <span className="truncate">{def?.label || a.tipo}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => instalarTemplate(tmpl)}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-sm font-semibold transition-all"
              >
                Instalar Plantilla
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{form.id ? "Editar Workflow" : "Nuevo Workflow"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <input
                placeholder="Nombre del workflow *"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Descripción..."
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 resize-none"
              />
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">Evento Disparador</label>
                <select
                  value={form.evento_disparador}
                  onChange={e => setForm({ ...form, evento_disparador: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                >
                  {EVENTOS.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Workflow Activo</p>
                  <p className="text-xs text-gray-400">El workflow se ejecutará automáticamente</p>
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
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
