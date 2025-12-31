# Configuración de Firebase para PlayUp

## 📋 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Ingresa el nombre del proyecto (ej: "playup")
4. Sigue los pasos del asistente

### 2. Agregar una App Web

1. En el dashboard de Firebase, haz clic en el ícono de Web (`</>`)
2. Registra tu app con un nombre (ej: "PlayUp Web")
3. **NO** marques "También configurar Firebase Hosting" (a menos que lo necesites)
4. Haz clic en "Registrar app"

### 3. Obtener las Credenciales

Después de registrar la app, verás un objeto de configuración como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "playup-12345.firebaseapp.com",
  projectId: "playup-12345",
  storageBucket: "playup-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 4. Configurar Variables de Entorno

1. Copia el archivo `env.example` a `.env`:
   ```bash
   cp env.example .env
   ```
   
   O crea el archivo `.env` manualmente en la raíz del proyecto.

2. Edita `.env` y completa con tus credenciales:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=playup-12345.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=playup-12345
   VITE_FIREBASE_STORAGE_BUCKET=playup-12345.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

### 5. Configurar Firestore Database

1. En Firebase Console, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Elige "Comenzar en modo de prueba" (para desarrollo)
4. Selecciona una ubicación (ej: "us-central1" o "southamerica-east1" para Argentina)

### 6. Configurar Authentication

1. En Firebase Console, ve a "Authentication"
2. Haz clic en "Comenzar"
3. Habilita los proveedores que necesites:
   - **Email/Password**: Actívalo
   - **Google**: Actívalo y configura
   - **Facebook**: Actívalo y configura (opcional)

### 7. Configurar Security Rules (Opcional)

Las reglas están en `firestore.rules`. Para desplegarlas:

```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# Login
firebase login

# Inicializar Firebase en el proyecto
firebase init firestore

# Desplegar reglas
firebase deploy --only firestore:rules
```

### 8. Reiniciar el Servidor de Desarrollo

Después de configurar las variables de entorno:

```bash
# Detén el servidor (Ctrl+C)
# Reinícialo
npm run dev
```

## ✅ Verificar Configuración

1. Abre la aplicación en el navegador
2. Ve a Admin → "Cargar Datos de Ejemplo"
3. Si Firebase está configurado correctamente, no verás el mensaje de alerta
4. Intenta cargar los datos de ejemplo

## 🔒 Seguridad

- **NUNCA** subas el archivo `.env` a Git
- El archivo `.env` ya está en `.gitignore`
- Las credenciales de Firebase son públicas en el cliente, pero las Security Rules protegen los datos

## 🐛 Solución de Problemas

### Error: "Firebase no está configurado"
- Verifica que el archivo `.env` existe
- Verifica que las variables empiezan con `VITE_`
- Reinicia el servidor de desarrollo después de crear `.env`

### Error: "Permission denied"
- Configura las Security Rules en Firestore
- Asegúrate de que Authentication esté habilitado

### Error: "Network request failed"
- Verifica tu conexión a internet
- Verifica que las credenciales sean correctas
- Verifica que el proyecto de Firebase esté activo

## 📚 Recursos

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

