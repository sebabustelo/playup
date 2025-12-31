# Configurar Notificaciones de Email y WhatsApp

Cuando agregas un jugador a un partido, el sistema intenta enviar notificaciones por email y WhatsApp automáticamente.

## Funcionamiento Actual

### Email

**Opción 1: EmailJS (Recomendado - Envío automático)**
- Si configuras EmailJS, los emails se envían automáticamente
- Requiere configuración gratuita en [EmailJS](https://www.emailjs.com/)
- Los emails se envían directamente sin intervención manual

**Opción 2: Fallback (Sin configuración)**
- Si no configuras EmailJS, se abre tu cliente de email (Gmail, Outlook, etc.)
- El mensaje está pre-llenado con todos los detalles del partido
- Debes hacer clic en "Enviar" manualmente

### WhatsApp

- Se abre WhatsApp Web con el mensaje pre-llenado
- El mensaje incluye todos los detalles del partido
- Debes hacer clic en "Enviar" manualmente
- El número de teléfono se formatea automáticamente (asume Argentina +54 si no tiene código de país)

## Configurar EmailJS para Envío Automático

### Paso 1: Crear cuenta en EmailJS

1. Ve a [EmailJS](https://www.emailjs.com/)
2. Crea una cuenta gratuita (permite 200 emails/mes gratis)
3. Verifica tu email

### Paso 2: Configurar un servicio de email

1. En el dashboard de EmailJS, ve a **Email Services**
2. Haz clic en **Add New Service**
3. Selecciona tu proveedor de email:
   - **Gmail** (recomendado - más fácil)
   - **Outlook**
   - **SendGrid**
   - Otros proveedores
4. Sigue las instrucciones para conectar tu cuenta
5. Guarda el **Service ID** (ej: `service_abc123`)

### Paso 3: Crear una plantilla de email

1. Ve a **Email Templates**
2. Haz clic en **Create New Template**
3. Usa esta estructura como base:

```
Subject: Invitación a partido - {{cancha_nombre}}

Hola {{to_name}},

Has sido invitado a un partido de {{tipo_partido}}.

Detalles del partido:
- Cancha: {{cancha_nombre}}
- Dirección: {{cancha_direccion}}
- Fecha: {{fecha}}
- Hora: {{hora}}
- Monto a pagar: {{monto}}
- Organizador: {{organizador}}

{{#if descripcion}}
Descripción: {{descripcion}}
{{/if}}

¡Nos vemos en la cancha!
```

4. Guarda la plantilla y copia el **Template ID** (ej: `template_xyz789`)

### Paso 4: Obtener tu Public Key

1. Ve a **Account** → **General**
2. Copia tu **Public Key** (ej: `abcdefghijklmnop`)

### Paso 5: Configurar en tu proyecto

1. Abre tu archivo `.env` en la raíz del proyecto
2. Agrega estas variables:

```env
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abcdefghijklmnop
```

3. Reinicia el servidor de desarrollo (`npm run dev`)

## Variables Disponibles en la Plantilla

Cuando crees tu plantilla en EmailJS, puedes usar estas variables:

- `{{to_email}}` - Email del destinatario
- `{{to_name}}` - Nombre del destinatario (extraído del email)
- `{{subject}}` - Asunto del email
- `{{message}}` - Mensaje completo
- `{{cancha_nombre}}` - Nombre de la cancha
- `{{cancha_direccion}}` - Dirección de la cancha
- `{{fecha}}` - Fecha formateada (ej: "lunes, 15 de enero de 2024")
- `{{hora}}` - Hora del partido
- `{{monto}}` - Monto a pagar formateado (ej: "$5.000,00")
- `{{organizador}}` - Nombre del organizador
- `{{tipo_partido}}` - Tipo de partido (ej: "5 vs 5")
- `{{descripcion}}` - Descripción del partido (puede estar vacía)

## Formato de Teléfono para WhatsApp

El sistema formatea automáticamente los números de teléfono:

- Si el número empieza con `+`, se usa tal cual
- Si empieza con `0`, se remueve y se agrega `+54` (Argentina)
- Si empieza con `54`, se agrega `+`
- Si no tiene código de país, se asume Argentina y se agrega `+54`

**Ejemplos:**
- `01112345678` → `+541112345678`
- `1123456789` → `+541123456789`
- `+541123456789` → `+541123456789` (sin cambios)
- `5491123456789` → `+5491123456789`

## Prueba Rápida

1. Agrega un jugador a un partido con email y/o teléfono
2. Si configuraste EmailJS:
   - El email se enviará automáticamente
   - Verás un mensaje de éxito
3. Si no configuraste EmailJS:
   - Se abrirá tu cliente de email con el mensaje pre-llenado
   - Debes hacer clic en "Enviar" manualmente
4. Para WhatsApp:
   - Se abrirá WhatsApp Web con el mensaje pre-llenado
   - Debes hacer clic en "Enviar" manualmente

## Solución de Problemas

### Email no se envía automáticamente

- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de haber reiniciado el servidor después de agregar las variables
- Revisa la consola del navegador para ver errores
- Verifica que tu cuenta de EmailJS esté activa y no haya excedido el límite

### WhatsApp no se abre

- Verifica que el número de teléfono esté en formato correcto
- Asegúrate de tener WhatsApp Web abierto en tu navegador
- Verifica que no tengas bloqueadores de popups activos

### El formato del teléfono es incorrecto

- El sistema asume números argentinos por defecto
- Si necesitas otro país, agrega el código de país al número (ej: `+1234567890`)

## Notas Importantes

- **EmailJS Gratis**: Permite 200 emails/mes. Para más, necesitas un plan de pago
- **WhatsApp**: Requiere que el usuario tenga WhatsApp Web abierto
- **Privacidad**: Los emails y mensajes de WhatsApp contienen información del partido
- **Fallback**: Si EmailJS falla, automáticamente se usa el método de mailto

