# Datos de Ejemplo - PlayUp

Este directorio contiene archivos JSON con datos de ejemplo para cargar en Firestore durante el desarrollo.

## Archivos Disponibles

### `predios.json`
- 5 predios en diferentes ubicaciones
- Capital Federal, Villa Crespo, Palermo, Belgrano
- Incluye coordenadas, teléfonos, emails

### `canchas.json`
- 18 canchas distribuidas en los predios
- Fútbol 5, Fútbol 8, Pádel
- Diferentes precios según ubicación

### `franjasHorarias.json`
- 16 franjas horarias de 8:00 a 24:00
- Horarios de 1 hora cada uno

### `servicios.json`
- 5 servicios adicionales
- Grabación Beelup, Alquiler de Pelotas, Arbitraje, etc.

### `deportes.json`
- 4 deportes con sus tipos
- Fútbol, Pádel, Tenis, Básquet

### `precios.json`
- Precios de ejemplo para diferentes días y horarios
- Lunes, Viernes, Sábado, Feriados
- Horarios: 18-19, 19-20, 20-21

### `partidos.json`
- 3 partidos de ejemplo
- Diferentes estados y configuraciones

## Cómo Usar

1. Accede al panel de administración
2. Ve a "Cargar Datos de Ejemplo"
3. Haz clic en "Cargar Todos los Datos"
4. Los datos se cargarán en Firestore automáticamente

## Notas

- Los datos se cargan solo si no existen previamente (evita duplicados)
- El orden de carga es importante debido a las dependencias
- Los IDs se generan automáticamente en Firestore
- Los mapeos entre entidades se resuelven automáticamente

## Estructura de Referencias

Los archivos JSON usan claves de referencia que se mapean a IDs reales:

- `predioId`: Se mapea a IDs de predios cargados
- `canchaId`: Se mapea a IDs de canchas cargadas
- `franjaHorariaId`: Se mapea a IDs de franjas horarias cargadas

El servicio `cargarDatosEjemplo.js` se encarga de resolver estas referencias automáticamente.


