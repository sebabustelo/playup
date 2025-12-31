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

## 📚 Documentación

Toda la documentación del proyecto está organizada en la carpeta [`docs/`](./docs/). 

Ver el [índice de documentación](./docs/README.md) para acceder a todas las guías de configuración.

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
   
   **Opción A: Usando Variables de Entorno (Recomendado)**
   
   a. Crea un archivo `.env` en la raíz del proyecto:
   ```bash
   touch .env
   ```
   
   b. Agrega tus credenciales de Firebase al archivo `.env`:
   ```env
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   ```
   
   c. Obtén estas credenciales desde [Firebase Console](https://console.firebase.google.com/):
      - Ve a tu proyecto → Configuración del proyecto → Tus apps → Web
      - Copia los valores del objeto `firebaseConfig`
   
   **Opción B: Editar directamente `src/firebase.js`**
   
   Edita el archivo y reemplaza los valores `YOUR_*` con tus credenciales.
   
   📖 **Ver instrucciones detalladas en [`docs/CONFIGURACION_FIREBASE.md`](./docs/CONFIGURACION_FIREBASE.md)**

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




