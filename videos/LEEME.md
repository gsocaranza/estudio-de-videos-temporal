# El estudio de videos

Videos explicativos de Puntualiza hechos con código: Remotion + Three.js.
**El método, las reglas y el kit están en `docs/videos-explicativos.md`**; el
skill `/video` lo sigue paso a paso.

```bash
cd videos
npm install                                   # una vez
python herramientas/sonidos.py                # una vez: efectos y música
python herramientas/narra.py <video>          # voz + duraciones + palabras
npm run estudio                               # mirarlo en el navegador
npx remotion render <video> borrador.mp4 --scale=0.5
python herramientas/contactos.py <video> borrador.mp4 hoja.png
bash herramientas/final.sh <video>            # → out/<video>.mp4
```

| Carpeta | Qué hay |
|---|---|
| `src/kit/` | Lo que comparten todos los videos: sonido, curvas, línea de tiempo, paleta, y el kit del estilo maqueta (muñeco, sets, utilería, gráficos) |
| `src/kit/corporativo/` | El kit de los dos estilos en uso. Corporativo: mundo isométrico (`Iso.tsx`) e interfaz (`Interfaz.tsx`). Historia: personas (`Persona.tsx`), sets (`Sets.tsx`), lienzo (`EscenaHistoria.tsx`) y pantallas y etiquetas sin `Html` (`Proyeccion.tsx`) |
| `src/videos/<video>/` | La coreografía de un video |
| `public/<video>/` | Su guion, su voz (`voz/*.wav`), `duraciones.json` y `palabras.json` |
| `public/sonidos/` | Efectos y música, sintetizados por `herramientas/sonidos.py` |
| `public/fuentes/`, `public/marca/` | TASA Orbiter y el isotipo |
| `herramientas/` | Voz, sonidos, hoja de contacto, render final, y el análisis de referencias con Gemini |
| `out/` | Los MP4 (no se versionan) |

## Lo medido el 2026-10-16

«Marca tu jornada», 1:04, en este equipo (Ryzen 5 3600, GT 1030):

| | |
|---|---|
| Borrador a media resolución | 51 s |
| Final 1080p + normalizar audio | 1 min 21 s |
| Peso del final | 12 MB |
| Voz (9 escenas) | ~20 s con Google TTS, más ~30 s de Whisper |

«El registro de jornada», 1:31, estilo corporativo:

| | |
|---|---|
| Borrador a media resolución | 1 min 16 s |
| Final 1080p + versión ligera | 2 min 14 s + ~20 s |
| Peso | 44 MB el de 1080p · 4.5 MB el ligero (720p) |

«Una hora más», 1:08, estilo historia (seis lugares, siete personajes):

| | |
|---|---|
| Borrador a media resolución | 58 s |
| Final 1080p + versión ligera | 1 min 39 s |
| Peso | 18.6 MB el de 1080p · 3.7 MB el ligero |

Los tres videos de venta de Asistencia (`venta-historia`, `venta-beneficios`,
`venta-corto`) se renderizan igual: `bash herramientas/final.sh <id>`.
