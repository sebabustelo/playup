# 🗺️ Configuración de Google Maps para PlayUp

## 📋 APIs Necesarias

Para usar Google Maps en PlayUp necesitas habilitar estas APIs:

1. **Maps JavaScript API** - Para mostrar mapas
2. **Places API** - Para autocompletado de direcciones
3. **Geocoding API** - Para convertir direcciones a coordenadas (lat/lng)

---

## 🔑 Paso 1: Obtener API Key de Google Maps

### 1.1. Ir a Google Cloud Console
1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **"APIs y servicios"** → **"Biblioteca"**

### 1.2. Habilitar APIs Necesarias
Habilita estas APIs:
- ✅ **Maps JavaScript API**
- ✅ **Places API**
- ✅ **Geocoding API**

### 1.3. Crear API Key
1. Ve a **"APIs y servicios"** → **"Credenciales"**
2. Haz clic en **"Crear credenciales"** → **"Clave de API"**
3. Copia la API Key generada
4. (Opcional) Restringe la API Key:
   - **Restricciones de aplicación**: Restringe a tu dominio
   - **Restricciones de API**: Solo Maps JavaScript API, Places API, Geocoding API

---

## 🔧 Paso 2: Configurar en el Proyecto

### 2.1. Agregar API Key a Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```bash
# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 2.2. Agregar al .gitignore

Asegúrate de que `.env` esté en `.gitignore` (ya debería estar).

---

## 📦 Paso 3: Instalar Dependencias

```bash
npm install @react-google-maps/api
```

---

## ✅ Paso 4: Verificar Configuración

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Ve a Admin → Gestionar Predios
3. Al crear/editar un predio, deberías ver:
   - Campo de dirección con autocompletado
   - Botón para abrir mapa
   - Latitud y longitud se llenan automáticamente

---

## 💰 Costos

**Nota importante sobre costos:**
- Google Maps tiene un plan gratuito con límites mensuales
- **Gratis**: $200 USD de crédito mensual (aproximadamente):
  - Maps JavaScript API: $7 por 1,000 cargas
  - Places API: $17 por 1,000 solicitudes
  - Geocoding API: $5 por 1,000 solicitudes
- Después del crédito gratuito, se cobra por uso

**Recomendaciones:**
- Restringe la API Key a tu dominio
- Implementa caché para evitar solicitudes duplicadas
- Monitorea el uso en Google Cloud Console

---

## 🆘 Solución de Problemas

### Error: "This API key is not authorized"
**Solución**: Verifica que las APIs estén habilitadas en Google Cloud Console

### Error: "RefererNotAllowedMapError"
**Solución**: Agrega tu dominio a las restricciones de la API Key

### El mapa no carga
**Solución**: 
1. Verifica que la API Key esté correcta en `.env`
2. Verifica que Maps JavaScript API esté habilitada
3. Revisa la consola del navegador para errores específicos

---

## 📚 Recursos

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [React Google Maps](https://react-google-maps-api-docs.netlify.app/)

