# 🔍 Verificar que Firestore Esté Creado

## ⚠️ Si obtienes "Timeout" al cargar datos

Esto significa que **Firestore NO está creado** o **no está accesible**. Sigue estos pasos:

---

## ✅ Paso 1: Verificar en Firebase Console

1. **Abre Firebase Console**:
   - Ve a: https://console.firebase.google.com/project/playup-3a22d

2. **Busca "Firestore Database" en el menú lateral**:
   - Si **NO aparece** en el menú → Firestore NO está creado
   - Si **aparece pero dice "No hay datos"** → Firestore está creado pero vacío ✅
   - Si **aparece y muestra datos** → Firestore está funcionando ✅

---

## 🚀 Paso 2: Crear Firestore (Si no existe)

### Si NO ves "Firestore Database" en el menú:

1. **Haz clic en "Firestore Database"** (o busca en el menú)
2. **Haz clic en "Crear base de datos"**
3. **Elige el modo**:
   - ✅ **"Comenzar en modo de prueba"** (recomendado para desarrollo)
   - Esto permite lectura/escritura por 30 días sin reglas estrictas
4. **Selecciona la ubicación**:
   - ✅ **`southamerica-east1`** (São Paulo) - Recomendado para Argentina
   - O `us-central1` (Iowa, USA)
5. **Haz clic en "Habilitar"**
6. **Espera 1-2 minutos** mientras se crea la base de datos

---

## 🔒 Paso 3: Configurar Security Rules

**IMPORTANTE**: Aunque elijas "modo de prueba", es mejor configurar las reglas correctamente.

1. **En Firestore Database**, ve a la pestaña **"Reglas"**
2. **Abre el archivo `firestore.rules`** en tu editor (está en la raíz del proyecto)
3. **Copia TODO el contenido**
4. **Pégalo en el editor de reglas** de Firebase Console
5. **Haz clic en "Publicar"**

### Reglas en modo de prueba (temporal):
Si quieres probar rápido, puedes usar estas reglas temporales:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```
⚠️ **Solo para desarrollo**. Cambia a las reglas completas después.

---

## ✅ Paso 4: Verificar que Funciona

1. **Recarga la página** de "Cargar Datos de Ejemplo"
2. **Haz clic en "Probar Conexión con Firestore"**
3. **Deberías ver**: ✅ "Conexión exitosa"

---

## 🐛 Problemas Comunes

### "Firestore Database" no aparece en el menú
**Solución**: Firestore no está creado. Sigue el Paso 2.

### Aparece "No se pudo conectar" después de crear
**Solución**: 
- Espera 2-3 minutos (la creación puede tardar)
- Recarga la página
- Verifica tu conexión a internet

### "Missing or insufficient permissions"
**Solución**: Las Security Rules están bloqueando. Configura las reglas (Paso 3).

### Sigue dando timeout después de crear
**Solución**:
1. Verifica que el proyecto sea correcto: `playup-3a22d`
2. Abre la consola del navegador (F12) y busca errores
3. Intenta desde otro navegador
4. Verifica que no haya un firewall bloqueando Firebase

---

## 📸 Imágenes de Referencia

### Menú lateral de Firebase Console:
```
📊 Overview
🔐 Authentication
🔥 Firestore Database  ← Debe aparecer aquí
☁️ Storage
📱 Hosting
...
```

### Pantalla de creación:
```
┌─────────────────────────────────────┐
│  Crear base de datos Firestore      │
│                                     │
│  Modo:                              │
│  ○ Comenzar en modo de producción   │
│  ● Comenzar en modo de prueba  ←    │
│                                     │
│  Ubicación:                         │
│  [southamerica-east1 ▼]  ←          │
│                                     │
│  [Cancelar]  [Habilitar]  ←        │
└─────────────────────────────────────┘
```

---

## 🆘 ¿Sigue sin funcionar?

1. **Abre la consola del navegador** (F12 → Console)
2. **Busca errores en rojo**
3. **Copia el mensaje de error completo**
4. **Verifica**:
   - ¿Firestore aparece en Firebase Console?
   - ¿Las reglas están publicadas?
   - ¿Tu conexión a internet funciona?
   - ¿Hay algún firewall o proxy bloqueando Firebase?

---

## ✅ Checklist Final

- [ ] Firestore Database aparece en Firebase Console
- [ ] Base de datos creada (dice "Base de datos creada" o muestra datos)
- [ ] Security Rules publicadas
- [ ] El test de conexión funciona
- [ ] Puedes cargar datos de ejemplo

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) para ver errores específicos.

