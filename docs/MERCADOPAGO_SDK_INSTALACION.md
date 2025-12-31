# Instalación del SDK de MercadoPago React

## Instalación del Paquete

El SDK de MercadoPago para React necesita ser instalado. Ejecuta el siguiente comando en tu terminal:

```bash
cd /Users/mac15/sitios/playup
npm install @mercadopago/sdk-react
```

Si encuentras problemas de permisos, intenta con:

```bash
sudo npm install @mercadopago/sdk-react
```

O, si estás usando nvm, asegúrate de tener los permisos correctos en el directorio de node_modules:

```bash
sudo chown -R $(whoami) ~/.nvm/versions/node/v18.20.8/lib/node_modules
npm install @mercadopago/sdk-react
```

## Cambios Realizados

### 1. Inicialización del SDK en `App.jsx`

El SDK de MercadoPago se inicializa automáticamente cuando la aplicación se carga, usando la Public Key configurada en las variables de entorno:

```javascript
import { initMercadoPago } from '@mercadopago/sdk-react'

// Inicializa MercadoPago con la Public Key
const initializeMercadoPago = () => {
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  if (publicKey) {
    initMercadoPago(publicKey);
  }
};
```

### 2. Componente Wallet en `RealizarPago.jsx`

El componente `RealizarPago` ahora usa el componente `<Wallet>` de MercadoPago en lugar de redirigir directamente a la URL de checkout.

**Flujo actualizado:**
1. El usuario selecciona "Continuar con MercadoPago"
2. Se crea el partido en Firestore
3. Se crea la preferencia de pago en MercadoPago
4. Se muestra el componente `<Wallet>` con el botón de pago de MercadoPago
5. El usuario hace clic en el botón y es redirigido al checkout de MercadoPago

### 3. Ventajas del SDK

- **Mejor UX**: El botón de pago se integra directamente en tu aplicación
- **Más seguro**: El SDK maneja la comunicación con MercadoPago de forma segura
- **Actualizaciones automáticas**: El SDK se actualiza con las mejores prácticas de MercadoPago
- **Personalización**: Puedes personalizar la apariencia del botón

## Verificación

Después de instalar el paquete:

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Crea un partido y selecciona MercadoPago como método de pago

3. Deberías ver el botón oficial de MercadoPago en lugar de ser redirigido inmediatamente

## Solución de Problemas

Si el componente `Wallet` no se renderiza:

1. Verifica que la Public Key esté configurada en `.env`:
   ```env
   VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-60a18dde-1e79-4ff7-b775-16cb36aea70e
   ```

2. Verifica en la consola del navegador que el SDK se inicializó correctamente (deberías ver el mensaje "MercadoPago SDK inicializado correctamente")

3. Asegúrate de que el `preferenceId` se esté recibiendo correctamente desde la API de MercadoPago

