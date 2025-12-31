# Configurar Template de Email en EmailJS

Este documento explica cómo configurar el template de email de invitación a partidos en EmailJS usando el diseño proporcionado.

## Template HTML

El template HTML está disponible en: `src/templates/email-invitacion-partido.html`

## Pasos para Configurar en EmailJS

### 1. Acceder a EmailJS

1. Ve a [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Inicia sesión en tu cuenta

### 2. Crear Nueva Plantilla

1. En el menú lateral, ve a **Email Templates**
2. Haz clic en **Create New Template**
3. Dale un nombre: "Invitación a Partido - PlayUp"

### 4. Configurar el Template

1. En el editor de plantillas, selecciona **Code** (modo código)
2. Copia y pega el contenido completo del archivo `src/templates/email-invitacion-partido.html`
3. Haz clic en **Save**

### 5. Configurar Variables

El template usa las siguientes variables que EmailJS reemplazará automáticamente:

- `{{to_name}}` - Nombre del destinatario
- `{{to_email}}` - Email del destinatario
- `{{cancha_nombre}}` - Nombre de la cancha
- `{{cancha_direccion}}` - Dirección de la cancha
- `{{fecha}}` - Fecha formateada (ej: "lunes, 15 de enero de 2024")
- `{{hora}}` - Hora del partido
- `{{tipo_partido}}` - Tipo de partido (ej: "5 vs 5")
- `{{monto}}` - Monto a pagar formateado (ej: "$5.000,00")
- `{{organizador}}` - Nombre del organizador
- `{{descripcion}}` - Descripción del partido (opcional)
- `{{partido_id}}` - ID del partido (para el link)

### 6. Configurar Logo

El template incluye una referencia al logo:
```html
<img src="https://playup.com/img/logo.png" alt="PlayUp Logo" />
```

**Opción 1: Usar URL pública**
- Sube tu logo a un servidor público
- Reemplaza la URL en el template

**Opción 2: Usar Attachment en EmailJS**
- En EmailJS, ve a **Attachments**
- Sube tu logo como `logo.png`
- El template ya está configurado para usar `cid:logo.png`

### 7. Personalizar Colores (Opcional)

Si quieres cambiar los colores del template, busca y reemplaza:

- `#4CAF50` - Color principal (verde PlayUp)
- `#212121` - Color de texto principal
- `#666666` - Color de texto secundario
- `#f8f9fa` - Color de fondo de la card

### 8. Obtener Template ID

1. Después de guardar, verás el **Template ID** (ej: `template_xyz789`)
2. Copia este ID
3. Agrégalo a tu archivo `.env`:
   ```env
   VITE_EMAILJS_TEMPLATE_ID=template_xyz789
   ```

## Template de Texto Plano (Alternativa)

Si prefieres un email de texto plano, también está disponible:
`src/templates/email-invitacion-partido-texto.txt`

Este template es más simple y funciona mejor en clientes de email que no soportan HTML.

## Personalización

### Cambiar el Logo

Reemplaza esta línea en el template:
```html
<img src="https://playup.com/img/logo.png" alt="PlayUp Logo" />
```

Con la URL de tu logo:
```html
<img src="TU_URL_DEL_LOGO" alt="PlayUp Logo" />
```

### Cambiar Links

El template incluye estos links que puedes personalizar:

- Link del logo: `https://playup.com`
- Link del botón: `https://playup.com/partido/{{partido_id}}`
- Email de soporte: `soporte@playup.com`
- Link de unsubscribe: `https://playup.com/unsubscribe?email={{to_email}}`

### Agregar Más Información

Puedes agregar más campos al template. Por ejemplo:

```html
<tr>
  <td style="padding: 8px 0; color: #666666; font-weight: bold;">Teléfono:</td>
  <td style="padding: 8px 0; color: #212121;">{{telefono_organizador}}</td>
</tr>
```

Y luego agregar la variable en `notificacionesService.js`:
```javascript
telefono_organizador: partido.creadorTelefono || ''
```

## Prueba del Template

1. En EmailJS, ve a tu template
2. Haz clic en **Test** (botón de prueba)
3. Completa las variables de prueba:
   - `to_name`: "Juan"
   - `to_email`: "juan@example.com"
   - `cancha_nombre`: "Cancha Ciudad"
   - `cancha_direccion`: "Av. Corrientes 1234, CABA"
   - `fecha`: "lunes, 15 de enero de 2024"
   - `hora`: "20:00"
   - `tipo_partido`: "5 vs 5"
   - `monto`: "$5.000,00"
   - `organizador`: "María González"
   - `descripcion`: "Partido amistoso"
   - `partido_id`: "abc123"
4. Haz clic en **Send Test Email**
5. Verifica que el email se vea correctamente

## Solución de Problemas

### El logo no se muestra

- Verifica que la URL del logo sea accesible públicamente
- O usa el sistema de attachments de EmailJS con `cid:logo.png`

### Las variables no se reemplazan

- Asegúrate de que los nombres de las variables coincidan exactamente
- Verifica que estés usando dobles llaves: `{{variable}}`
- Revisa que las variables estén definidas en `notificacionesService.js`

### El diseño se ve roto en algunos clientes

- Algunos clientes de email (especialmente Outlook) tienen limitaciones con CSS
- El template usa estilos inline que son más compatibles
- Prueba en diferentes clientes de email antes de usar en producción

## Notas Importantes

- El template usa estilos inline para máxima compatibilidad
- Los colores están basados en la identidad visual de PlayUp
- El template es responsive y se adapta a móviles
- Incluye versión de texto plano para clientes que no soportan HTML

