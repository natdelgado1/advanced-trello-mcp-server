# Prueba de soporte Due/Start (ISO 8601)

## Rama
`feat/due-date-support`

## Estado
- ✅ Código implementado (create-card, create-cards, update-card)
- ✅ Build exitoso
- ✅ Commit hecho (no push aún)
- ⚠️ Pendiente: reiniciar Cursor para cargar el nuevo build

## Cómo probar

### 1. Reiniciar Cursor
Cierra y vuelve a abrir Cursor para que cargue el MCP con el nuevo `build/index.js`.
El MCP apunta a: `proyectos/advanced-trello-mcp-server/build/index.js`

### 2. Probar create-card con due
Pedir al asistente crear una tarjeta con fecha de vencimiento, por ejemplo:
> "Crea una tarjeta en Proyecto Facturea lista TODO llamada 'Tarea con vencimiento' con due 2025-03-20"

O manualmente invocar el tool:
- `create-card` con: `name`, `listId`, `due` (opcional, ISO 8601: `YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ss.000Z`), `start` (opcional)

### 3. Probar update-card
Para una card existente:
> "Actualiza la card X poniendo due 2025-03-25"

- `update-card` con: `cardId`, `due` (string o null para borrar), `start` (string o null)

### 4. Verificar en Trello
Comprobar que la card muestra la fecha de vencimiento en el tablero.

## Formato de fechas
- Solo fecha: `2025-03-12`
- Con hora: `2025-03-12T18:30:00.000Z`
- Borrar due: pasar `null` en update-card

## Siguiente paso
Si todo funciona → `git push -u origin feat/due-date-support` y abrir PR al repo upstream.
