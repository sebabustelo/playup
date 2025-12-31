# ✅ Pasos de Configuración - Checklist

## 🔥 Firebase - Configuración Inicial

### Paso 1: Crear Firestore Database ⭐ OBLIGATORIO
- [ ] Ve a: https://console.firebase.google.com/project/playup-3a22d/firestore
- [ ] Haz clic en **"Crear base de datos"** (si no existe)
- [ ] Elige **"Comenzar en modo de prueba"**
- [ ] Selecciona ubicación: **`southamerica-east1`** o **`us-central1`**
- [ ] Haz clic en **"Habilitar"**

⏱️ **Tiempo estimado**: 2 minutos

---

### Paso 2: Configurar Security Rules ⭐ OBLIGATORIO
**Opción A: Desde Firebase Console (Más Fácil)**
- [ ] Ve a Firestore → Pestaña **"Reglas"**
- [ ] Abre el archivo `firestore.rules` en tu editor
- [ ] Copia TODO el contenido
- [ ] Pégalo en el editor de reglas de Firebase
- [ ] Haz clic en **"Publicar"**

**Opción B: Usando Firebase CLI**
```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Login
firebase login

# Desplegar reglas
cd /Users/mac15/sitios/playup
firebase deploy --only firestore:rules
```

⏱️ **Tiempo estimado**: 3 minutos

---

### Paso 3: Configurar Authentication ⭐ OBLIGATORIO
- [ ] Ve a: https://console.firebase.google.com/project/playup-3a22d/authentication
- [ ] Haz clic en **"Comenzar"** (si es la primera vez)
- [ ] Ve a **"Sign-in method"**
- [ ] Habilita **"Correo electrónico/Contraseña"**
- [ ] (Opcional) Habilita **"Google"**
- [ ] (Opcional) Habilita **"Facebook"**

⏱️ **Tiempo estimado**: 2 minutos

---

### Paso 4: Configurar Índices (Opcional - se crean automáticamente)
**Opción A: Automático (Recomendado)**
- [ ] Cuando hagas una búsqueda, Firebase te mostrará un link
- [ ] Haz clic en el link para crear el índice automáticamente

**Opción B: Manual con Firebase CLI**
```bash
firebase deploy --only firestore:indexes
```

⏱️ **Tiempo estimado**: 1 minuto (solo si usas CLI)

---

## 🚀 Probar la Configuración

### Paso 5: Cargar Datos de Ejemplo
- [ ] Reinicia el servidor de desarrollo: `npm run dev`
- [ ] Abre la app en el navegador
- [ ] Inicia sesión como admin (usa las credenciales de `adminUsuarios.json`)
- [ ] Ve a Admin → **"Cargar Datos de Ejemplo"**
- [ ] Haz clic en **"🚀 Cargar Todos los Datos"**
- [ ] Revisa la consola del navegador (F12) para ver el progreso
- [ ] Deberías ver mensajes como:
  - ✅ Cargados 5 predios
  - ✅ Cargadas 16 franjas horarias
  - ✅ Cargados 5 servicios
  - ✅ Cargados 4 deportes
  - ✅ Cargadas 18 canchas
  - ✅ Cargados X precios

⏱️ **Tiempo estimado**: 1-2 minutos

---

## ✅ Verificación Final

- [ ] Puedes ver predios en Admin → Gestionar Predios
- [ ] Puedes ver canchas en Admin → Gestionar Canchas
- [ ] Puedes buscar canchas desde la página principal
- [ ] Puedes crear un partido (si estás autenticado)
- [ ] No hay errores en la consola del navegador

---

## 🎉 ¡Listo!

Si todos los pasos están completados, tu aplicación está lista para usar.

**Tiempo total estimado**: ~10 minutos

---

## 📚 Documentación Adicional

- **Instrucciones detalladas**: `CONFIGURAR_FIRESTORE.md`
- **Guía rápida**: `INSTRUCCIONES_RAPIDAS.md`
- **Configuración de Firebase**: `CONFIGURACION_FIREBASE.md`

---

## 🆘 ¿Problemas?

1. **Revisa la consola del navegador** (F12) para errores específicos
2. **Verifica que Firestore esté creado** en Firebase Console
3. **Verifica que las Security Rules estén publicadas**
4. **Verifica que Authentication esté habilitado**

