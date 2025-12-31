# 🔄 Reemplazar Reglas Temporales por Reglas Completas

## ⚠️ Situación Actual

Tienes reglas temporales en "modo de prueba" que:
- ✅ Permiten lectura/escritura a cualquiera
- ⚠️ Expiran el 21 de enero de 2026
- ⚠️ No tienen seguridad adecuada

## ✅ Solución: Usar Reglas Completas

Las reglas completas permiten:
- ✅ Lectura pública de canchas, precios, promociones
- ✅ Solo admins pueden crear/editar predios, canchas, precios
- ✅ Usuarios autenticados pueden crear partidos
- ✅ Solo el creador o admin puede editar partidos
- ✅ Seguridad adecuada para producción

---

## 📋 Pasos para Reemplazar

### Paso 1: Abrir el Editor de Reglas
1. Ve a: **https://console.firebase.google.com/project/playup-3a22d/firestore/rules**
2. O navega: Firebase Console → Firestore Database → Pestaña "Reglas"

### Paso 2: Seleccionar Todo el Contenido Actual
1. En el editor, selecciona **TODO** el código actual (Ctrl+A o Cmd+A)
2. **Bórralo** (Delete o Backspace)

### Paso 3: Copiar las Nuevas Reglas
**Opción A: Desde el archivo**
1. Abre el archivo `REGLAS_PARA_COPIAR.txt` en tu editor
2. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)

**Opción B: Desde firestore.rules**
1. Abre `/Users/mac15/sitios/playup/firestore.rules`
2. Copia **TODO** el contenido

### Paso 4: Pegar las Nuevas Reglas
1. Pega el contenido en el editor de Firebase Console (Ctrl+V o Cmd+V)
2. Deberías ver el código completo con todas las reglas

### Paso 5: Publicar
1. Haz clic en el botón **"Publicar"** (azul, arriba a la derecha)
2. Espera a que aparezca el mensaje: **"Reglas publicadas correctamente"**

---

## ✅ Verificación

Después de publicar, deberías ver:
- ✅ Mensaje verde: "Reglas publicadas correctamente"
- ✅ Fecha de última publicación actualizada
- ✅ El código completo visible en el editor

---

## 🧪 Probar que Funciona

1. **Recarga la página** de "Cargar Datos de Ejemplo" en tu app
2. **Haz clic en "Probar Conexión con Firestore"**
3. **Deberías ver**: ✅ "Conexión exitosa"
4. **Intenta cargar datos**: Haz clic en "Cargar Todos los Datos"
5. **Debería funcionar** sin errores de permisos

---

## ⚠️ Nota Importante

Las reglas completas requieren que:
- Los usuarios estén autenticados para crear partidos
- Los admins estén en la colección `users` con `roles: ['admin']`

Si cargas datos de ejemplo como admin, deberías poder hacerlo sin problemas.

---

## 🆘 Si Hay Errores

### Error: "Permission denied"
- Verifica que estés autenticado como admin
- Verifica que las reglas estén publicadas correctamente

### Error: "Syntax error"
- Revisa que copiaste TODO el contenido
- Asegúrate de no haber dejado código anterior mezclado

### Sigue sin funcionar
- Revisa la consola del navegador (F12) para ver errores específicos
- Verifica que Firestore esté creado y funcionando

---

## 📝 Resumen Rápido

1. **Abre**: https://console.firebase.google.com/project/playup-3a22d/firestore/rules
2. **Borra** todo el contenido actual
3. **Copia** el contenido de `REGLAS_PARA_COPIAR.txt` o `firestore.rules`
4. **Pega** en el editor
5. **Publica**

¡Listo! 🎉

