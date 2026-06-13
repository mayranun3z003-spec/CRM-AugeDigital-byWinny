import React, { useState, useEffect, useRef } from "react";
import {
  Package, Plus, Search, AlertTriangle, Upload, Download,
  Edit3, Trash2, X, CheckCircle, RefreshCw, Tag
} from "lucide-react";

const EMPTY_PRODUCT = {
  codigo: "", nombre: "", descripcion: "", categoria: "", precio: 0,
  precio_costo: 0, stock: 0, stock_minimo: 10, unidad: "Pieza",
  codigo_barras: "", activo: true, iva: 16
};

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const fileRef = useRef();

  const fetchProductos = () => {
    setLoading(true);
    fetch("/api/entities/Producto/list")
      .then(r => r.json())
      .then(d => { setProductos(d.records || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProductos(); }, []);

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

  const filtered = productos.filter(p => {
    const matchSearch = `${p.nombre} ${p.codigo} ${p.codigo_barras}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.categoria === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async () => {
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/entities/Producto/${form.id}` : "/api/entities/Producto";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setForm(EMPTY_PRODUCT);
    fetchProductos();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/entities/Producto/${id}`, { method: "DELETE" });
    fetchProductos();
  };

  // EXPORT CSV
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const headers = ["codigo", "nombre", "descripcion", "categoria", "precio", "precio_costo", "stock", "stock_minimo", "unidad", "codigo_barras", "iva"];
      const rows = productos.map(p => headers.map(h => `"${(p[h] ?? "").toString().replace(/"/g, '""')}"`).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `catalogo_productos_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  // IMPORT CSV
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      let imported = 0, errors = 0, corrected = 0;
      const errorLog = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        if (values.length < 2) continue;

        const obj = {};
        headers.forEach((h, idx) => { obj[h] = values[idx] || ""; });

        // Validate & correct
        if (!obj.nombre?.trim()) { errors++; errorLog.push(`Fila ${i + 1}: Sin nombre`); continue; }
        if (isNaN(+obj.precio) || +obj.precio < 0) { obj.precio = 0; corrected++; }
        if (isNaN(+obj.stock) || +obj.stock < 0) { obj.stock = 0; corrected++; }
        if (!obj.unidad?.trim()) { obj.unidad = "Pieza"; corrected++; }
        if (isNaN(+obj.iva)) { obj.iva = 16; corrected++; }

        const payload = {
          codigo: obj.codigo || `IMP-${Date.now()}-${i}`,
          nombre: obj.nombre.trim(),
          descripcion: obj.descripcion || "",
          categoria: obj.categoria || "Sin Categoría",
          precio: +obj.precio || 0,
          precio_costo: +obj.precio_costo || 0,
          stock: +obj.stock || 0,
          stock_minimo: +obj.stock_minimo || 10,
          unidad: obj.unidad || "Pieza",
          codigo_barras: obj.codigo_barras || "",
          iva: +obj.iva || 16,
          activo: true
        };

        const existing = productos.find(p => p.codigo === payload.codigo);
        if (existing) {
          await fetch(`/api/entities/Producto/${existing.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
          });
        } else {
          await fetch("/api/entities/Producto", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
          });
        }
        imported++;
      }

      setImportResult({ imported, errors, corrected, errorLog });
      fetchProductos();
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImportLoading(false);
      fileRef.current.value = "";
    }
  };

  const stockBajoCount = productos.filter(p => p.stock <= p.stock_minimo).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Inventario & Catálogo</h2>
          <p className="text-sm text-gray-400">{productos.length} productos | {stockBajoCount} con stock bajo</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_PRODUCT); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      {/* Stock Alert Banner */}
      {stockBajoCount > 0 && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/40 rounded-xl p-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-300">{stockBajoCount} productos con stock bajo o agotado</p>
            <p className="text-xs text-gray-400">
              {productos.filter(p => p.stock <= p.stock_minimo).map(p => p.nombre).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Import/Export Bar */}
      <div className="flex gap-3 flex-wrap">
        <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
        >
          {importLoading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
          {importLoading ? "Importando..." : "Importar CSV"}
        </button>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
        >
          {exportLoading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
          {exportLoading ? "Exportando..." : "Exportar CSV"}
        </button>
        <div className="text-xs text-gray-500 flex items-center">
          Importar: detecta y corrige errores automáticamente según la base de datos
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-xl p-4 border text-sm ${importResult.error ? "bg-red-900/20 border-red-800/40 text-red-300" : "bg-green-900/20 border-green-800/40 text-green-300"}`}>
          {importResult.error ? (
            <p>❌ Error: {importResult.error}</p>
          ) : (
            <div>
              <p className="font-semibold">✅ Importación completada</p>
              <p>• {importResult.imported} productos importados</p>
              <p>• {importResult.corrected} correcciones automáticas</p>
              <p>• {importResult.errors} filas con errores omitidas</p>
              {importResult.errorLog?.map((e, i) => <p key={i} className="text-xs text-gray-400">{e}</p>)}
            </div>
          )}
          <button onClick={() => setImportResult(null)} className="mt-2 text-xs underline text-gray-400">Cerrar</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto, código, barras..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 text-center py-8 text-gray-400">Cargando...</div>
        ) : filtered.map(p => {
          const stockBajo = p.stock <= p.stock_minimo;
          const margen = p.precio_costo > 0 ? (((p.precio - p.precio_costo) / p.precio_costo) * 100).toFixed(0) : null;

          return (
            <div key={p.id} className={`bg-gray-900 border rounded-2xl p-4 hover:border-gray-600 transition-all ${stockBajo ? "border-red-800/50" : "border-gray-800"}`}>
              {stockBajo && (
                <div className="flex items-center gap-1 mb-2">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="text-xs text-red-400 font-semibold">Stock Bajo</span>
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                  <Package size={18} className="text-blue-400" />
                </div>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-lg">{p.codigo}</span>
              </div>
              <h3 className="font-bold text-white text-sm leading-tight mb-0.5">{p.nombre}</h3>
              <p className="text-xs text-gray-400 mb-2 line-clamp-1">{p.descripcion}</p>
              <div className="flex items-center gap-2 mb-2">
                <Tag size={11} className="text-gray-500" />
                <span className="text-xs text-gray-400">{p.categoria}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mb-3">
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-sm font-black text-white">${(p.precio || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Precio</div>
                </div>
                <div className={`rounded-lg p-2 ${stockBajo ? "bg-red-900/30" : "bg-gray-800"}`}>
                  <div className={`text-sm font-black ${stockBajo ? "text-red-400" : "text-white"}`}>{p.stock}</div>
                  <div className="text-xs text-gray-400">Stock</div>
                </div>
              </div>
              {margen && (
                <div className="text-xs text-green-400 mb-2">Margen: {margen}%</div>
              )}
              <div className="flex gap-1">
                <button
                  onClick={() => { setForm({ ...p }); setShowForm(true); }}
                  className="flex-1 py-1.5 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                ><Edit3 size={11} /> Editar</button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg transition-all"
                ><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{form.id ? "Editar Producto" : "Nuevo Producto"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {[
                { key: "codigo", label: "Código" },
                { key: "nombre", label: "Nombre *" },
                { key: "categoria", label: "Categoría" },
                { key: "unidad", label: "Unidad de Medida" },
                { key: "precio", label: "Precio Venta $", type: "number" },
                { key: "precio_costo", label: "Precio Costo $", type: "number" },
                { key: "stock", label: "Stock Actual", type: "number" },
                { key: "stock_minimo", label: "Stock Mínimo", type: "number" },
                { key: "codigo_barras", label: "Código de Barras" },
                { key: "proveedor", label: "Proveedor" },
                { key: "iva", label: "IVA %", type: "number" },
              ].map(f => (
                <div key={f.key} className={`flex flex-col gap-1 ${f.key === "nombre" ? "col-span-2" : ""}`}>
                  <label className="text-xs text-gray-400 font-medium">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={form[f.key] ?? ""}
                    onChange={e => setForm({ ...form, [f.key]: f.type === "number" ? +e.target.value : e.target.value })}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs text-gray-400 font-medium">Descripción</label>
                <textarea
                  value={form.descripcion || ""}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-800 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">Guardar Producto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
