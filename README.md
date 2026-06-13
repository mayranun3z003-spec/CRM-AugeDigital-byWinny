# 🏪 CRM POST ADG
### Sistema CRM Integral — Propiedad de Jhonny Gallardo
**Lerdo De Tejada 9 int 2, Col. Agricola Independencia (Chinitos)**  
📞 814 430 9631

---

## 📦 Módulos del Sistema

| Módulo | Descripción |
|---|---|
| 📊 **Dashboard** | KPIs en tiempo real, gráficas y alertas |
| 👥 **Clientes** | Perfiles, historial de interacciones, segmentación VIP/Frecuente/Nuevo |
| 💰 **Ventas** | Pipeline Kanban, oportunidades, reportes por periodo |
| 📦 **Inventario** | Catálogo, stock, alertas, importar/exportar CSV |
| 🛒 **POS** | Punto de venta presencial, escáner de barras, ticket, multi-sucursal |
| 🎫 **Soporte** | Tickets, SLA, consulta de estatus de pedido |
| 📣 **Marketing** | Campañas Email/SMS/WhatsApp, métricas de conversión |
| 🤖 **Bot Magdis** | Integración Meta API, chat WhatsApp, logs, chats transferidos |
| ⚡ **Workflows** | Automatizaciones con plantillas (bienvenida, alertas, seguimiento) |

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + Tailwind CSS
- **Gráficas:** Recharts
- **Iconos:** Lucide React
- **Backend / DB:** Base44 (entities, CRUD, automations)
- **Bot:** Meta WhatsApp Business API

---

## 🚀 Estructura del Proyecto

```
src/
├── App.jsx                  # Navegación principal + layout
└── pages/
    ├── Dashboard.jsx        # KPIs + gráficas
    ├── Clientes.jsx         # Gestión de clientes
    ├── Ventas.jsx           # Pipeline de ventas
    ├── Inventario.jsx       # Catálogo e inventario
    ├── Marketing.jsx        # Campañas de marketing
    ├── Soporte.jsx          # Tickets de soporte
    ├── BotMagdis.jsx        # Panel del bot Magdis
    ├── POS.jsx              # Punto de venta
    └── Workflows.jsx        # Automatizaciones
```

---

## 🗄️ Entidades de Base de Datos

- `Cliente` — Perfiles de clientes con segmentación
- `Interaccion` — Historial de interacciones por cliente
- `Producto` — Catálogo con precios y stock
- `Pedido` — Órdenes de venta (POS + Bot + Web)
- `Oportunidad` — Pipeline de ventas
- `Ticket` — Incidencias de soporte
- `Campana` — Campañas de marketing
- `Sucursal` — Multi-sucursales
- `BotConfig` — Configuración del bot Magdis
- `BotMensaje` — Mensajes del bot
- `Workflow` — Reglas de automatización

---

## 🤖 Bot Magdis

Asistente virtual con personalidad empática y resolutiva, integrado con WhatsApp Business API.  
Funcionalidades:
- Consulta de productos y precios
- Registro automático de pedidos
- Transferencia a agente humano
- Logs de interacción

---

## 👤 Desarrollado por

**AugeDigital By Gallardo**  
CRM POST ADG © 2026 — Todos los derechos reservados
