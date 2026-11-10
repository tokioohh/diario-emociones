# Contrato de desarrollo — Diario de emociones (prototipo)

Este documento es la fuente de verdad del prototipo. Si el código y el contrato difieren, se corrige uno de los dos en el mismo cambio.

## 1. Objetivo

Una app de diario emocional para entender los sentimientos, llevar un registro de eventos que cambian el ánimo y revisarlos después. También ayuda a estudiantes y profesionales a avanzar en entregas importantes mediante metas pequeñas, progreso visible y recordatorios locales. La experiencia usa tema nocturno con estrellas y navegación simple.

**Fuera del prototipo:** cuentas, nube, sincronización entre dispositivos, IA o servicios externos, iOS/watchOS, exportar reportes (PDF/archivo), etiquetas de eventos, gráfica de tendencia de largo plazo.

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Plataforma móvil | Expo (SDK 58), React Native, TypeScript, Expo Router |
| Datos | 100 % locales, archivos JSON; sin red |
| Entrada | Nota de texto tipo post + sentimiento elegido en un panel; se guarda en el calendario |
| Sentimiento | Cuadrante ánimo/energía (plano táctil) + hasta 3 palabras opcionales |
| Cierre del día | Resumen automático (reglas locales) + puntuación 1–10 |
| Reporte | Semanal, visible dentro de la app |
| Reloj | Wear OS (Android): registro rápido + recordatorio diario |
| Extras | Bloqueo con huella/PIN; recordatorio diario; plan local de entregas con pasos y recordatorios |

## 3. Arquitectura

```
┌───────────────────────── Teléfono (Expo) ─────────────────────────┐
│  UI (expo-router)         src/app, src/ui                         │
│     │                                                             │
│  Store (React context)    src/core/store.tsx   ← única vía de     │
│     │                     escritura; persiste tras cada cambio    │
│  Lógica pura              summary.ts · report.ts · emotions.ts    │
│     │                                                             │
│  Storage JSON             src/core/storage.ts (expo-file-system)  │
│     └─ <documentDirectory>/diary/                                 │
│          settings.json · YYYY-MM.json · planner.json · inbox/     │
│                                      ▲                            │
│  WearInboxService (Kotlin, plugin)───┘ escribe inbox/             │
└──────────────────────────▲────────────────────────────────────────┘
                           │ Wearable Data Layer (DataClient)
┌──────────────────────────┴────────────────────────────────────────┐
│  Reloj Wear OS (Kotlin, Compose) — wear/                          │
│  Registro rápido · recordatorio diario (AlarmManager)             │
└───────────────────────────────────────────────────────────────────┘
```

Reglas de capas: la UI no toca el disco; `core/*.ts` (summary, report, emotions, dates) son funciones puras sin React ni E/S; solo `storage.ts` y `watchInbox.ts`/`store.tsx` hablan con archivos.

## 4. Estructura del repositorio

```
src/app/            rutas: (tabs)/index|plan|calendario|reporte, nueva-entrada, nueva-entrega, entrega/[id], cierre, ajustes
src/core/           types, dates, emotions, planner, summary, report, storage, store, notifications, watchInbox
src/ui/             Screen, Starfield, MoodPad, MoodSheet, DatePickerSheet, Chip, EntryCard, LockGate, theme
plugins/            withWearBridge.js (config plugin Android)
wear/               proyecto Android Studio del reloj (Kotlin + Compose para Wear OS)
contrato.md         este archivo
```

## 5. Modelo de datos

Un archivo por mes (`diary/2026-11.json`) mantiene los archivos pequeños y acota el daño de una corrupción.

```json
{
  "version": 1,
  "month": "2026-11",
  "entries": [
    {
      "id": "m3k9x1ab12cd",
      "at": "2026-11-10T20:40:12.000Z",
      "day": "2026-11-10",
      "text": "Presenté el proyecto y salió mejor de lo que esperaba.",
      "mood": { "valence": 0.62, "energy": 0.35 },
      "labels": ["Orgulloso", "Alegre"],
      "source": "phone"
    }
  ],
  "closings": {
    "2026-11-10": {
      "score": 7.8, "headline": "Un buen día",
      "lines": ["Registraste 3 momentos.", "…"],
      "entryCount": 3, "closedAt": "2026-11-10T23:10:00.000Z"
    }
  }
}
```

- `at` es UTC; `day` es la fecha **local** al momento de crear la entrada y es la clave de agrupación (no se recalcula si cambia la zona horaria).
- `valence` y `energy` ∈ [−1, 1]. `valence` negativa = desagradable; `energy` negativa = baja.
- `id`: generado en el teléfono; las entradas del reloj se guardan como `w-<uuid>` (evita duplicados al importar).
- `source`: `phone` | `watch`. Las entradas del reloj no tienen texto.
- `settings.json`: `{ version, lockEnabled, reminder: { enabled, hour, minute } }`.
- `planner.json`: `{ version: 1, deliverables: [...] }`. Cada entrega conserva tipo, contexto, fecha límite, pasos con fecha y estado de finalización, preferencia de avisos y las identificaciones de sus notificaciones locales.
- Un archivo ilegible se ignora (la app abre igual); no se sobrescribe hasta que haya una escritura nueva del mismo mes.

## 6. Reglas de negocio

**Cuadrante** (centro del plano = 0,0): valence ≥ 0 y energy ≥ 0 → *Animado*; valence < 0 y energy ≥ 0 → *Tenso*; valence < 0 y energy < 0 → *Apagado*; valence ≥ 0 y energy < 0 → *Sereno*. Cada cuadrante tiene un color fijo y 6 palabras (catálogo en `src/core/emotions.ts`). Al cambiar de cuadrante en el panel se limpian las palabras elegidas.

**Puntuación del día** = `1 + (media(valence) + 1) / 2 × 9`, con un decimal.

**Resumen automático** (sin IA; ver `summary.ts`), en este orden: número de momentos; ánimo predominante; palabras más repetidas (hasta 3); tendencia (compara la primera y la segunda mitad del día, umbral ±0,3); mejor y peor momento si hay ≥ 2 entradas con diferencia ≥ 0,4; nivel de energía (±0,25). Titular: «altibajos» si la diferencia entre extremos ≥ 1; si no, por puntuación (≥ 8 muy bueno, ≥ 6,5 bueno, ≥ 4,5 regular, ≥ 3 difícil, resto muy difícil).

**Cierre:** guarda el resumen en `closings[día]`. Si se agregan entradas después, la pantalla de cierre ofrece «Actualizar cierre». Calendario y reporte usan la puntuación calculada en vivo; el cierre solo marca el día como cerrado.

**Reporte semanal** (lunes a domingo): puntuación media, días con registro, entradas, días cerrados, energía media, barras por día, distribución por cuadrante, palabras más frecuentes, hasta 3 entradas con texto que más pesaron y 3 que más ayudaron, y el momento del día con ánimo más bajo (solo si hay ≥ 2 entradas y es ≥ 0,15 menor que la media).

**Plan de entregas:** cada entrega es un proyecto, examen o tarea, con fecha límite y contexto opcional. La app sugiere pasos cortos según el tipo y el tiempo disponible; las fechas de los pasos se distribuyen hasta la fecha límite y los títulos se pueden editar. El avance es la proporción de pasos marcados. Completar el último paso cierra la entrega. El detalle ofrece un temporizador voluntario de cinco minutos; no marca pasos automáticamente. Los recordatorios se programan localmente para los pasos futuros, a la hora elegida, y cada entrega permite apagarlos. Cambiar o eliminar una entrega cancela sus avisos anteriores. Los avisos del plan y el recordatorio diario se administran por separado.

## 7. Pantallas

| Ruta | Contenido |
|---|---|
| `(tabs)/index` Hoy | Engranaje, fecha, último sentimiento, acceso al siguiente paso del plan, línea del día, tarjeta de cierre, entradas y botón **Nueva entrada** |
| `(tabs)/plan` Plan | Próxima entrega, progreso de entregas activas, entregas completadas, estado vacío y acción para crear un plan |
| `nueva-entrega` (modal) | Tipo, nombre, contexto opcional, fecha límite, pasos sugeridos editables, hora y activación de recordatorios |
| `entrega/[id]` | Fecha límite, progreso, pasos marcables, siguiente paso, temporizador voluntario de cinco minutos y edición/eliminación |
| `nueva-entrada` (modal) | Campo de texto grande; **Agregar sentimiento** abre el panel (plano + palabras); **Guardar** exige sentimiento, el texto es opcional |
| `cierre` (modal) | Puntuación grande, titular, líneas del resumen, **Cerrar el día** |
| `(tabs)/calendario` | Mes con semanas desde lunes, celda coloreada por el ánimo medio del día, ✓ si está cerrado, detalle del día seleccionado |
| `(tabs)/reporte` | Reporte semanal con flechas de semana |
| `ajustes` (modal) | Bloqueo, recordatorio (hora y minutos), nota sobre datos |

Eliminar una entrada: mantener presionada su tarjeta → confirmación. No hay edición en el prototipo.

## 8. Seguridad y privacidad

- Ninguna llamada de red, sin analíticas, sin cuentas. `android.allowBackup = false` para que el diario no viaje en copias de seguridad de Google.
- Bloqueo: `expo-local-authentication` con huella/rostro y PIN del sistema como alternativa. Se activa solo si el teléfono tiene un bloqueo configurado y tras autenticarse. Se vuelve a pedir al regresar de segundo plano.
- Los datos viven en el directorio privado de la app (sin cifrado propio; cifrado en reposo = fase 2).
- Todo dato que llega del reloj se valida antes de guardarlo (`parseWatchEntry`: tipos, rangos, longitud de palabras).

## 9. Contrato teléfono ↔ reloj

**Transporte:** Wearable Data Layer, `DataClient.putDataItem` (urgente). Se sincroniza solo cuando el teléfono vuelve a estar en alcance.

**Condición:** el `applicationId` del reloj debe ser **igual** a `android.package` del teléfono (`com.diarioemociones.app`) y ambos deben firmarse con la misma clave en builds de distribución.

**Mensaje** — ruta `/diario/entrada/<uuid>`:

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | UUID v4 |
| `at` | string | ISO 8601 UTC (`Instant.now().toString()`) |
| `valence`, `energy` | double | −1..1; el reloj envía ±0,6 según el cuadrante tocado |
| `labels` | string[] | 0–1 palabra del catálogo del teléfono (el reloj usa 4 por cuadrante) |

**Recepción:** `WearInboxService` (inyectado por `plugins/withWearBridge.js`) escribe `diary/inbox/<id>.json` y borra el DataItem. La app importa los archivos al abrirse y cada vez que vuelve a primer plano; los borra **después** de guardar el mes.

**Recordatorio del reloj:** `AlarmManager.setInexactRepeating`, diario a las 21:00 (constante en `Reminder.kt`), se reprograma al arrancar el reloj. El reloj declara `notificationBridgeMode = NO_BRIDGING` para no duplicar el recordatorio del teléfono. *Fase 2:* sincronizar la hora desde los ajustes del teléfono.

## 10. Criterios de aceptación y estado

| # | Criterio | Estado |
|---|---|---|
| 1 | Crear entrada: texto → panel → guardar; aparece en Hoy y colorea el día en el calendario | Implementado |
| 2 | Cerrar el día genera resumen y puntuación; se ve en Hoy y Calendario | Implementado |
| 3 | Reporte semanal navegable por semanas | Implementado |
| 4 | Datos solo en JSON local; reabrir la app conserva todo | Implementado |
| 5 | Bloqueo con huella/PIN al abrir y al volver de segundo plano | Implementado (probar en dispositivo) |
| 6 | Recordatorio diario configurable | Implementado (probar en dispositivo) |
| 7 | Registro rápido desde Wear OS llega al diario | Código escrito, **sin compilar ni probar** |
| 8 | Recordatorio en el reloj | Código escrito, **sin compilar ni probar** |
| 9 | Crear entrega, generar pasos, marcar avances y conservarlos en almacenamiento local | Implementado; lógica cubierta por pruebas |
| 10 | Avisos de pasos futuros y recordatorio diario funcionando en paralelo | Implementado; validar entrega real en dispositivo |

Verificado en el entorno de desarrollo: `tsc --noEmit` sin errores, bundle de Android con Metro, `expo prebuild` genera el servicio y el manifiesto del puente. Pendiente: ejecutar en un teléfono y un reloj reales.

## 11. Cómo correr

**Teléfono (solo la app, sin reloj):** `npm install` y `npx expo start`; abrir con Expo Go. Si las notificaciones locales no funcionan en Expo Go, usar el build de desarrollo.

**Teléfono con puente al reloj:** requiere build nativo — `npx expo run:android` (Android Studio/SDK instalados) o `eas build --profile development`.

**Reloj:** abrir `wear/` en Android Studio, sincronizar Gradle, emparejar un reloj o emulador Wear OS con el teléfono (Emulator Wear OS + teléfono con Google Play Services) y ejecutar el módulo `app`. Las versiones de Gradle/Compose están fijadas a releases conocidos; Android Studio puede proponer actualizarlas.

## 12. Fase 2 (propuesto, no comprometido)

Exportar el reporte (PDF o archivo), etiquetas de eventos/disparadores, gráfica de tendencia mensual, sincronizar hora de recordatorio con el reloj, cifrado en reposo, editar entradas, copia de seguridad manual del JSON, iOS + Apple Watch.
