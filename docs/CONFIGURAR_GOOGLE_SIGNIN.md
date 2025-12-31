# Configurar Google Sign-In en Firebase

Para que el login con Google funcione correctamente, necesitas habilitar Google como método de autenticación en Firebase Console.

## Pasos para configurar Google Sign-In

### 1. Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **playup-3a22d**

### 2. Habilitar Google Sign-In

1. En el menú lateral, ve a **Authentication** (Autenticación)
2. Haz clic en la pestaña **Sign-in method** (Métodos de inicio de sesión)
3. En la lista de proveedores, busca **Google** y haz clic en él
4. Activa el toggle **Enable** (Habilitar)
5. Configura el **Project support email** (Email de soporte del proyecto):
   - Selecciona o ingresa un email válido
   - Este email se mostrará a los usuarios durante el proceso de autenticación
6. Haz clic en **Save** (Guardar)

### 3. Configurar dominios autorizados (Opcional pero recomendado)

Si tu aplicación está en producción, necesitas agregar tus dominios autorizados:

1. En la misma página de **Sign-in method**, haz clic en **Settings** (Configuración)
2. Ve a la sección **Authorized domains** (Dominios autorizados)
3. Agrega tus dominios (por ejemplo: `playup.com`, `www.playup.com`)
4. Los dominios `localhost` y `*.firebaseapp.com` ya están incluidos por defecto

### 4. Verificar configuración

Una vez configurado, deberías poder:

- Ver el botón "Google" en la página de inicio de sesión
- Al hacer clic, se abrirá un popup de Google para seleccionar la cuenta
- Después de autenticarse, el usuario será redirigido a la aplicación

## Solución de problemas

### El popup se cierra inmediatamente

- Verifica que Google Sign-In esté habilitado en Firebase Console
- Asegúrate de que no tengas bloqueadores de popups activos
- Verifica que el dominio esté en la lista de dominios autorizados

### Error: "auth/popup-blocked"

- Permite popups para tu dominio en la configuración del navegador
- Intenta usar `signInWithRedirect` en lugar de `signInWithPopup` (requiere cambios en el código)

### Error: "auth/account-exists-with-different-credential"

- Esto significa que ya existe una cuenta con ese email usando otro método (email/password)
- El usuario debe iniciar sesión con el método original o vincular las cuentas

## Notas importantes

- Google Sign-In funciona automáticamente una vez habilitado en Firebase Console
- No necesitas crear credenciales OAuth adicionales
- Firebase maneja toda la configuración de OAuth por ti
- Los usuarios pueden usar cualquier cuenta de Google para iniciar sesión

## Prueba rápida

1. Ve a la página de inicio de sesión: `/login`
2. Haz clic en el botón "Google"
3. Selecciona una cuenta de Google
4. Deberías ser redirigido a la página principal con la sesión iniciada

