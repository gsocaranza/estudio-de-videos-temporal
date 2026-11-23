---
name: video
description: Hacer un video explicativo o de capacitación de Puntualiza con el estudio de videos (Remotion + Three.js, con la paleta de la marca y voz de Google), en estilo historia (personajes en varios sets 3D) o corporativo (isométrico y diapositivas). Úsalo cuando el supervisor pida «haz un video», «un video de capacitación», «explica X en video», «un tutorial animado» para colaboradores, administradores o cualquier concepto del ERP. Argumento: qué se explica, a quién y cuánto debe durar.
---

# Hacer un video explicativo

El método completo está en **`docs/videos-explicativos.md`**: léelo entero antes
de empezar, con sus reglas del guion y sus trampas. El estudio vive en
`videos/`.

**Hay dos estilos en uso y se elige por lo que el video tiene que hacer**
(§0 del documento; los eligió el supervisor el 2026-10-16):

- **Historia** — personajes y un problema, en varios sets 3D: el día sin
  Puntualiza y el mismo día con Puntualiza. Ejemplo:
  `videos/src/videos/una-hora-mas/` (`Lugares.tsx` arma los sets,
  `Escenas.tsx` corta entre ellos anclado a palabras). Para capacitación y para
  contar el problema en una venta.
- **Corporativo** — mundo isométrico y diapositivas para explicar datos, la ley
  o el producto desde arriba. Ejemplo: `videos/src/videos/registro-de-jornada/`.

Si no está claro cuál, se pregunta en la parada 1, junto con el guion. Los dos
van con la paleta de la marca y la animación sobria (nada de rebotes); el de
maqueta, «Marca tu jornada», ya no se usa.

**Lo común a los tres formatos** (corto, comercial, video) está en §0.0 del
documento: el control de calidad, la voz con el tono de referencia, los
sonidos y el render final son las mismas piezas en los tres.

## Los cortos verticales para redes (TikTok, Reels, Shorts)

Si el video es un **corto vertical** de la serie para redes
(`docs/cortos-para-redes.md`), **no se sigue este skill sino `/corto`**.
Manda `docs/videos-explicativos/reglas-de-los-cortos.md`, cuyo §0 es el estilo
en una página. Las varas son `la-sal-v7`, `la-carta-v3`, `el-ascenso-v10` y
`el-plazo-v9`, en `videos/out/historial/`.

## Los pasos, y las dos paradas

0. **El brief**: copia `videos/plantillas/brief.md` a `videos/public/<video>/brief.md`
   y llénalo con lo que pidió el supervisor (producto, historia con su hilo
   conductor y transiciones, formato, look, movimiento, sonido, revisión,
   reglas). Va a la parada 1 junto con el guion.
1. **El guion** en `videos/public/<video>/guion.json`, con `velocidad_voz:
   1.15`. Historia: un personaje con nombre, el problema y su consecuencia,
   «volvamos a ese día», el mismo día con Puntualiza, cierre. Corporativo:
   problema → por qué urge (con su artículo de ley) → lo que hace Puntualiza →
   resultado → cierre. Una idea por escena, de 5 a 9 s de voz, y **en las
   historias, un lugar distinto para cada momento** (el supervisor pidió
   «varias escenas y escenografías»).
   Cada dato legal se verifica en los documentos del proyecto y cada función
   prometida se busca en el código.
   **Parada 1: enséñale el guion al supervisor antes de generar la voz.**
   Revisa contra las reglas del producto: nada que no esté construido, ninguna
   industria nombrada, nada de cuánto se paga, las palabras de la pantalla.
2. **La voz, con el tono de referencia** (§0.0 y paso 2 del documento): el
   guion lleva `direccion_voz` (parte de la de `public/el-ascenso/guion.json`).
   Una tanda con
   `python herramientas/tomas-en-paralelo.py <video> 10 out/tomas/<video>`;
   gana la más cercana al tono, y si queda por encima de 3, otra tanda. La
   eliges tú, no el supervisor. Se parte con
   `WHISPER=medium timeout 600 python herramientas/narra-toma.py <video> --toma out/tomas/<video>/cruda-<k>.wav`.
   Si la voz pasa de ~1:30, todavía no se ha probado en una sola toma: usa
   `narra.py`, una pista por escena.
3. **La coreografía** en `videos/src/videos/<video>/` (`Video.tsx` +
   `Escenas.tsx`), con el kit de `videos/src/kit/`. Todo momento se ancla a una
   palabra con `w(id, 'palabra')`; nada de segundos a mano. Nada de `useFrame`.
   Registra la composición en `videos/src/Raiz.tsx`.
4. **El borrador**: `npx tsc --noEmit`, luego
   `npx remotion render <video> <tmp>/borrador.mp4 --scale=0.5` (~1 min) y
   `python herramientas/contactos.py <video> <tmp>/borrador.mp4 <tmp>/hoja.png`
   (con `--en 0.3` y `--en 0.85` además de la mitad), y la revisión fina de
   cada escena: `contactos.py <video> <mp4> <png> --cada 0.5 --escena <id>`.
   **Critica como directora de motion design** (historia, composición,
   espacios, tipografía, ritmo, profundidad, legibilidad, sonido): personajes
   cortados, tarjetas encima de caras, texto partido, objetos que se tapan.
   **Al menos cuatro rondas**, anotando cada una en
   `videos/public/<video>/revision.md` (qué estaba débil, qué cambiaste).
   **Parada 2: enséñale las hojas de contacto al supervisor antes del render final.**
5. **El final**: `VERSION=<n> LIGERO=1 bash herramientas/final.sh <video>` →
   `videos/out/<video>.mp4` (1080p), `<video>-ligero.mp4` (720p, para mandar) y
   la copia en `out/historial/`, con el audio normalizado. `out/` no se
   versiona: el código sí.
6. **El control de calidad**, siempre, sobre el final:
   `WHISPER=medium python herramientas/control-de-calidad.py <video>` (animación,
   audio y voz; reconoce solo que es un video). Mira sus hojas en
   `out/calidad/<video>-vN/`. Lo que falle se arregla y se vuelve al paso 5.
7. **Commit y `bash scripts/publica.sh`**, y al supervisor la versión final.

Si el guion lo trae Oscar (escrito con las instrucciones de
`docs/videos-explicativos/instrucciones-para-guiones.md`), llega en tres partes:
el brief, el JSON listo para `guion.json` y la tabla de lo que se ve. Se
verifica contra el código lo que promete, se guarda tal cual y se sigue desde
la voz; sus «PREGUNTA PARA SEBASTIÁN» se contestan antes de narrar.

Si el supervisor trae un video de referencia nuevo para imitar, primero se
desarma con `videos/herramientas/analiza-referencia.py` (corre en el servidor;
ver su cabecera) y lo que sale va a `docs/videos-explicativos/referencias/`.

Al terminar: lo que se aprendió de nuevo (una receta, una trampa) va al
documento el mismo día, y una pieza que sirva a otro video sube al kit.
