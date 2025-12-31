# Índices de Firestore - PlayUp

## Índice Compuesto Requerido para Partidos

Si deseas ordenar los partidos por `fecha` y `hora` simultáneamente en una consulta de Firestore, necesitas crear un índice compuesto.

### Crear el Índice

1. **Opción 1: Usar el enlace del error**
   - Cuando veas el error en la consola, haz clic en el enlace que aparece
   - Firebase Console abrirá la página de creación de índice
   - Haz clic en "Create Index"

2. **Opción 2: Crear manualmente**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto: `playup-3a22d`
   - Ve a **Firestore Database** → **Indexes**
   - Haz clic en **Create Index**
   - Configura el índice:
     - **Collection ID:** `partidos`
     - **Fields to index:**
       - `fecha` - Descending
       - `hora` - Descending
     - **Query scope:** Collection
   - Haz clic en **Create**

### Configuración del Índice (JSON)

Si prefieres usar el archivo `firestore.indexes.json`, puedes agregar:

```json
{
  "indexes": [
    {
      "collectionGroup": "partidos",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "fecha",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "hora",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

### Nota Actual

Actualmente, el código ordena solo por `fecha` en la consulta de Firestore y luego ordena por `hora` en el cliente (JavaScript). Esto funciona bien para la mayoría de casos, pero puede ser menos eficiente si tienes muchos partidos.

Si decides crear el índice, puedes cambiar la consulta en `AdminPartidos.jsx` de:

```javascript
orderBy('fecha', 'desc')
```

a:

```javascript
orderBy('fecha', 'desc'), orderBy('hora', 'desc')
```

Esto moverá el ordenamiento al servidor, lo cual es más eficiente.

