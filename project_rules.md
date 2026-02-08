# iBusiness_OS - Project Rules

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Database** | Supabase (PostgreSQL 17) |
| **Backend** | Supabase Edge Functions + RLS Policies |
| **Frontend** | Next.js 15 (App Router) |
| **Styling** | Tailwind CSS v4 |
| **Auth** | Supabase Auth |

## Project ID
- **Supabase Project**: `bscfabxrxeoplwwfzmxx`
- **Region**: `us-east-1`

---

## Core Rules

### 1. Integridad Referencial Absoluta ⚠️

> **No se puede borrar un registro si tiene dependencias asociadas.**

Implementación:
- Todas las Foreign Keys usan `ON DELETE RESTRICT`
- Antes de eliminar: validar dependencias en la aplicación
- Soft-delete preferido sobre hard-delete para datos transaccionales

Tablas protegidas:
- `tabla_productos` → No borrar si existe en `detalle_venta` o `detalle_compra`
- `tabla_bodegas` → No borrar si existe en `inventario`
- `tabla_bancos` → No borrar si existe en `movimientos_financieros`
- `tabla_ventas` → No borrar si existe en `detalle_venta` o `movimientos_financieros`
- `tabla_compras` → No borrar si existe en `detalle_compra` o `movimientos_financieros`

### 2. Auditoría Temporal

Todas las tablas incluyen:
```sql
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### 3. Row Level Security (RLS)

- RLS habilitado en todas las tablas
- Políticas públicas durante desarrollo
- Migrar a políticas basadas en `auth.uid()` antes de producción

### 4. Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Tablas | `tabla_<entidad>` (singular) | `tabla_productos` |
| Foreign Keys | `<tabla>_id` | `producto_id` |
| Timestamps | `<accion>_at` | `created_at` |
| Booleanos | `is_<estado>` o verbo pasado | `conciliado` |

---

## Database Schema

See: [implementation_plan.md](file:///Users/lucasgomez/.gemini/antigravity/brain/b21144e8-3c8a-4096-9e42-cf001c66fb92/implementation_plan.md)
