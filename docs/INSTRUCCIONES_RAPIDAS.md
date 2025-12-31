# 🚀 Instrucciones Rápidas - Configurar Firestore

## Opción 1: Desde Firebase Console (Más Fácil) ⭐

### 1. Crear Firestore Database
1. Ve a: https://console.firebase.google.com/project/playup-3a22d/firestore
2. Si no existe, haz clic en **"Crear base de datos"**
3. Elige **"Comenzar en modo de prueba"** (para desarrollo)
4. Selecciona ubicación: **`southamerica-east1`** (São Paulo) o **`us-central1`**
5. Haz clic en **"Habilitar"**

### 2. Configurar Security Rules
1. En Firestore, ve a la pestaña **"Reglas"**
2. Abre el archivo `firestore.rules` en tu editor
3. Copia TODO el contenido
4. Pégalo en el editor de reglas de Firebase Console
5. Haz clic en **"Publicar"**

### 3. Configurar Authentication
1. Ve a: https://console.firebase.google.com/project/playup-3a22d/authentication
2. Haz clic en **"Comenzar"** (si es la primera vez)
3. Ve a la pestaña **"Sign-in method"**
4. Habilita **"Correo electrónico/Contraseña"**
5. (Opcional) Habilita **"Google"** y **"Facebook"**

### 4. ¡Listo! 🎉
Ahora puedes:
- Cargar datos de ejemplo desde la app
- Crear partidos
- Usar todas las funcionalidades

---

## Opción 2: Usando Firebase CLI (Más Rápido)

### 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login
```bash
firebase login
```

### 3. Configurar Proyecto
```bash
cd /Users/mac15/sitios/playup
firebase use playup-3a22d
```

### 4. Crear Firestore (si no existe)
- Ve a Firebase Console y créalo manualmente (solo una vez)

### 5. Desplegar Reglas e Índices
```bash
# Desplegar reglas de seguridad
firebase deploy --only firestore:rules

# Desplegar índices compuestos
firebase deploy --only firestore:indexes
```

### 6. O usar el script automático
```bash
bash scripts/configurar-firestore.sh
```

---

## ✅ Verificar que Funciona

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Ve a la app** → Admin → "Cargar Datos de Ejemplo"

3. **Haz clic en "Cargar Todos los Datos"**

4. **Revisa la consola del navegador** (F12) para ver el progreso

5. **Si todo está bien**, verás mensajes como:
   - ✅ Cargados 5 predios
   - ✅ Cargadas 16 franjas horarias
   - ✅ Cargados 5 servicios
   - etc.

---

## 🐛 Problemas Comunes

### "Missing or insufficient permissions"
**Solución**: Las Security Rules no están configuradas
- Ve a Firestore → Reglas → Copia y pega el contenido de `firestore.rules`

### "The query requires an index"
**Solución**: Crea el índice
- Haz clic en el link del error (Firebase lo crea automáticamente)
- O despliega índices: `firebase deploy --only firestore:indexes`

### "Firestore has not been initialized"
**Solución**: Crea la base de datos
- Ve a Firebase Console → Firestore Database → Crear base de datos

### Los datos no se cargan
**Solución**: 
1. Abre la consola del navegador (F12)
2. Revisa los errores específicos
3. Verifica que estés autenticado como admin
4. Verifica que las reglas permitan escritura

---

## 📞 ¿Necesitas Ayuda?

- Revisa `CONFIGURAR_FIRESTORE.md` para instrucciones detalladas
- Revisa la consola del navegador para errores específicos
- Verifica que Firestore esté creado en Firebase Console

