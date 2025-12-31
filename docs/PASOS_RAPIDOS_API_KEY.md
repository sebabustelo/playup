# ⚡ Pasos Rápidos: Obtener API Key de Google Maps

## 🎯 Resumen en 5 Pasos

### 1️⃣ Ir a Google Cloud Console
👉 **https://console.cloud.google.com/**

### 2️⃣ Crear/Seleccionar Proyecto
- Clic en selector de proyectos (arriba)
- "NUEVO PROYECTO" → Nombre: `PlayUp Maps` → CREAR

### 3️⃣ Habilitar APIs
Menú ☰ → **APIs y servicios** → **Biblioteca** → Buscar y habilitar:
- ✅ **Maps JavaScript API**
- ✅ **Places API**
- ✅ **Geocoding API**

### 4️⃣ Crear API Key
Menú ☰ → **APIs y servicios** → **Credenciales** → **+ CREAR CREDENCIALES** → **Clave de API**
👉 **¡COPIA LA KEY INMEDIATAMENTE!**

### 5️⃣ Configurar en Proyecto
1. Crea/edita `.env` en la raíz del proyecto:
```bash
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_copiada_aqui
```

2. Reinicia el servidor: `npm run dev`

---

## 🔗 Enlaces Directos

- **Google Cloud Console**: https://console.cloud.google.com/
- **Biblioteca de APIs**: https://console.cloud.google.com/apis/library
- **Credenciales**: https://console.cloud.google.com/apis/credentials

---

## ⚠️ Importante

- **Copia la API Key** cuando la crees (no podrás verla completa después)
- **Habilita las 3 APIs** (Maps JavaScript, Places, Geocoding)
- **Reinicia el servidor** después de agregar la API Key al `.env`

---

¿Listo? Sigue estos 5 pasos y tendrás Google Maps funcionando en 5 minutos! 🚀

