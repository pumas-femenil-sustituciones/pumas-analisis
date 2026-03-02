# Scouting Dashboard — Pumas Femenil

Dashboard interactivo de scouting táctico para Liga MX Femenil.

## Stack
- React 18 + Vite
- Recharts
- Deploy: Vercel

## Desarrollo local
```bash
cd dashboard
npm install
npm run dev
```

## Deploy en Vercel
1. Conectar repo en vercel.com
2. **Root Directory**: `dashboard`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. Deploy automático en cada push a `main`

## Actualizar datos cada jornada
Editar el bloque `DATA` en `src/App.jsx` con los nuevos valores del equipo analizado.
