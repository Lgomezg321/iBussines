# iBusiness OS - ERP System

Sistema ERP integrado de Ventas, Inventario, Compras, Gastos y Bancos. Desarrollado como Progressive Web App (PWA) para una experiencia nativa en dispositivos móviles.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Base de Datos**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS v4
- **Iconos**: Lucide React
- **PWA**: Manifest + Service Worker Ready

## 📦 Módulos

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Métricas en tiempo real y alertas |
| Ventas | Creación de ventas, historial, estadísticas |
| Inventarios | CRUD de productos, stock por bodega |
| Compras | Órdenes de compra, backorders, recepción |
| Gastos | Registro de gastos con deducción bancaria |
| Bancos | Conciliación bancaria automática con CSV |

## 🛠️ Instalación Local

```bash
# Clonar repositorio
git clone <repo-url>
cd iBusiness_OS/app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

## 🌐 Variables de Entorno

Crear archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📱 PWA

La app está configurada como Progressive Web App:

- **Instalable**: Añade a pantalla de inicio desde el navegador
- **Standalone**: Sin barra de navegación del navegador
- **Responsive**: Navegación adaptada a móvil (bottom navigation)

## 🚀 Despliegue en Vercel

### Opción 1: Deploy automático

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo)

### Opción 2: CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd app
vercel

# Producción
vercel --prod
```

### Configuración en Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com) e importa el repositorio
2. **Root Directory**: `app`
3. **Framework Preset**: Next.js
4. **Environment Variables**: Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

## 🧪 Build de Producción

```bash
# Test de build local
npm run build

# Preview de producción
npm run start
```

## 📁 Estructura del Proyecto

```
app/
├── public/
│   ├── icons/          # Iconos PWA
│   └── manifest.json   # PWA Manifest
├── src/
│   ├── app/
│   │   ├── ventas/
│   │   ├── inventarios/
│   │   ├── compras/
│   │   ├── gastos/
│   │   ├── bancos/
│   │   ├── layout.tsx
│   │   └── page.tsx    # Dashboard
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   └── Toast.tsx
│   └── lib/
│       ├── supabase.ts
│       └── utils.ts
└── package.json
```

## 📄 Licencia

Propietario - ANIGRAVITY 2026
