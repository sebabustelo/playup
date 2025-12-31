# EmailJS Configurado ✅

## Configuración Actual

- **Template ID**: `template_69gt7jp` ✅
- **Public Key**: `S0EaX0s2EQI2xmC7a` ✅
- **Service ID**: ⚠️ Pendiente (ver instrucciones abajo)

## Próximos Pasos

### 1. Obtener Service ID

Necesitas obtener el **Service ID** de EmailJS:

1. Ve a [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. En el menú lateral, ve a **Email Services**
3. Selecciona el servicio que configuraste (Gmail, Outlook, etc.)
4. Copia el **Service ID** (ej: `service_abc123`)

### 2. Configurar en el Proyecto

Crea un archivo `.env` en la raíz del proyecto (si no existe) y agrega:

```env
VITE_EMAILJS_SERVICE_ID=tu_service_id_aqui
VITE_EMAILJS_TEMPLATE_ID=template_69gt7jp
VITE_EMAILJS_PUBLIC_KEY=S0EaX0s2EQI2xmC7a
```

**Importante:** Reemplaza `tu_service_id_aqui` con el Service ID real que obtuviste en el paso 1.

### 3. Verificar el Template

Asegúrate de que el template en EmailJS tenga todas las variables necesarias:

- `{{to_name}}`
- `{{to_email}}`
- `{{cancha_nombre}}`
- `{{cancha_direccion}}`
- `{{fecha}}`
- `{{hora}}`
- `{{tipo_partido}}`
- `{{monto}}`
- `{{organizador}}`
- `{{descripcion}}` (opcional)
- `{{partido_id}}`

### 4. Probar el Envío

1. Reinicia el servidor de desarrollo (`npm run dev`)
2. Agrega un jugador a un partido con email
3. El email se enviará automáticamente usando EmailJS

## Nota Importante

El Template ID y Public Key ya están configurados. Solo falta agregar el **Service ID** en tu archivo `.env` para que funcione completamente.

