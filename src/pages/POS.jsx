import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  CreditCard, Banknote, Smartphone, Printer, CheckCircle,
  X, Package, AlertTriangle, RotateCcw, Store, Tag,
  Receipt, History, Settings, ChevronDown, BarChart2,
  Scan, User, Hash, Clock, Download
} from "lucide-react";

/* ─── helpers ─── */
const fmt = (v) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v || 0);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const genNum = () =>
  `PED-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

/* ─── métodos de pago ─── */
const METODOS = [
  { value: "Efectivo",      icon: Banknote,    color: "text-green-400"  },
  { value: "Tarjeta",       icon: CreditCard,  color: "text-blue-400"   },
  { value: "Transferencia", icon: Smartphone,  color: "text-purple-400" },
];

/* ═══════════════════════════════════════════════════════════ */
export default function POS({ setOrderAlert, addNotification }) {
  /* ── datos ── */
  const [productos,   setProductos]   = useState([]);
  const [sucursales,  setSucursales]  = useState([]);
  const [historial,   setHistorial]   = useState([]);
  const [clientes,    setClientes]    = useState([]);

  /* ── UI ── */
  const [activeTab,     setActiveTab]     = useState("venta");   // venta | historial | reportes
  const [sucursalId,    setSucursalId]    = useState("");
  const [search,        setSearch]        = useState("");
  const [catFilter,     setCatFilter]     = useState("");
  const [barcode,       setBarcode]       = useState("");
  const [barcodeMsg,    setBarcodeMsg]    = useState("");

  /* ── carrito ── */
  const [carrito,       setCarrito]       = useState([]);
  const [clienteId,     setClienteId]     = useState("");
  const [metodoPago,    setMetodoPago]    = useState("Efectivo");
  const [descuento,     setDescuento]     = useState(0);
  const [notas,         setNotas]         = useState("");

  /* ── proceso ── */
  const [loading,       setLoading]       = useState(false);
  const [ticket,        setTicket]        = useState(null);
  const [efectivoRecib, setEfectivoRecib] = useState("");

  const barcodeRef = useRef();

  /* ════════ CARGA ════════ */
  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/entities/Producto/list").then(r => r.json()),
      fetch("/api/entities/Sucursal/list").then(r => r.json()),
      fetch("/api/entities/Pedido/list").then(r => r.json()),
      fetch("/api/entities/Cliente/list").then(r => r.json()),
    ]).then(([pr, su, pe, cl]) => {
      setProductos(pr.records?.filter(p => p.activo !== false) || []);
      const sl = su.records || [];
      setSucursales(sl);
      if (sl.length && !sucursalId) setSucursalId(sl[0].id);
      setHistorial((pe.records || []).filter(p => p.canal === "POS").slice(0, 50));
      setClientes(cl.records || []);
    });
  }, [sucursalId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ════════ CATÁLOGO FILTRADO ════════ */
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

  const filtrados = productos.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.nombre?.toLowerCase().includes(q)
      || p.codigo?.toLowerCase().includes(q)
      || p.descripcion?.toLowerCase().includes(q)
      || p.codigo_barras?.includes(q);
    const matchCat = !catFilter || p.categoria === catFilter;
    return matchQ && matchCat;
  });

  /* ════════ ESCÁNER ════════ */
  const buscarBarcode = () => {
    const val = barcode.trim();
    if (!val) return;
    const prod = productos.find(p =>
      p.codigo_barras === val || p.codigo === val
    );
    if (prod) {
      agregarAlCarrito(prod);
      setBarcodeMsg(`✅ ${prod.nombre} agregado`);
    } else {
      setBarcodeMsg(`❌ Código "${val}" no encontrado`);
    }
    setBarcode("");
    setTimeout(() => setBarcodeMsg(""), 2500);
  };

  /* ════════ CARRITO ════════ */
  const agregarAlCarrito = (prod) => {
    if (prod.stock <= 0) { setBarcodeMsg("❌ Sin stock"); return; }
    setCarrito(prev => {
      const idx = prev.findIndex(i => i.id === prod.id);
      if (idx >= 0) {
        const item = prev[idx];
        if (item.cantidad >= prod.stock) { setBarcodeMsg("❌ Stock insuficiente"); return prev; }
        return prev.map((i, k) => k === idx ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { ...prod, cantidad: 1, precioUnitario: prod.precio }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const prod = productos.find(p => p.id === id);
        const nq = i.cantidad + delta;
        if (nq <= 0) return null;
        if (prod && nq > prod.stock) return i;
        return { ...i, cantidad: nq };
      }).filter(Boolean)
    );
  };

  const cambiarPrecio = (id, precio) => {
    setCarrito(prev =>
      prev.map(i => i.id === id ? { ...i, precioUnitario: parseFloat(precio) || 0 } : i)
    );
  };

  const quitarItem = (id) => setCarrito(prev => prev.filter(i => i.id !== id));
  const limpiarCarrito = () => { setCarrito([]); setDescuento(0); setClienteId(""); setNotas(""); setEfectivoRecib(""); };

  /* ════════ TOTALES ════════ */
  const subtotal     = carrito.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);
  const descuentoAmt = subtotal * (descuento / 100);
  const baseIva      = subtotal - descuentoAmt;
  const ivaAmt       = baseIva * 0.16;
  const total        = baseIva + ivaAmt;
  const cambio       = efectivoRecib ? Math.max(0, parseFloat(efectivoRecib) - total) : 0;
  const itemsCount   = carrito.reduce((s, i) => s + i.cantidad, 0);

  /* ════════ PROCESAR VENTA ════════ */
  const procesarVenta = async () => {
    if (carrito.length === 0) return;
    setLoading(true);
    try {
      const num = genNum();
      const pedido = {
        numero_pedido: num,
        cliente_id: clienteId || undefined,
        items: carrito.map(i => ({
          producto_id:    i.id,
          nombre:         i.nombre,
          codigo:         i.codigo,
          cantidad:       i.cantidad,
          precio_unitario: i.precioUnitario,
          subtotal:       i.precioUnitario * i.cantidad,
        })),
        subtotal,
        descuento: descuentoAmt,
        iva:       ivaAmt,
        total,
        estado:       "Confirmado",
        canal:        "POS",
        sucursal_id:  sucursalId,
        metodo_pago:  metodoPago,
        notas,
      };

      const res  = await fetch("/api/entities/Pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
      });
      const data = await res.json();

      /* descuento de stock */
      await Promise.all(carrito.map(item => {
        const prod = productos.find(p => p.id === item.id);
        if (!prod) return Promise.resolve();
        return fetch(`/api/entities/Producto/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: Math.max(0, prod.stock - item.cantidad) }),
        });
      }));

      /* actualizar total_compras del cliente */
      if (clienteId) {
        const cl = clientes.find(c => c.id === clienteId);
        if (cl) {
          await fetch(`/api/entities/Cliente/${clienteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              total_compras:       (cl.total_compras || 0) + total,
              ultima_interaccion:  new Date().toISOString(),
            }),
          });
        }
      }

      const ticketData = {
        ...pedido,
        id:           data.id || data.record?.id,
        efectivo:     efectivoRecib ? parseFloat(efectivoRecib) : null,
        cambio,
        fecha:        new Date().toISOString(),
        sucursal:     sucursales.find(s => s.id === sucursalId)?.nombre || "Sucursal",
        cliente:      clientes.find(c => c.id === clienteId)?.nombre || "Cliente general",
      };

      setTicket(ticketData);
      setOrderAlert?.({ numero: num, cliente: ticketData.cliente, total, canal: "POS Presencial" });
      addNotification?.(`🛒 Venta POS ${num} — ${fmt(total)}`);
      fetchData();
      limpiarCarrito();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ════════ EXPORTAR HISTORIAL ════════ */
  const exportarHistorial = () => {
    const headers = ["Número", "Total", "Estado", "Método Pago", "Canal", "Fecha"];
    const rows = historial.map(p => [
      p.numero_pedido, p.total, p.estado, p.metodo_pago, p.canal, p.created_date
    ].map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ventas_pos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ════════ REPORTE ════════ */
  const ventasHoy    = historial.filter(p => {
    const d = p.created_date ? new Date(p.created_date) : null;
    if (!d) return false;
    const hoy = new Date();
    return d.toDateString() === hoy.toDateString();
  });
  const totalHoy     = ventasHoy.reduce((s, p) => s + (p.total || 0), 0);
  const totalMes     = historial.reduce((s, p) => s + (p.total || 0), 0);

  const sucursalNombre = sucursales.find(s => s.id === sucursalId)?.nombre || "Sucursal";
  const clienteNombre  = clienteId
    ? clientes.find(c => c.id === clienteId)?.nombre + " " + (clientes.find(c => c.id === clienteId)?.apellido || "")
    : "";

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="flex flex-col h-full">

      {/* ── Top bar POS ── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Store size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-tight">Punto de Venta</p>
            <p className="text-xs text-gray-400">{sucursalNombre}</p>
          </div>
        </div>

        {/* Selector sucursal */}
        <select
          value={sucursalId}
          onChange={e => setSucursalId(e.target.value)}
          className="ml-2 text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300"
        >
          {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>

        {/* Tabs */}
        <div className="flex gap-1 ml-4">
          {[
            { id: "venta",    label: "Venta",    icon: ShoppingCart },
            { id: "historial",label: "Historial", icon: History },
            { id: "reportes", label: "Reportes",  icon: BarChart2 },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === t.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              <t.icon size={12} />{t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          Ventas hoy: <span className="text-green-400 font-bold">{fmt(totalHoy)}</span>
        </div>
      </div>

      {/* ══════════ TAB: VENTA ══════════ */}
      {activeTab === "venta" && (
        <div className="flex flex-1 min-h-0">

          {/* ── Izquierda: Catálogo ── */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800">

            {/* Buscadores */}
            <div className="p-3 bg-gray-900 border-b border-gray-800 space-y-2">

              {/* Escáner de barras */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Scan size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    ref={barcodeRef}
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && buscarBarcode()}
                    placeholder="Escanear / escribir código de barras → Enter"
                    className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-blue-600/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={buscarBarcode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-colors"
                >
                  <Scan size={15} />
                </button>
              </div>

              {barcodeMsg && (
                <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${barcodeMsg.startsWith("✅") ? "bg-green-900/40 text-green-300" : "bg-red-900/40 text-red-300"}`}>
                  {barcodeMsg}
                </div>
              )}

              {/* Búsqueda manual */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, código, descripción..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Filtro categoría */}
                <select
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  className="text-xs bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-gray-300"
                >
                  <option value="">Todas</option>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Grid de productos */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filtrados.map(p => {
                  const enCarrito = carrito.find(i => i.id === p.id);
                  const agotado   = p.stock <= 0;
                  const stockBajo = !agotado && p.stock <= p.stock_minimo;
                  return (
                    <button
                      key={p.id}
                      onClick={() => !agotado && agregarAlCarrito(p)}
                      disabled={agotado}
                      className={`relative text-left rounded-2xl p-3 border transition-all
                        ${agotado
                          ? "opacity-40 cursor-not-allowed bg-gray-900 border-gray-800"
                          : enCarrito
                            ? "bg-blue-900/20 border-blue-500 shadow-lg shadow-blue-500/10"
                            : "bg-gray-900 border-gray-800 hover:border-gray-500 hover:bg-gray-800/60"
                        }`}
                    >
                      {/* Badge cantidad en carrito */}
                      {enCarrito && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-black text-white z-10 shadow">
                          {enCarrito.cantidad}
                        </div>
                      )}
                      {/* Alerta stock bajo */}
                      {stockBajo && (
                        <div className="absolute top-1.5 left-1.5">
                          <AlertTriangle size={10} className="text-yellow-400" />
                        </div>
                      )}

                      <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center mb-2 mx-auto">
                        <Package size={14} className="text-gray-400" />
                      </div>
                      <p className="text-xs font-semibold text-white leading-tight line-clamp-2 text-center">{p.nombre}</p>
                      <p className="text-xs text-gray-500 text-center mt-0.5">{p.codigo}</p>
                      <div className="mt-2 text-center">
                        <p className="text-sm font-black text-blue-400">{fmt(p.precio)}</p>
                        <p className={`text-xs ${agotado ? "text-red-400" : stockBajo ? "text-yellow-400" : "text-gray-500"}`}>
                          {agotado ? "Agotado" : `${p.stock} uds`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filtrados.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Package size={36} className="mx-auto mb-2 opacity-20" />
                  <p>Sin productos{search ? ` para "${search}"` : ""}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Derecha: Carrito + Cobro ── */}
          <div className="w-80 xl:w-96 flex flex-col bg-gray-900 shrink-0">

            {/* Header carrito */}
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-blue-400" />
                <span className="font-bold text-white text-sm">Carrito</span>
                <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{itemsCount}</span>
              </div>
              {carrito.length > 0 && (
                <button onClick={limpiarCarrito} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                  <RotateCcw size={11} /> Limpiar
                </button>
              )}
            </div>

            {/* Cliente opcional */}
            <div className="px-3 pt-2 pb-1">
              <div className="flex items-center gap-2">
                <User size={13} className="text-gray-400 shrink-0" />
                <select
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                  className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300"
                >
                  <option value="">Cliente general</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {carrito.length === 0 ? (
                <div className="text-center py-10 text-gray-600">
                  <ShoppingCart size={30} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Carrito vacío</p>
                  <p className="text-xs mt-1">Escanea o selecciona productos</p>
                </div>
              ) : carrito.map(item => (
                <div key={item.id} className="bg-gray-800 rounded-xl p-2.5 border border-gray-700">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.nombre}</p>
                      <p className="text-xs text-gray-500">{item.codigo}</p>
                    </div>
                    <button onClick={() => quitarItem(item.id)} className="text-gray-500 hover:text-red-400 transition-colors shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    {/* Cantidad */}
                    <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-0.5">
                      <button
                        onClick={() => cambiarCantidad(item.id, -1)}
                        className="w-5 h-5 rounded bg-gray-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                      ><Minus size={10} className="text-white" /></button>
                      <span className="text-xs font-bold text-white w-5 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.id, 1)}
                        className="w-5 h-5 rounded bg-gray-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                      ><Plus size={10} className="text-white" /></button>
                    </div>
                    {/* Precio editable */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">$</span>
                      <input
                        type="number"
                        value={item.precioUnitario}
                        onChange={e => cambiarPrecio(item.id, e.target.value)}
                        className="w-16 text-xs text-white bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-right focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-sm font-black text-blue-400 shrink-0">
                      {fmt(item.precioUnitario * item.cantidad)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales + cobro */}
            {carrito.length > 0 && (
              <div className="p-3 border-t border-gray-800 space-y-3">

                {/* Descuento */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Tag size={12} />
                    <span>Descuento</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={0} max={100}
                      value={descuento}
                      onChange={e => setDescuento(Math.min(100, Math.max(0, +e.target.value)))}
                      className="w-12 text-right px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-gray-800 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span><span>{fmt(subtotal)}</span>
                  </div>
                  {descuentoAmt > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Descuento ({descuento}%)</span><span>-{fmt(descuentoAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>IVA (16%)</span><span>{fmt(ivaAmt)}</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-sm border-t border-gray-700 pt-1.5">
                    <span>TOTAL ({itemsCount} arts.)</span><span className="text-blue-400">{fmt(total)}</span>
                  </div>
                </div>

                {/* Método de pago */}
                <div className="grid grid-cols-3 gap-1.5">
                  {METODOS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMetodoPago(m.value)}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        metodoPago === m.value
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      <m.icon size={13} />
                      {m.value}
                    </button>
                  ))}
                </div>

                {/* Efectivo recibido (cambio) */}
                {metodoPago === "Efectivo" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 shrink-0">Recibido $</span>
                    <input
                      type="number"
                      value={efectivoRecib}
                      onChange={e => setEfectivoRecib(e.target.value)}
                      placeholder={fmt(total).replace("$", "")}
                      className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />
                    {efectivoRecib && (
                      <span className={`text-sm font-black shrink-0 ${cambio >= 0 ? "text-green-400" : "text-red-400"}`}>
                        Cambio: {fmt(cambio)}
                      </span>
                    )}
                  </div>
                )}

                {/* Notas */}
                <input
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Notas del pedido (opcional)..."
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />

                {/* COBRAR */}
                <button
                  onClick={procesarVenta}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 rounded-2xl text-sm font-black text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Procesando...</>
                  ) : (
                    <><Receipt size={15} /> Cobrar {fmt(total)}</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ TAB: HISTORIAL ══════════ */}
      {activeTab === "historial" && (
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Historial de Ventas POS</h3>
            <button
              onClick={exportarHistorial}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-medium transition-colors"
            >
              <Download size={13} /> Exportar CSV
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/40">
                  {["#Pedido", "Sucursal", "Cliente", "Método", "Total", "Estado", "Fecha"].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 font-semibold px-4 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {historial.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
                      <History size={28} className="mx-auto mb-2 opacity-20" />
                      <p>Sin ventas POS registradas</p>
                    </td>
                  </tr>
                ) : historial.map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{p.numero_pedido}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {sucursales.find(s => s.id === p.sucursal_id)?.nombre || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {p.cliente_id
                        ? (clientes.find(c => c.id === p.cliente_id)?.nombre || "—")
                        : <span className="text-gray-600 italic">General</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{p.metodo_pago}</td>
                    <td className="px-4 py-3 font-black text-blue-400">{fmt(p.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        p.estado === "Entregado"  ? "bg-green-900/40 text-green-400" :
                        p.estado === "Confirmado" ? "bg-blue-900/40 text-blue-400"  :
                        "bg-yellow-900/40 text-yellow-400"
                      }`}>{p.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(p.created_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ TAB: REPORTES ══════════ */}
      {activeTab === "reportes" && (
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          <h3 className="font-bold text-white">Reportes POS</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Ventas Hoy",       value: fmt(totalHoy),           sub: `${ventasHoy.length} transacciones`,   color: "text-green-400" },
              { label: "Ventas del Mes",   value: fmt(totalMes),           sub: `${historial.length} transacciones`,   color: "text-blue-400" },
              { label: "Ticket Promedio",  value: historial.length > 0 ? fmt(totalMes / historial.length) : "$0", sub: "Por transacción", color: "text-purple-400" },
              { label: "Productos en Stock", value: productos.reduce((s, p) => s + (p.stock || 0), 0), sub: `${productos.filter(p => p.stock <= p.stock_minimo).length} con alerta`, color: "text-yellow-400" },
            ].map(r => (
              <div key={r.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className={`text-xl font-black ${r.color}`}>{r.value}</div>
                <div className="text-sm font-semibold text-white mt-0.5">{r.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.sub}</div>
              </div>
            ))}
          </div>

          {/* Desglose por método de pago */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h4 className="font-bold text-white mb-4">Ventas por Método de Pago</h4>
            <div className="grid grid-cols-3 gap-3">
              {METODOS.map(m => {
                const total_m = historial
                  .filter(p => p.metodo_pago === m.value)
                  .reduce((s, p) => s + (p.total || 0), 0);
                const count = historial.filter(p => p.metodo_pago === m.value).length;
                return (
                  <div key={m.value} className="bg-gray-800 rounded-xl p-4 text-center">
                    <m.icon size={20} className={`${m.color} mx-auto mb-2`} />
                    <div className={`text-lg font-black ${m.color}`}>{fmt(total_m)}</div>
                    <div className="text-xs font-semibold text-white">{m.value}</div>
                    <div className="text-xs text-gray-400">{count} transacciones</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Productos más vendidos */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h4 className="font-bold text-white mb-4">Productos Más Vendidos (POS)</h4>
            <div className="space-y-2">
              {(() => {
                const counts = {};
                historial.forEach(p => {
                  (p.items || []).forEach(item => {
                    counts[item.nombre] = (counts[item.nombre] || 0) + item.cantidad;
                  });
                });
                return Object.entries(counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([nombre, qty], i) => (
                    <div key={nombre} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-gray-700 text-xs flex items-center justify-center text-gray-300 font-bold shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-gray-200 truncate">{nombre}</span>
                          <span className="text-blue-400 font-bold shrink-0">{qty} uds</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full">
                          <div
                            className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, (qty / (Object.values(counts)[0] || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ));
              })()}
              {historial.every(p => !p.items?.length) && (
                <p className="text-xs text-gray-500 text-center py-2">Sin datos suficientes</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: TICKET ══════════ */}
      {ticket && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-green-700/50 rounded-2xl w-full max-w-sm shadow-2xl shadow-green-500/10">

            {/* Header ticket */}
            <div className="p-5 text-center border-b border-gray-800">
              <div className="w-14 h-14 rounded-full bg-green-900/30 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-lg font-black text-white">¡Venta Exitosa!</h3>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(ticket.fecha)}</p>
            </div>

            {/* Cuerpo ticket estilo recibo */}
            <div className="p-5 font-mono text-xs space-y-1">
              <div className="text-center mb-3">
                <p className="font-black text-white text-sm">CRM POST ADG</p>
                <p className="text-gray-400">Lerdo De Tejada 9 int 2</p>
                <p className="text-gray-400">Col. Agricola Independencia</p>
                <p className="text-gray-400">Tel: 814 430 9631</p>
              </div>

              <div className="border-t border-dashed border-gray-700 my-2"></div>

              <div className="flex justify-between text-gray-300">
                <span>Pedido:</span><span className="font-bold text-white">{ticket.numero_pedido}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Sucursal:</span><span>{ticket.sucursal}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Cliente:</span><span>{ticket.cliente}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Pago:</span><span>{ticket.metodo_pago}</span>
              </div>

              <div className="border-t border-dashed border-gray-700 my-2"></div>

              {(ticket.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-gray-300">
                  <span className="truncate max-w-[150px]">{item.cantidad}x {item.nombre}</span>
                  <span>{fmt(item.subtotal)}</span>
                </div>
              ))}

              <div className="border-t border-dashed border-gray-700 my-2"></div>

              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span><span>{fmt(ticket.subtotal)}</span>
              </div>
              {ticket.descuento > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Descuento</span><span>-{fmt(ticket.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>IVA (16%)</span><span>{fmt(ticket.iva)}</span>
              </div>
              <div className="flex justify-between text-blue-400 font-black text-sm mt-1">
                <span>TOTAL</span><span>{fmt(ticket.total)}</span>
              </div>
              {ticket.efectivo && (
                <>
                  <div className="flex justify-between text-gray-400">
                    <span>Efectivo</span><span>{fmt(ticket.efectivo)}</span>
                  </div>
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>Cambio</span><span>{fmt(ticket.cambio)}</span>
                  </div>
                </>
              )}

              <div className="border-t border-dashed border-gray-700 my-2"></div>
              <p className="text-center text-gray-500">¡Gracias por su compra!</p>
            </div>

            {/* Botones */}
            <div className="p-4 border-t border-gray-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-semibold text-gray-300 transition-colors"
              >
                <Printer size={13} /> Imprimir
              </button>
              <button
                onClick={() => setTicket(null)}
                className="py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition-colors"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
