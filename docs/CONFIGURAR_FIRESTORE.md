# Configuración de Firestore - Guía Paso a Paso

## 🚀 Configuración Inicial de Firestore

### Paso 1: Crear la Base de Datos Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com/project/playup-3a22d)
2. En el menú lateral, haz clic en **"Firestore Database"**
3. Si es la primera vez, haz clic en **"Crear base de datos"**
4. Elige el modo:
   - **Para desarrollo**: "Comenzar en modo de prueba" (permite lectura/escritura por 30 días)
   - **Para producción**: "Comenzar en modo de producción" (requiere reglas de seguridad)
5. Selecciona la ubicación:
   - **Recomendado para Argentina**: `southamerica-east1` (São Paulo)
   - O `us-central1` (Iowa, USA)
6. Haz clic en **"Habilitar"**

### Paso 2: Configurar Security Rules

1. En Firestore Database, ve a la pestaña **"Reglas"**
2. Copia el contenido del archivo `firestore.rules` (está en la raíz del proyecto)
3. Pega las reglas en el editor de Firebase Console
4. Haz clic en **"Publicar"**

**O usa Firebase CLI** (más rápido):
```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Login
firebase login

# Inicializar Firebase en el proyecto
cd /Users/mac15/sitios/playup
firebase init firestore

# Desplegar reglas
firebase deploy --only firestore:rules
```

### Paso 3: Configurar Índices Compuestos

Los índices son necesarios para las búsquedas complejas. Hay dos formas:

**Opción A: Automático (Recomendado)**
- Cuando hagas una búsqueda que requiera índice, Firebase te mostrará un link
- Haz clic en el link y se creará automáticamente

**Opción B: Manual**
1. Ve a Firestore Database → **"Índices"**
2. Haz clic en **"Crear índice"**
3. Usa los índices definidos en `firestore.indexes.json`

**O usa Firebase CLI**:
```bash
firebase deploy --only firestore:indexes
```

### Paso 4: Habilitar Authentication

1. En Firebase Console, ve a **"Authentication"**
2. Haz clic en **"Comenzar"**
3. Habilita los proveedores:
   - **Email/Password**: Actívalo
   - **Google**: Actívalo y configura (opcional)
   - **Facebook**: Actívalo y configura (opcional)

## 📋 Estructura de Colecciones

Después de cargar los datos, tendrás estas colecciones:

```
Firestore/
├── predios/              (Predios/Sedes)
├── canchas/              (Canchas por predio)
├── precios/              (Precios por cancha, día y horario)
├── promociones/          (Promociones especiales)
├── deportes/             (Deportes disponibles)
├── franjas_horarias/     (Horarios disponibles)
├── servicios/            (Servicios adicionales)
├── partidos/             (Partidos creados)
│   └── {partidoId}/
│       ├── jugadores/    (Subcolección)
│       ├── pagos/        (Subcolección)
│       └── servicios/    (Subcolección)
└── users/                (Usuarios - opcional)
```

## ✅ Verificación

1. **Verifica que Firestore esté creado**:
   - Deberías ver "Firestore Database" en el menú
   - Debería decir "Base de datos creada"

2. **Verifica las reglas**:
   - Ve a "Reglas" y confirma que están publicadas
   - Deberías ver las reglas del archivo `firestore.rules`

3. **Prueba cargar datos**:
   - Ve a la app → Admin → "Cargar Datos de Ejemplo"
   - Haz clic en "Cargar Todos los Datos"
   - Revisa la consola del navegador para ver el progreso

## 🔒 Security Rules - Explicación

Las reglas en `firestore.rules` permiten:
- **Lectura pública**: Cualquiera puede leer canchas, precios, promociones
- **Escritura protegida**: Solo admins pueden crear/editar predios, canchas, precios
- **Partidos**: Usuarios autenticados pueden crear, solo el creador o admin puede editar
- **Jugadores/Pagos**: Solo el creador del partido o admin puede gestionarlos

## 🐛 Solución de Problemas

### Error: "Missing or insufficient permissions"
- **Solución**: Configura las Security Rules en Firebase Console
- Ve a Firestore → Reglas → Pega el contenido de `firestore.rules`

### Error: "The query requires an index"
- **Solución**: Haz clic en el link del error para crear el índice automáticamente
- O despliega los índices: `firebase deploy --only firestore:indexes`

### Error: "Firestore has not been initialized"
- **Solución**: Asegúrate de haber creado la base de datos en Firebase Console

### Los datos no se cargan
- Revisa la consola del navegador (F12) para ver errores específicos
- Verifica que las Security Rules permitan escritura
- Verifica que estés autenticado como admin

## 📚 Recursos

- [Documentación de Firestore](https://firebase.google.com/docs/firestore)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Índices Compuestos](https://firebase.google.com/docs/firestore/query-data/index-overview)

