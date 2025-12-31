# Configuración de MercadoPago - PlayUp

## Credenciales de Desarrollo/Testing

### Credenciales de la Aplicación
- **Access Token:** `APP_USR-5278226801660562-122318-69c7f9e4495792cb77a8597c76c7a222-3089801455`
- **Public Key:** `APP_USR-60a18dde-1e79-4ff7-b775-16cb36aea70e`

Estas credenciales están configuradas en el archivo `.env`:
```env
VITE_MERCADOPAGO_ACCESS_TOKEN=APP_USR-5278226801660562-122318-69c7f9e4495792cb77a8597c76c7a222-3089801455
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-60a18dde-1e79-4ff7-b775-16cb36aea70e
```

### Usuario de Prueba (Buyer/Comprador)

⚠️ **IMPORTANTE:** En modo sandbox (prueba), NO puedes usar tu cuenta real de MercadoPago. Debes usar una cuenta de prueba.

Para probar pagos en modo testing, usa estas credenciales:

- **User ID:** 3089801457
- **Usuario:** TESTUSER7049...
- **Contraseña:** C3QiZyfR4S
- **País:** Argentina
- **Tipo:** Buyer Test User (Comprador)

**Cómo usar:**
1. Al crear un partido y seleccionar MercadoPago como método de pago, serás redirigido al checkout de MercadoPago en modo test.
2. **NO inicies sesión con tu cuenta real.** En su lugar:
   - Si MercadoPago te pide **DNI, email o teléfono** para iniciar sesión:
     - Puedes usar cualquier valor (ej: DNI: `12345678`, Email: `test@test.com`, Teléfono: `1123456789`)
     - Luego ingresa la contraseña: `C3QiZyfR4S`
   - Si te pide **código de verificación** (por email):
     - Usa los **últimos 6 dígitos del User ID**: `9801457` (del User ID: 3089801457)
     - O los **últimos 6 dígitos del Access Token**: `801455` (del Access Token: ...3089801455)
3. Puedes probar diferentes escenarios:
   - Pagos aprobados
   - Pagos rechazados
   - Pagos pendientes

**Recomendación:** La mejor opción es crear tu propia cuenta de prueba desde el panel de desarrolladores (ver abajo).

**Error común:** Si ves el mensaje "Una de las partes con la que intentás hacer el pago es de prueba", significa que estás intentando usar tu cuenta real en el entorno de sandbox. Debes usar la cuenta de prueba.

**Crear tu propia cuenta de prueba (Recomendado):**
1. Ve a: https://www.mercadopago.com.ar/developers/panel
2. Inicia sesión con tu cuenta de desarrollador de MercadoPago
3. Selecciona tu aplicación
4. Ve a "Usuarios de prueba" o "Test Users" en el menú lateral
5. Haz clic en "Crear cuenta de prueba"
6. Completa el formulario:
   - Tipo: "Comprador" (Buyer)
   - País: Argentina
   - Email: Puede ser cualquier email (ej: `test_comprador@test.com`)
   - Nombre: Cualquier nombre
7. Guarda las credenciales que te proporciona MercadoPago
8. Usa esas credenciales para probar los pagos

## Estado de la Integración

✅ **ACTIVADA** - La integración real de MercadoPago está activa y funcionando.

### Funcionalidades Implementadas

1. **Crear Preferencia de Pago**
   - Crea una preferencia de pago en MercadoPago
   - Genera un link de checkout único para cada pago
   - Configura URLs de retorno (success, failure, pending)

2. **Verificar Estado de Pago**
   - Consulta el estado de un pago por su ID
   - Retorna el estado (approved, pending, rejected)

3. **Webhook (Pendiente de Backend)**
   - El webhook está preparado pero requiere un backend para procesarlo
   - URL configurada: `${VITE_API_URL}/webhooks/mercadopago`

## Configuración en Producción

Para producción, necesitarás:

1. **Obtener credenciales de producción** desde: https://www.mercadopago.com.ar/developers/panel/app
2. **Actualizar el archivo `.env`** con las credenciales de producción
3. **Configurar el webhook** en el panel de MercadoPago apuntando a tu backend
4. **Configurar las URLs de retorno** correctas para tu dominio de producción

## URLs de Retorno Configuradas

Las URLs de retorno se construyen dinámicamente en el código para cada partido:
- **Success:** `${window.location.origin}/partido/${partidoId}/pago-exitoso`
- **Failure:** `${window.location.origin}/partido/${partidoId}/pago-error`
- **Pending:** `${window.location.origin}/partido/${partidoId}/pago-pendiente`

### ⚠️ Importante: Redirección después del pago

**En desarrollo (localhost/HTTP):**
- MercadoPago NO redirige automáticamente después del pago
- Debes hacer clic en el botón **"Volver al sitio"** o **"Volver a [nombre del sitio]"** que aparece en la página de confirmación de MercadoPago
- Este botón aparece después de que el pago se aprueba, rechaza o queda pendiente

**En producción (HTTPS):**
- Con `auto_return: 'approved'` configurado, MercadoPago redirige automáticamente después de un pago aprobado
- Para pagos rechazados o pendientes, aún necesitarás hacer clic en "Volver al sitio"

**¿Dónde está el botón "Volver al sitio"?**
- Después de completar el pago, en la página de confirmación de MercadoPago
- Busca un botón que diga "Volver al sitio", "Volver a PlayUp" o similar
- Si no lo ves, desplázate hacia abajo en la página

### Configuración en el Panel de MercadoPago

En las **Configuraciones avanzadas** → **URLs de redireccionamiento** del panel de MercadoPago, puedes configurar URLs por defecto.

⚠️ **IMPORTANTE:** MercadoPago requiere que las URLs sean HTTPS. Para desarrollo local, tienes dos opciones:

#### Opción 1: Dejar las URLs vacías (Recomendado para desarrollo)

**Puedes dejar las URLs vacías en el panel de MercadoPago.** El código ya construye las URLs dinámicamente con el `partidoId` específico en cada preferencia de pago, así que funcionará sin configurarlas en el panel.

#### Opción 2: Usar un túnel HTTPS para desarrollo local

Si necesitas configurar las URLs en el panel, puedes usar herramientas como **ngrok** o **Cloudflare Tunnel** para crear un túnel HTTPS a tu localhost:

**Con ngrok:**
1. Instala ngrok: `npm install -g ngrok` o descárgalo desde https://ngrok.com
2. Ejecuta: `ngrok http 5173`
3. Copia la URL HTTPS que te proporciona (ej: `https://abc123.ngrok.io`)
4. Usa estas URLs en el panel de MercadoPago:
   - **URL de éxito:** `https://abc123.ngrok.io/partido/*/pago-exitoso`
   - **URL de fallo:** `https://abc123.ngrok.io/partido/*/pago-error`
   - **URL pendiente:** `https://abc123.ngrok.io/partido/*/pago-pendiente`

**Para Producción (reemplaza con tu dominio):**
- **URL de éxito:** `https://tudominio.com/partido/*/pago-exitoso`
- **URL de fallo:** `https://tudominio.com/partido/*/pago-error`
- **URL pendiente:** `https://tudominio.com/partido/*/pago-pendiente`

⚠️ **Nota:** Estas URLs en el panel son opcionales y se usan como respaldo. El código ya construye las URLs dinámicamente con el `partidoId` específico en cada preferencia de pago, por lo que funcionará correctamente incluso si las dejas vacías.

## Notas Importantes

⚠️ **Modo Test vs Producción:**
- En modo test, no se procesan pagos reales
- Los usuarios de prueba pueden usar cualquier tarjeta de prueba
- En producción, se procesarán pagos reales

⚠️ **Seguridad:**
- El Access Token es privado y solo debe usarse en el backend
- En este proyecto, se está usando en el frontend solo para desarrollo
- En producción, considera mover la creación de preferencias al backend

## Referencias

- [Documentación de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs)
- [Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Usuarios de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/testing)

