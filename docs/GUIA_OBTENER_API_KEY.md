# 🔑 Guía Paso a Paso: Obtener API Key de Google Maps

## 📋 Requisitos Previos

- Una cuenta de Google (Gmail)
- Acceso a Google Cloud Console

---

## 🚀 Paso 1: Acceder a Google Cloud Console

1. **Abre tu navegador** y ve a: **https://console.cloud.google.com/**
2. **Inicia sesión** con tu cuenta de Google
3. Si es la primera vez, acepta los términos y condiciones

---

## 📁 Paso 2: Crear o Seleccionar un Proyecto

### Opción A: Crear un Nuevo Proyecto (Recomendado)

1. En la parte superior, haz clic en el **selector de proyectos** (donde dice "Seleccionar un proyecto")
2. Haz clic en **"NUEVO PROYECTO"**
3. Completa:
   - **Nombre del proyecto**: `PlayUp Maps` (o el que prefieras)
   - **Organización**: Déjalo como está (si aparece)
4. Haz clic en **"CREAR"**
5. Espera unos segundos mientras se crea el proyecto
6. **Selecciona el proyecto** recién creado desde el selector

### Opción B: Usar un Proyecto Existente

1. Si ya tienes un proyecto, selecciónalo desde el selector de proyectos

---

## 🔌 Paso 3: Habilitar las APIs Necesarias

### 3.1. Ir a la Biblioteca de APIs

1. En el menú lateral izquierdo (☰), busca **"APIs y servicios"**
2. Haz clic en **"Biblioteca"**

### 3.2. Habilitar Maps JavaScript API

1. En el buscador, escribe: **"Maps JavaScript API"**
2. Haz clic en **"Maps JavaScript API"**
3. Haz clic en el botón azul **"HABILITAR"**
4. Espera a que se habilite (puede tardar unos segundos)

### 3.3. Habilitar Places API

1. Vuelve a la **Biblioteca** (menú lateral → APIs y servicios → Biblioteca)
2. Busca: **"Places API"**
3. Haz clic en **"Places API"**
4. Haz clic en **"HABILITAR"**

### 3.4. Habilitar Geocoding API

1. Vuelve a la **Biblioteca**
2. Busca: **"Geocoding API"**
3. Haz clic en **"Geocoding API"**
4. Haz clic en **"HABILITAR"**

---

## 🔑 Paso 4: Crear la API Key

### 4.1. Ir a Credenciales

1. En el menú lateral, ve a **"APIs y servicios"** → **"Credenciales"**
2. O haz clic directamente en: **https://console.cloud.google.com/apis/credentials**

### 4.2. Crear la Clave

1. Haz clic en el botón **"+ CREAR CREDENCIALES"** (arriba)
2. Selecciona **"Clave de API"**
3. Se creará automáticamente una API Key
4. **¡IMPORTANTE!** Copia la API Key inmediatamente (aparece en un cuadro de diálogo)
   - Se verá algo como: `AIzaSyC3umF6aSN5ghjYygbEzvhczdhxzxzYtrY`
   - **Guárdala en un lugar seguro**, no podrás verla completa después

### 4.3. (Opcional pero Recomendado) Restringir la API Key

1. En la lista de credenciales, haz clic en el **nombre de tu API Key** (o en el ícono de editar)
2. En **"Restricciones de aplicación"**:
   - Selecciona **"Sitios web HTTP"**
   - Agrega tu dominio (ej: `localhost`, `playup.com`, etc.)
   - Para desarrollo, agrega: `http://localhost:*` y `http://127.0.0.1:*`
3. En **"Restricciones de API"**:
   - Selecciona **"Limitar clave"**
   - Marca solo estas 3 APIs:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API
4. Haz clic en **"GUARDAR"**

---

## ⚙️ Paso 5: Configurar en el Proyecto

### 5.1. Crear archivo .env

1. En la raíz del proyecto (`/Users/mac15/sitios/playup/`), crea o edita el archivo `.env`
2. Agrega esta línea (reemplaza con tu API Key):

```bash
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

**Ejemplo:**
```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC3umF6aSN5ghjYygbEzvhczdhxzxzYtrY
```

### 5.2. Verificar que .env esté en .gitignore

El archivo `.env` ya debería estar en `.gitignore` (para no subirlo a Git).

### 5.3. Reiniciar el servidor

1. Detén el servidor (Ctrl+C)
2. Reinicia: `npm run dev`
3. Recarga la página en el navegador

---

## ✅ Paso 6: Verificar que Funciona

1. Ve a Admin → **"Gestionar Predios"**
2. Haz clic en **"+ Nuevo Predio"**
3. En el campo **"Dirección"**, deberías ver:
   - Un input con autocompletado de Google
   - Un botón **"Abrir Mapa"**
4. Escribe una dirección (ej: "Av. Corrientes 1234, Buenos Aires")
5. Deberías ver sugerencias de Google
6. Al seleccionar una, deberían llenarse automáticamente **Latitud** y **Longitud**

---

## 🐛 Solución de Problemas

### Error: "This API key is not authorized"
**Solución**: 
- Verifica que las 3 APIs estén habilitadas (Maps JavaScript API, Places API, Geocoding API)
- Ve a: APIs y servicios → Biblioteca → Verifica que estén habilitadas

### Error: "RefererNotAllowedMapError"
**Solución**: 
- Ve a Credenciales → Edita tu API Key
- En "Restricciones de aplicación", agrega tu dominio o `localhost`

### El mapa no carga
**Solución**:
1. Verifica que la API Key esté correcta en `.env`
2. Verifica que Maps JavaScript API esté habilitada
3. Abre la consola del navegador (F12) y busca errores
4. Verifica que el archivo `.env` esté en la raíz del proyecto

### "VITE_GOOGLE_MAPS_API_KEY no está configurada"
**Solución**:
1. Verifica que el archivo `.env` exista en la raíz del proyecto
2. Verifica que la variable se llame exactamente `VITE_GOOGLE_MAPS_API_KEY`
3. Reinicia el servidor después de crear/editar `.env`

---

## 💰 Información sobre Costos

### Plan Gratuito
Google Maps ofrece **$200 USD de crédito mensual gratis**, que cubre aproximadamente:
- **Maps JavaScript API**: ~28,000 cargas de mapa
- **Places API**: ~11,000 solicitudes
- **Geocoding API**: ~40,000 solicitudes

### Después del Crédito Gratuito
- Se cobra por uso
- Recomendación: Restringe la API Key a tu dominio para evitar uso no autorizado

### Monitorear Uso
1. Ve a: **APIs y servicios** → **Panel**
2. Ahí verás el uso de cada API

---

## 📸 Capturas de Referencia

### Ubicación de las APIs en el Menú:
```
Google Cloud Console
  └─ ☰ Menú Lateral
      └─ APIs y servicios
          └─ Biblioteca  ← Aquí buscas las APIs
          └─ Credenciales  ← Aquí creas la API Key
```

### APIs a Habilitar:
1. ✅ Maps JavaScript API
2. ✅ Places API  
3. ✅ Geocoding API

---

## 🆘 ¿Necesitas Más Ayuda?

Si tienes problemas:
1. Revisa la consola del navegador (F12) para ver errores específicos
2. Verifica que todas las APIs estén habilitadas
3. Verifica que la API Key esté correcta en `.env`
4. Asegúrate de haber reiniciado el servidor después de agregar la API Key

---

## ✅ Checklist Final

- [ ] Proyecto creado en Google Cloud Console
- [ ] Maps JavaScript API habilitada
- [ ] Places API habilitada
- [ ] Geocoding API habilitada
- [ ] API Key creada y copiada
- [ ] API Key agregada a `.env` como `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Servidor reiniciado
- [ ] Funciona el autocompletado de direcciones
- [ ] Funciona el mapa interactivo

---

¡Listo! 🎉 Con estos pasos deberías tener Google Maps funcionando en tu aplicación.

