import React, { useState, useEffect, useRef } from "react";
import {
  Bot, Settings, RefreshCw, MessageCircle, Send, X, Save,
  Activity, AlertCircle, CheckCircle, Zap, User, Phone
} from "lucide-react";

const DEMO_MESSAGES = [
  { id: 1, dir: "entrante", msg: "Hola, buenos días", from: "+52 814 XXX XXXX", tipo: "texto", ts: "09:14" },
  { id: 2, dir: "saliente", msg: "¡Hola! Soy Magdis, asistente de POST ADG 😊 ¿En qué te puedo ayudar hoy?", tipo: "bot", ts: "09:14" },
  { id: 3, dir: "entrante", msg: "Quiero saber el precio del papel bond", from: "+52 814 XXX XXXX", tipo: "texto", ts: "09:15" },
  { id: 4, dir: "saliente", msg: "¡Claro! El papel bond tamaño carta (resma 500 hojas) tiene un precio de $120. ¿Te gustaría hacer un pedido? 📦", tipo: "bot", ts: "09:15" },
  { id: 5, dir: "entrante", msg: "Sí, quiero 3 resmas", from: "+52 814 XXX XXXX", tipo: "texto", ts: "09:16" },
  { id: 6, dir: "saliente", msg: "Perfecto! Tu pedido: 3 Resmas Papel Bond = $360. ✅ Pedido registrado como PED-2026-004. ¿Cómo prefieres pagar?", tipo: "bot", ts: "09:16" },
  { id: 7, dir: "entrante", msg: "Transferencia por favor", from: "+52 814 XXX XXXX", tipo: "texto", ts: "09:17" },
  { id: 8, dir: "saliente", msg: "Perfecto! Te comparto los datos de transferencia. Tu pedido quedará confirmado al recibir el comprobante 🙌", tipo: "bot", ts: "09:17" },
];

export default function BotMagdis() {
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [editConfig, setEditConfig] = useState({});
  const [transferredChats, setTransferredChats] = useState([
    { id: "tc1", nombre: "Carlos Reyes", numero: "+52 814 555 0001", motivo: "Consulta especial de precio", hora: "10:23", transferido: true }
  ]);
  const [activeChat, setActiveChat] = useState(null);
  const chatEndRef = useRef();
  const [humanMsg, setHumanMsg] = useState("");

  useEffect(() => {
    fetch("/api/entities/BotConfig/list")
      .then(r => r.json())
      .then(d => {
        const cfg = d.records?.[0] || {};
        setConfig(cfg);
        setEditConfig({ ...cfg });
      });

    // Simulate logs
    setLogs([
      { time: "09:17", event: "Pedido PED-2026-004 registrado exitosamente", type: "success" },
      { time: "09:16", event: "Cliente consultó precio Papel Bond", type: "info" },
      { time: "09:15", event: "Sesión iniciada: +52 814 XXX XXXX", type: "info" },
      { time: "09:14", event: "Bot Magdis respondió saludo inicial", type: "info" },
      { time: "08:45", event: "Conversación transferida a agente humano — Carlos Reyes", type: "warning" },
      { time: "08:30", event: "Intento de consulta sin match → transferencia activada", type: "warning" },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const method = config?.id ? "PUT" : "POST";
      const url = config?.id ? `/api/entities/BotConfig/${config.id}` : "/api/entities/BotConfig";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editConfig) });
      setConfig({ ...config, ...editConfig });
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    await new Promise(r => setTimeout(r, 2000));
    if (config?.id) {
      await fetch(`/api/entities/BotConfig/${config.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ultimo_reinicio: new Date().toISOString() })
      });
    }
    setLogs(prev => [{ time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }), event: "Bot Magdis reiniciado correctamente", type: "success" }, ...prev]);
    setRestarting(false);
  };

  const sendDemoMsg = () => {
    if (!chatMsg.trim()) return;
    const ts = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    const newMsg = { id: Date.now(), dir: "entrante", msg: chatMsg, from: "+52 814 TEST", tipo: "texto", ts };
    setMessages(prev => [...prev, newMsg]);
    setChatMsg("");

    // Bot auto reply simulation
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        dir: "saliente",
        msg: "Gracias por tu mensaje. Estoy procesando tu solicitud. Soy Magdis y estoy aquí para ayudarte 😊",
        tipo: "bot",
        ts: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  const sendHumanReply = (chatId) => {
    if (!humanMsg.trim()) return;
    const ts = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, {
      id: Date.now(), dir: "saliente", msg: humanMsg, tipo: "humano", ts
    }]);
    setHumanMsg("");
    setLogs(prev => [{ time: ts, event: `Agente respondió en chat transferido (${chatId})`, type: "info" }, ...prev]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Bot Magdis</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config?.activo ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></div>
              <span className="text-sm text-gray-400">{config?.activo ? "Activo y operando" : "Inactivo"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw size={14} className={restarting ? "animate-spin" : ""} />
            {restarting ? "Reiniciando..." : "Reiniciar Bot"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["chat", "transferidos", "config", "logs"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t ? "bg-purple-600 text-white" : "bg-gray-900 text-gray-400 border border-gray-800 hover:text-white"
            }`}
          >{t === "chat" ? "Chat Demo" : t === "transferidos" ? "Chats Transferidos" : t === "config" ? "Configuración" : "Logs"}</button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden" style={{ height: "65vh" }}>
          <div className="flex items-center gap-3 p-4 bg-gray-800/60 border-b border-gray-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Magdis — POST ADG</p>
              <p className="text-xs text-green-400">En línea</p>
            </div>
          </div>
          <div className="flex flex-col h-[calc(100%-57px-64px)] overflow-y-auto p-4 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.dir === "saliente" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  m.dir === "saliente"
                    ? m.tipo === "humano"
                      ? "bg-blue-700 text-white rounded-tr-sm"
                      : "bg-purple-700 text-white rounded-tr-sm"
                    : "bg-gray-800 text-gray-100 rounded-tl-sm"
                }`}>
                  {m.dir === "saliente" && (
                    <div className="text-xs mb-1 opacity-70">{m.tipo === "humano" ? "👤 Agente" : "🤖 Magdis"}</div>
                  )}
                  <p className="text-sm leading-relaxed">{m.msg}</p>
                  <p className="text-xs opacity-50 mt-1 text-right">{m.ts}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 bg-gray-800/60 border-t border-gray-700 flex gap-2">
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendDemoMsg()}
              placeholder="Simular mensaje del cliente..."
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={sendDemoMsg}
              className="p-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Transferred Chats */}
      {activeTab === "transferidos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-bold text-white">Chats Transferidos a Humano</h3>
            {transferredChats.map(tc => (
              <button
                key={tc.id}
                onClick={() => setActiveChat(tc)}
                className={`w-full text-left bg-gray-900 border rounded-2xl p-4 transition-all hover:border-blue-500 ${activeChat?.id === tc.id ? "border-blue-500" : "border-orange-800/40"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-900/40 flex items-center justify-center">
                      <User size={14} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{tc.nombre}</p>
                      <p className="text-xs text-gray-400">{tc.numero}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full">Transferido</span>
                </div>
                <p className="text-xs text-gray-400">Motivo: {tc.motivo}</p>
                <p className="text-xs text-gray-500">Hora: {tc.hora}</p>
              </button>
            ))}
            {transferredChats.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-400 opacity-50" />
                <p>Sin chats transferidos activos</p>
              </div>
            )}
          </div>

          {activeChat && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col" style={{ height: "60vh" }}>
              <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{activeChat.nombre}</p>
                  <p className="text-xs text-gray-400">{activeChat.numero}</p>
                </div>
                <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full">Modo Humano 👤</span>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                <div className="bg-gray-800 rounded-xl p-3 text-xs text-orange-300">
                  ⚠️ El bot transfirió esta conversación. Motivo: {activeChat.motivo}
                </div>
                {messages.slice(-3).map(m => (
                  <div key={m.id} className={`flex ${m.dir === "saliente" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      m.dir === "saliente" ? "bg-blue-700 text-white" : "bg-gray-800 text-gray-100"
                    }`}>{m.msg}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-700 flex gap-2">
                <input
                  value={humanMsg}
                  onChange={e => setHumanMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendHumanReply(activeChat.id)}
                  placeholder="Responder como agente..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button onClick={() => sendHumanReply(activeChat.id)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors">
                  <Send size={15} className="text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Settings size={16} /> Credenciales Meta API</h3>
            {[
              { key: "app_id", label: "App ID de Meta" },
              { key: "phone_number_id", label: "Phone Number ID" },
              { key: "access_token", label: "Access Token", type: "password" },
              { key: "webhook_secret", label: "Webhook Secret", type: "password" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-400 font-medium mb-1 block">{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={editConfig[f.key] || ""}
                  onChange={e => setEditConfig({ ...editConfig, [f.key]: e.target.value })}
                  placeholder={`Ingresa ${f.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Estado del Bot</p>
                <p className="text-xs text-gray-400">Activar/desactivar Magdis</p>
              </div>
              <button
                onClick={() => setEditConfig({ ...editConfig, activo: !editConfig.activo })}
                className={`w-12 h-6 rounded-full transition-all relative ${editConfig.activo ? "bg-green-500" : "bg-gray-600"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${editConfig.activo ? "left-6" : "left-0.5"}`}></div>
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Bot size={16} /> Personalidad de Magdis</h3>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Saludo Inicial</label>
              <input
                value={editConfig.saludo_inicial || ""}
                onChange={e => setEditConfig({ ...editConfig, saludo_inicial: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Prompt / Comportamiento del Bot</label>
              <textarea
                value={editConfig.personalidad || ""}
                onChange={e => setEditConfig({ ...editConfig, personalidad: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none font-mono"
                placeholder="Define el comportamiento de Magdis aquí..."
              />
              <p className="text-xs text-gray-500 mt-1">Este texto define cómo responde Magdis. Usa lenguaje empático y resolutivo.</p>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save size={14} />
              {saving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2"><Activity size={16} /> Logs de Interacción</h3>
            <button onClick={handleRestart} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors">
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto font-mono">
            {logs.map((log, i) => (
              <div key={i} className={`flex items-start gap-3 text-xs p-2 rounded-lg ${
                log.type === "success" ? "bg-green-900/20 text-green-300" :
                log.type === "warning" ? "bg-yellow-900/20 text-yellow-300" :
                log.type === "error" ? "bg-red-900/20 text-red-300" :
                "bg-gray-800 text-gray-300"
              }`}>
                <span className="text-gray-500 shrink-0">[{log.time}]</span>
                <span className="shrink-0">
                  {log.type === "success" ? "✅" : log.type === "warning" ? "⚠️" : log.type === "error" ? "❌" : "ℹ️"}
                </span>
                <span>{log.event}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
