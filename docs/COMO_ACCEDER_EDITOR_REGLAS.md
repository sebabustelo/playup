# 📍 Cómo Acceder al Editor de Security Rules en Firebase Console

## 🚀 Pasos para Abrir el Editor de Reglas

### Paso 1: Abrir Firebase Console
1. Ve a: **https://console.firebase.google.com/project/playup-3a22d**
2. O ve a: **https://console.firebase.google.com/** y selecciona el proyecto "playup-3a22d"

---

### Paso 2: Ir a Firestore Database
1. En el **menú lateral izquierdo**, busca **"Firestore Database"**
2. Haz clic en **"Firestore Database"**
3. Si no aparece, primero debes crear Firestore (ver `VERIFICAR_FIRESTORE.md`)

---

### Paso 3: Abrir la Pestaña "Reglas"
1. Una vez en Firestore Database, verás varias pestañas en la parte superior:
   - **"Datos"** (muestra los documentos)
   - **"Reglas"** ← **Haz clic aquí**
   - **"Índices"**
   - **"Uso"**

2. Haz clic en la pestaña **"Reglas"**

---

### Paso 4: Ver el Editor
Ahora verás el editor de reglas con un código similar a esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### Paso 5: Editar las Reglas
1. **Abre el archivo `firestore.rules`** en tu editor de código (está en la raíz del proyecto `/Users/mac15/sitios/playup/firestore.rules`)
2. **Copia TODO el contenido** del archivo
3. **Pega el contenido** en el editor de Firebase Console (reemplaza lo que está ahí)
4. Haz clic en **"Publicar"** (botón azul en la parte superior derecha)

---

## 📸 Ruta Visual

```
Firebase Console
  └─ Menú Lateral
      └─ 🔥 Firestore Database
          └─ Pestaña "Reglas" ← AQUÍ ESTÁ EL EDITOR
              └─ Editor de código
                  └─ Botón "Publicar"
```

---

## 🔗 Enlaces Directos

### Ir directamente a Firestore:
**https://console.firebase.google.com/project/playup-3a22d/firestore**

### Ir directamente a Reglas:
**https://console.firebase.google.com/project/playup-3a22d/firestore/rules**

---

## ⚠️ Si No Ves la Pestaña "Reglas"

### Opción 1: Firestore no está creado
- Primero debes crear Firestore Database
- Ve a: https://console.firebase.google.com/project/playup-3a22d/firestore
- Haz clic en "Crear base de datos"
- Sigue las instrucciones

### Opción 2: Estás en la vista incorrecta
- Asegúrate de estar en **"Firestore Database"** (no en "Realtime Database")
- Verifica que estés en el proyecto correcto: **playup-3a22d**

---

## ✅ Verificar que las Reglas Están Publicadas

Después de publicar, deberías ver:
- Un mensaje verde: "Reglas publicadas correctamente"
- La fecha de última publicación
- El código que acabas de pegar visible en el editor

---

## 🆘 ¿Problemas?

1. **No veo "Firestore Database" en el menú**
   → Firestore no está creado. Créalo primero.

2. **No veo la pestaña "Reglas"**
   → Asegúrate de estar en "Firestore Database" (no Realtime Database)

3. **El botón "Publicar" está deshabilitado**
   → Hay un error de sintaxis en las reglas. Revisa el código.

4. **No puedo pegar el código**
   → Asegúrate de copiar TODO el contenido de `firestore.rules`

---

## 📝 Resumen Rápido

1. **Abre**: https://console.firebase.google.com/project/playup-3a22d/firestore/rules
2. **Copia** el contenido de `firestore.rules`
3. **Pega** en el editor
4. **Publica**

¡Listo! 🎉

