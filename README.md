# PlayUp - Organiza tus Partidos

Aplicación web para organizar partidos de fútbol, pádel y otros deportes. Permite buscar canchas, crear partidos, agregar jugadores y enviar notificaciones.

## Características

- 🔍 **Búsqueda de Canchas**: Busca canchas por ciudad o ubicación cercana
- ⚽ **Creación de Partidos**: Crea partidos con selección de cancha y tipo (5, 7, 8, 11)
- 👥 **Gestión de Jugadores**: Agrega jugadores con email y teléfono
- 📧 **Notificaciones**: Envía avisos por email y WhatsApp con el monto a pagar
- 🎮 **Panel de Administración**: Configura canchas, deportes y tipos de partidos
- 🔐 **Autenticación**: Sistema de login con email/password, Google y Facebook

## Tecnologías

- React 18
- Vite
- Firebase (Auth, Firestore, Storage)
- React Router
- React Query
- date-fns

## Instalación

1. Clona el repositorio o navega a la carpeta del proyecto:
```bash
cd /Users/mac15/sitios/playup
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura Firebase:
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Obtén las credenciales de configuración
   - Edita `src/firebase.js` y reemplaza los valores con tus credenciales:
   ```javascript
   const firebaseConfig = {
     apiKey: "TU_API_KEY",
     authDomain: "TU_AUTH_DOMAIN",
     projectId: "TU_PROJECT_ID",
     storageBucket: "TU_STORAGE_BUCKET",
     messagingSenderId: "TU_MESSAGING_SENDER_ID",
     appId: "TU_APP_ID"
   };
   ```

4. Configura las reglas de Firestore:
   - Ve a Firebase Console > Firestore Database > Rules
   - Configura reglas apropiadas para tu caso de uso

## Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
playup/
├── src/
│   ├── auth/              # Rutas protegidas
│   ├── components/         # Componentes reutilizables
│   │   └── estaticos/      # Header, Footer
│   ├── context/           # Contextos de React (Auth, Toast)
│   ├── pages/             # Páginas principales
│   │   ├── admin/         # Panel de administración
│   │   └── auth/          # Login y registro
│   ├── services/          # Servicios (partidos, notificaciones)
│   ├── App.jsx            # Componente principal
│   ├── main.jsx           # Punto de entrada
│   └── firebase.js        # Configuración de Firebase
├── public/                # Archivos estáticos
├── package.json
└── vite.config.js
```

## Funcionalidades Principales

### Búsqueda de Canchas
- Filtra por ciudad, deporte y tipo
- Búsqueda por ubicación cercana (geolocalización)
- Muestra precio por hora

### Creación de Partidos
- Selecciona cancha, fecha, hora y tipo
- Calcula automáticamente el precio por jugador
- El creador paga la reserva de la cancha

### Gestión de Jugadores
- Agrega jugadores con nombre, email y teléfono
- Envía notificaciones automáticas por email y WhatsApp
- Muestra el monto que cada jugador debe pagar

### Panel de Administración
- **Gestionar Canchas**: Agrega, edita y elimina canchas
- **Gestionar Deportes**: Configura deportes y tipos de partidos (5, 7, 8, 11 para fútbol)

## Notificaciones

Las notificaciones por email y WhatsApp están implementadas como funciones base. Para producción, necesitarás:

1. **Email**: Configurar un servicio como SendGrid, Nodemailer, o Firebase Functions
2. **WhatsApp**: Configurar Twilio, WhatsApp Business API, o similar

Edita `src/services/notificacionesService.js` para implementar la integración real.

## Configuración de Roles

Para asignar el rol de administrador a un usuario:
1. Ve a Firebase Console > Firestore
2. Crea o edita el documento del usuario en la colección `users`
3. Agrega el campo `roles` con el valor `['admin']`

O modifica el `AuthContext.jsx` para asignar roles automáticamente según criterios específicos.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

## Próximos Pasos

- [ ] Implementar integración real de email (SendGrid/Nodemailer)
- [ ] Implementar integración real de WhatsApp (Twilio)
- [ ] Agregar mapa para visualizar canchas cercanas
- [ ] Sistema de pagos integrado
- [ ] Notificaciones push
- [ ] App móvil (React Native)

## Licencia

Este proyecto es privado.




