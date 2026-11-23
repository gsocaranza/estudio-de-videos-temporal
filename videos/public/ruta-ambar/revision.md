# Revisión · La ruta de la transición · Logística Ámbar

## La voz

Tres tandas de ocho tomas. Ninguna bajó de 3 contra el tono de referencia: en
una toma de 2:13 la voz se asienta más grave que en un corto (164–174 Hz contra
200). Con la dirección de «El ascenso» tal cual salió peor (6.5); ganó la
`cruda-1` de la segunda tanda (5.34), con la dirección de divulgación «que
presenta un plan de trabajo». Partida con Whisper `small` (la `medium` en una
toma de 2:13 pasa de diez minutos); «entrega-recepción» y «sistema ISO» se
comprobaron con `medium`. La voz dice «firme» en la escena 6: los dos modelos lo
oyen igual, y el control de calidad no lo marca.

## Ronda 1 — hojas de contacto del primer borrador

- **La línea del tiempo encimaba «Entrega-recepción» y «Documentación 2027»**:
  a escala de días, del 1 al 10 de diciembre hay 232 px. → Los pasos van a
  distancias iguales y los días se reparten entre dos pasos.
- **Escena 2: la leyenda caía sobre un edificio** y se leía tinta sobre tinta.
  → Píldoras blancas y un velo sobre el mundo mientras la línea se presenta.
- **Escena 17: ~2 s de cortina vacía** (el título esperaba la palabra «canal»,
  a media frase). → El título entra al empezar la escena.

## Ronda 2 — cuadros cada medio segundo (02, 05, 10, 17, 18)

- **En grande, «Formalización» se salía de la tarjeta.** → Línea más angosta
  dentro de la tarjeta.
- **Escena 5: la tarjeta tapaba un centro y la franja cortaba el de abajo.** →
  El mundo un poco más abajo y a la derecha, y la cámara ya no se acerca al
  centro con la tarjeta puesta.
- **El último renglón de cada tarjeta se veía menos de un segundo** («Sin
  costo», el acta, la decisión). → Cola de 24–26 cuadros en esas escenas.
- **Escena 18: un segundo vacío y el logotipo congelado 4 s.** → La reunión
  entra al empezar; el logotipo deriva despacio.

## Ronda 3 — cuadro suelto de la escena 5

- **En la franja de abajo, las etiquetas 3 y 4 todavía se tocaban.** → Letra
  de 24 y la línea más ancha (1,360 px).
- **La tarjeta seguía mordiendo el centro de la izquierda.** → El mundo, otro
  poco a la derecha.

## Ronda 4 — control de calidad sobre la v1

- Audio y voz pasan (−15.5 LUFS, pico −2.5 dBTP, 91 % de las palabras; «Maryana»
  es como Whisper escribe «Mariana»).
- **Animación: seis tomas congeladas**, todas sobre la cortina carbón (portada,
  ley, la lista de lo que necesitamos, el canal y la reunión): texto quieto
  sobre un fondo liso. → `Deriva` (`Reloj.tsx`): una trama fina que corre y un
  acercamiento lento, con el reloj del VIDEO y no el de la escena, para que una
  cortina que dura varias escenas no salte en cada corte.

---

# v2 · 2026-11-09, con la hoja de ruta del 9 de noviembre

## La voz

Dos tandas de ocho; ganó la `cruda-8` de la primera (6.20 contra el tono de
referencia; la segunda tanda no bajó de 6.96). Partida con `medium`: con
`small` la escena 1 empezaba en «Daniel», porque Whisper escribe «Maryana» y
la primera escena no tenía la regla del hueco que ya tenían las demás. Se
agregó a `narra-toma.py`: lo que queda entre el final de la dirección y la
primera palabra emparejada es de la escena 1. «Firme» en la escena 6 sigue
igual que en la v1.

## Ronda 1 — hojas de contacto del primer borrador

- **«Martes 1 de diciembre de 2026» se partía en dos renglones.** → Tarjeta de
  1,120 px y letra de 66.
- **En la lista de lo que necesitamos (siete renglones) el título quedaba
  cortado arriba** con la deriva, y sobraba espacio abajo. → 130 px arriba.

## Ronda 2 — cuadros cada segundo (06, 10, 12, 18)

- **La tarjeta del paso 5 se quedaba vacía ~4 s**: la fecha esperaba a «martes»,
  al final de la frase. → La fecha entra con «inicio formal».
- 06, 12 y 18 se leen bien; el aviso de la ley se movió arriba a la derecha
  para dejar sitio a «todo firmado y configurado».

## Ronda 3 — control de calidad sobre el final

- Animación, audio y voz pasan (−15.5 LUFS, 91 % de las palabras; «Anelie» es
  como `medium` escribe «Mariana», también a media frase).
- **Pero la escena 1 arrancaba con voz en el cuadro 0**: Whisper puso «Maryana»
  en 13.50 s y el habla empieza en 13.32; el corte (inicio − 60 ms) se comía el
  «Ya». → `narra-toma.py` retrocede el primer corte, de 10 en 10 ms, hasta que
  el audio baja de −45 dB. Ahora empieza con 50 ms de silencio.
