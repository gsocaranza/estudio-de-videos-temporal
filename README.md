# Cómo se hizo un video de propuesta con código (Remotion + Three.js)

Copia temporal del estudio de videos de Puntualiza, recortada a **un solo video**:
«La ruta de la transición», una presentación de 2:35 que explica a un cliente el
plan de puesta en marcha, paso por paso y con fechas.

> **Los datos del cliente son ficticios.** Lo que salió al cliente real llevaba su
> nombre, el de su gente y los contactos del despacho; aquí se cambiaron por
> «Logística Ámbar», nombres inventados y un correo y teléfono de ejemplo. Por lo
> mismo **no se incluyen las grabaciones de voz** de ese video: se regeneran.

## Qué hay

| Ruta | Qué es |
|---|---|
| `videos/public/ruta-ambar/brief.md` | El brief: qué se explica, a quién, qué se deja fuera, look, sonido y reglas |
| `videos/public/ruta-ambar/guion.json` | El guion por escenas, con la dirección de la voz |
| `videos/public/ruta-ambar/revision.md` | Las rondas de revisión con hojas de contacto, y lo que se corrigió en cada una |
| `videos/src/videos/ruta-ambar/` | La coreografía: escenas, línea del tiempo, reloj, mundo isométrico |
| `videos/src/videos/registro-bolanos/`, `registro-de-jornada/` | Videos de los que éste toma piezas (el logotipo final, el mundo isométrico) |
| `videos/src/kit/` | El kit compartido: sonido, curvas, paleta, fuentes, montaje, estilo corporativo |
| `videos/src/bolanos/` | El tema de marca (paleta y tipografía) y la entrada de Remotion |
| `videos/herramientas/` | Voz (Google TTS / Gemini), Whisper para las marcas por palabra, sonidos sintetizados, hojas de contacto, render final y control de calidad |
| `docs/videos-explicativos.md` | El método completo del estudio |
| `.claude/skills/video/SKILL.md` | El paso a paso que sigue Claude Code para hacer un video |

## El método, en corto

1. **Brief** → **guion** por escenas (`guion.json`).
2. **Voz en una sola toma** (`narra-toma.py`, voz Kore) y **Whisper** para saber cuándo
   empieza cada palabra: la imagen se sincroniza con palabras, no con segundos, así
   que volver a narrar no descuadra nada.
3. **Coreografía en React** (Remotion) con un mundo isométrico en Three.js y una
   línea del tiempo como hilo conductor.
4. **Revisión con hojas de contacto** (`contactos.py`), al menos cuatro rondas.
5. **Render final** con audio normalizado (`final.sh`), en 1080p y en versión ligera.

## Reproducirlo

Requisitos: Node 20+, Python 3, ffmpeg, `pip install openai-whisper`, y para la voz
`gcloud` con acceso a Text-to-Speech (o una llave de Gemini para `voz-gemini.py`).

```bash
cd videos
npm install
python herramientas/sonidos.py                                         # efectos
python herramientas/sonidos.py musica-corporativa musica-ruta-ambar 168 # música
python herramientas/narra-toma.py ruta-ambar                           # voz + palabras
npm run estudio                                                        # mirarlo
ENTRADA=src/bolanos/index.ts bash herramientas/final.sh ruta-ambar     # → out/
```

La entrada de Remotion apunta a `src/bolanos/index.ts`, que sólo registra este video
y su pieza hermana.
