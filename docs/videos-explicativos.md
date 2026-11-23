# Videos explicativos — el estudio

> **Qué es.** La manera de hacer, con Claude, videos de capacitación y de
> conceptos para Puntualiza —para colaboradores, para administradores y para
> lo que venga del ERP—. Todo sale de código: el guion es un JSON, la voz la
> genera Google, la imagen es React + Three.js dentro de Remotion, y el MP4 se
> arma cuadro por cuadro en este equipo.
>
> **Pedido por el supervisor el 2026-10-16.** **El skill `/video` sigue este
> documento paso a paso.**

---

## 0. Tres estilos, y cuándo se usa cada uno

| | **Historia** | **Corporativo** | Maqueta |
|---|---|---|---|
| Video de ejemplo | «Una hora más» (1:08) | «El registro de jornada» (1:31) | «Marca tu jornada» (1:04) |
| Para | **Contar un problema con personajes**: el día sin Puntualiza y el mismo día con Puntualiza. Capacitación de colaboradores y supervisores, y el problema en una venta | **Explicar con datos**: la ley, cifras, el producto visto desde arriba. Presentaciones a empresas, ventas, administradores | Ya no se usa: era el primero y el supervisor lo encontró aniñado |
| Se ve | Personas de proporción adulta, sin rostro, con ropa de oficina, en **varios sets 3D con perspectiva** (oficina, oficina del supervisor, sala de audiencias, recepción, calle) | Mundo isométrico de la marca y **diapositivas**: titulares, gráficas, tarjetas del panel | Muñecos de clavija con ojos en cuartos pastel |
| Color | Los neutros de la marca; madera clara y verde apagado para que no se vuelva frío; color de estado sólo con significado | Monocromo de la marca | Pastel cálido |
| Se mueve | Personajes que caminan, se sientan, teclean, usan el teléfono y el kiosco; cámara que se desliza; tarjetas que entran sin rebote | Interfaz sin rebote; cámara que viaja sin cortes | Rebotes y bamboleo |
| Cuenta | El mismo día dos veces | Problema → ley → Puntualiza → cumplimiento | El mismo día dos veces |

**Lo decidió el supervisor el 2026-10-16, en tres pasos.** Vio el de maqueta y
pidió «colores de marca, más formal, tipo empresa, nada aniñado» y la voz más
rápida; vio el corporativo y dijo que le gustó «el de 2D con diapositivas»,
pero que también quería «crear historias de personajes y problemas, como en el
otro video», en 3D, «con varias escenas y escenografías, que estén bien
completos para que comuniquen bien el mensaje». De ahí sale el estilo
historia. **Los dos se usan**: se elige por lo que el video tiene que hacer. Un
video largo puede mezclarlos (la historia del problema y luego las
diapositivas de la ley).

## 0.0 Lo común a los tres formatos

El estudio hace tres cosas, y cada una tiene su skill, porque sus reglas
chocan entre sí:

| | **Corto** (`/corto`) | **Comercial** (`/comercial`) | **Video** (`/video`) |
|---|---|---|---|
| Formato | Vertical 1080×1920, 50–65 s, 30 fps | Horizontal 1920×1080, 30 s, 60 fps | Horizontal 1920×1080, 1–2 min, 30 fps |
| Voz | Sí | No: música y efectos | Sí |
| Para | Redes, sin vender | Lanzamiento, vende una cosa | Capacitación y ventas |
| Las reglas | `videos-explicativos/reglas-de-los-cortos.md` | `videos-explicativos/comerciales.md` | este documento |

**Los skills no se llaman entre sí**: cada uno carga sólo las reglas de su
formato. Lo que comparten está **en las piezas de abajo, no copiado en tres
sitios**, así que una mejora en una pieza llega a los tres de una vez
(2026-10-23, a pregunta del supervisor: «¿no tendrían que combinarse?»).

| Pieza | Qué hace | Quién la usa |
|---|---|---|
| `videos/` con Remotion | el estudio entero: `npm ci` una vez por copia | los tres |
| `herramientas/sonidos.py` | sintetiza efectos y música, idénticos cada vez (`public/sonidos/` no se versiona) | los tres |
| **La voz con el tono de referencia**: `tomas-en-paralelo.py` + `tono.py` + `narra-toma.py` | una tanda de 8–12 tomas en el servidor (~1 min), ordenadas por su parecido a `plantillas/voz-de-referencia.wav` (El ascenso v5, la voz que eligió el supervisor); gana la más cercana y se parte por escenas con Whisper. Probado con guiones de hasta 205 palabras (~1:30) | cortos y videos |
| `contactos.py` | la hoja de contacto: un cuadro de cada escena | cortos y videos |
| `voz-ivr.py` | **la voz de un sistema telefónico**: las escenas `"voz": "ivr"` del guion se narran aparte con otra voz y filtro de línea (300–3,400 Hz); la narradora se las salta. Nació con «Marcar por llamada» (2026-11-04) | videos |
| **`control-de-calidad.py`** | sobre el MP4 final: animación (tomas congeladas, cuadros negros), audio (volumen, pico real, silencios muertos) y voz contra el guion. **Adivina el formato** (vertical con guion = corto, horizontal con guion = video, sin guion = comercial) y aplica a cada uno lo suyo: la auditoría del guion y del estilo sólo a los cortos; la voz no al comercial; la toma quieta cuenta desde 2 s en un corto, 4 s en un video y 1.5 s en un comercial (salvo el logo final); el volumen va a −14 LUFS en un corto y a −16 en los otros dos | los tres |
| `final.sh` | el render final normalizado; con `VERSION=n` guarda `out/historial/<video>-vN.mp4` sin sobrescribir | los tres |
| El movimiento de launch-motion (`referencias/launch-motion/leccion.md`) | curvas suaves, la cámara que viaja en vez de cortar, el sonido en el corte | comerciales y cortos; un video que lo necesite lo toma igual |
| Una sola ronda de revisión, completa | se arregla lo que el control y la hoja encuentran y se entrega la versión final, sin dar opciones a elegir | los tres |

**Una pieza nueva que sirva a más de un formato** va aquí y en los skills que
la usen, el mismo día. Lo que sólo sirve a uno se queda en su documento.

---

## 0.0.1 Guiones que escribe Oscar

Desde el 2026-10-16 Oscar escribe guiones con su propio Claude. Las
instrucciones que pega están en
`docs/videos-explicativos/instrucciones-para-guiones.md`: lo que Puntualiza
hace (sacado del código), los datos legales, las reglas del guion, los dos
estilos con los lugares y personajes que ya existen, y el formato de entrega en
tres partes: **brief**, **guion en el JSON de `guion.json`** y **una tabla de lo
que se ve con los momentos anclados a palabras**. Cuando llegue uno, se revisa
contra el código (lo que prometa), se pasa tal cual a `public/<video>/` y se
sigue desde el paso de la voz. **Si cambia una función del producto, esas
instrucciones se actualizan el mismo día.**

## 0.1 El estilo historia

Sin referencia externa: es el formato del primer video —personajes, un día
concreto, contado dos veces— con el tono y la animación del corporativo. El
ejemplo es «Una hora más»: Ana se queda una hora extra, la anota en papel, a
fin de mes nadie puede comprobarla y en un juicio la empresa no tiene con qué;
«el mismo jueves, con Puntualiza»: marca en el kiosco, sale marcando desde el
teléfono, y Luis ve en la hoja de jornada lo mismo que ella.

### Reglas del estilo historia

| | Regla | Dónde vive |
|---|---|---|
| **Personas** | `Persona`: ~1.75 de alto, cabeza de un séptimo, **sin rostro**, ropa de oficina en neutros. Articulada (cadera, rodilla, hombro, codo, tronco, cabeza). El elenco con nombre y vestuario está en `ELENCO`; la composición `elenco` los pone en fila para revisarlos | `kit/corporativo/Persona.tsx`, `src/videos/elenco/` |
| **Poses** | `pie`, `andar(fase)`, `sentada`, `teclear`, `telefono`, `tocaTelefono`, `llamada`, `tocar` (kiosco), `ademan`, `encoger` (hombros), `asentir`; se pasa de una a otra con `mezclaPose`. Caminar por una ruta: `caminar(f, puntos, desde, velocidad)` devuelve posición, giro y fase sin que los pies patinen | `Persona.tsx` |
| **Sets** | Maquetas con perspectiva: `Cuarto`, `Ventanal` (cielo según la hora), `Escritorio`, `Silla`, `Monitor`, `Teclado`, `Kiosco`, `Mostrador`, `PuertaCristal`, `Planta`, `Reloj`, `Repisa`, `MesaJuntas`, `Pizarron`, `Estrado`, `Balanza`, `Edificio` (ventanas que se encienden), `Farola`, `Arbol`, `Calle` | `kit/corporativo/Sets.tsx` |
| **Lugares** | Cada video arma sus lugares una vez (`Lugares.tsx`) y las escenas los reusan cambiando la hora y quién está | `src/videos/una-hora-mas/Lugares.tsx` |
| **Varias escenografías** | **Una escena puede cortar entre dos lugares** (la calle y la recepción; la oficina de Luis y la sala de audiencias): el corte va anclado a una palabra. Así cada frase tiene la imagen que la explica | `Escenas.tsx` |
| **Luz** | `EscenaHistoria`: día por omisión; `noche` 0→1. **Un interior de noche va con `noche` ~0.25**: la oficina tiene la luz encendida y la noche se ve en el ventanal; con `noche: 1` todo queda gris | `kit/corporativo/EscenaHistoria.tsx` |
| **Pantallas** | Lo que se ve en un monitor o en el kiosco se **dibuja en un canvas** que hace de textura (`PantallaDibujada`, `Dibujo`) con la fuente de la marca | `kit/corporativo/Proyeccion.tsx` |
| **Etiquetas** | Gafetes y notas sobre un personaje: 2D, colocadas proyectando su punto 3D con la misma cámara (`EtiquetaPlana`). **Nunca `Html` de drei en un video que corta de lugar** (ver Trampas) | `Proyeccion.tsx` |
| **Tiempo** | El que camina **llega antes** de la palabra que lo hace actuar: la ruta se mide (distancia ÷ velocidad) contra el ancla. En la primera vuelta el kiosco se puso verde con Ana todavía caminando | — |

---

## 0.2 Videos de venta

El 2026-10-16 el supervisor pidió «un video, tres opciones para elegir, para
vender el complemento de asistencia, con todos sus beneficios y cómo
resolvemos el problema». Las tres opciones son tres formatos, no tres
borradores del mismo:

| Opción | Composición | Duración | Para |
|---|---|---|---|
| **1 · La historia de Carmen** — **la elegida** | `venta-historia` | 2:30 | Juntas con prospectos: una directora con tres centros, el caos de hoy, el reloj checador, el juicio, la ley, y cómo se resuelve |
| **2 · Seis beneficios** | `venta-beneficios` | 1:29 | Sitio web y seguimiento: el costo, la ley, y seis beneficios numerados sobre el mundo isométrico |
| **3 · 45 segundos** | `venta-corto` | 0:44 | Redes y WhatsApp: pregunta gancho, tres beneficios y llamada a la acción; **subtítulos encendidos**, porque ahí se ve sin sonido |

**El supervisor eligió la 1** y pidió alargarla: el reloj checador de huella
que el kiosco reemplaza (con la animación del reemplazo), el reconocimiento
facial y los modos de marcar (NIP, NIP y foto, NIP y rostro; la voz grabada en
la llamada), y todo en un solo lugar (turnos, vacaciones, actas, la hoja de
jornada en el teléfono del colaborador). **Su cierre no lleva texto ni
llamada a la acción**: sólo el isotipo con la voz «Puntualiza», y después la
firma animada «Construido por ingenieros de Zatelital y abogados de Bolaños
Abogados». La voz verificada de la llamada **no** se menciona: su motor no
está construido (`ModoDeIdentificacion::NipVozVerificada`).

Reglas que valen para todo video de venta:

- **Cada beneficio se busca en el código antes de decirlo.** Para estos se
  comprobaron los tres canales, la geovalla (`Geovalla`), la foto del kiosco,
  el número autorizado, las marcas selladas, los turnos, el cálculo de horas
  extra contra los topes del año (`JornadaRule`), las alertas
  (`GeneradorDeAlertas`), las actas firmadas, las vacaciones
  (`LibroDeVacaciones`) y el informe de inspección (`InformeDeInspeccion`).
- **Los datos legales llevan su artículo en pantalla** y salen de lo ya
  verificado (`CLAUDE.md`, pendientes urgentes; `docs/el-metodo-de-la-empresa.md`
  §4.1). Se vende la evidencia en juicio tanto como la obligación de 2027.
- **Sin precios** en el video: el precio lo da la persona de ventas.
- **Cierra siempre con la llamada a la acción**: `CierreConMarca`, «Agenda tu
  demostración» y `puntualiza.com` (comprobado en línea el 2026-10-16).
- **Ningún texto nombra una industria**: «tus centros de trabajo», no un giro.

### La presentación que abre una demo

`presentacion-asistencia` (2026-11-04, 3:24), pedida por el supervisor para
ponerla en la sala antes del recorrido en vivo: **1920 × 1080 a 60 fps y con
voz**, una mezcla que ninguno de los tres formatos tenía. Su pedido, a media
sesión: «no reutilices partes de video ni nada de eso, quiero todo nuevo, con
buenas animaciones, que no se sienta como una presentación de PowerPoint».

- **Es su propia línea de tiempo** (`tiempo.ts`, a 60 cuadros): `kit/linea.ts`
  está fija a 30 y aquí una escena es un **bloque** de varias frases. Por eso
  `contactos.py` no le sirve: se revisa con `ffmpeg` y `tile`.
- **Cámara 3D real con CSS** (`Camara` y `Capa` en `kit.tsx`): `perspective`,
  `preserve-3d` y capas con `translateZ`, que dan paralaje sin Three.js. Una
  pieza con `opacity` aplana lo que lleva dentro: la profundidad va en las capas
  y la opacidad en las hojas.
- **Las transiciones viven en `Video.tsx`**: barrido y caída con desenfoque
  direccional (`feGaussianBlur` con dos desviaciones), iris y zoom que atraviesa.
  El bloque que entra se monta antes de tiempo y el que sale sigue vivo: un bloque
  recibe cuadros negativos y más allá de su fin.
- **El isotipo se anima rayo por rayo**: `herramientas/rayos-del-isotipo.py` parte
  sus 70 subtrazos con su centro.
- **La música se genera con la duración**, porque el cambio a mayor cae en la
  entrada del producto: `python herramientas/sonidos.py musica-presentacion <seg> <drop>`.
- **Lo que costó:** una toma de ~3:15 sí sale en una sola pieza, pero Whisper
  `medium` tarda más de diez minutos en CPU. Se parte con `small` y se verifica con
  `medium` sólo lo dudoso. Un parche con acentos dentro de un heredoc de bash no
  cierra: va como archivo.

### Las piezas que comparten

| Pieza | Qué es | Dónde |
|---|---|---|
| `Montaje` | Escenas, voz, música y subtítulos de un video; `fondo` es la capa que corre debajo sin cortes (el mundo isométrico) | `src/kit/Montaje.tsx` |
| `Lugares` | Oficina abierta, oficina del supervisor o directora, sala de audiencias, recepción y calle | `src/kit/corporativo/Lugares.tsx` |
| `Tomas` | Tomas listas: alguien marca en el kiosco (`TomaKiosco`), con la app (`TomaApp`), por llamada (`TomaLlamada`), y la oficina (`TomaOficina`); el que camina se ajusta para llegar antes de la palabra | `src/kit/corporativo/Tomas.tsx` |
| `Piezas` | `Gafete`, `CanalChip` y `FilaDeCanales`, `Bloqueado`, `CadenaDeMarcas`, `TableroAsistencia`, `CierreConMarca`, y las pantallas dibujadas `pantallaTablero` y `pantallaMarca` | `src/kit/corporativo/Piezas.tsx` |
| `subtitulo` | Campo opcional de cada escena del guion: lo que se lee en pantalla cuando no es lo que se dice («2027» y no «dos mil veintisiete») | `guion.json` |

---

## 0.3 Videos con la marca de otro: los temas

«El registro de jornada» también existe con la marca de **Bolaños Abogados**,
para que Oscar lo distribuya (pedido el 2026-10-16): `registro-bolanos`. No se
duplicó ninguna escena; lo que cambia es el **tema** y el final.

- **El tema** (`src/kit/tema.ts`) cambia colores y fuentes: `aplicaTema()`
  sobrescribe los objetos de la paleta (`marca`, `iso`, `estado`) y las
  fuentes (`usaFuentes`, con `FAMILIA` para el texto y `FAMILIA_TITULOS` para
  los titulares). El de Bolaños está en `src/bolanos/tema.ts`: carbón
  `#2C2E33`, dorado `#D7A55A`, hueso `#F0ECEB` y pizarra `#41474F`, de su
  paquete de marca; **Playfair Display** en los titulares (su logotipo es un
  serif de alto contraste) y **Lato** en el texto, las dos OFL.
- **Cada video con tema tiene su propio punto de entrada** (`src/bolanos/index.ts`),
  que importa el tema antes que nada. Así la paleta ya trae los colores del
  tema cuando el resto de los módulos la lee, y el tema no se cuela en los
  demás videos (cada entrada es un empaquetado aparte). Se renderiza con
  `ENTRADA=src/bolanos/index.ts bash herramientas/final.sh registro-bolanos`.
- **El final** agrega su logotipo armándose —la raya dorada, el monograma y el
  nombre, recortados de su PNG en `public/marcas/bolanos/`— con la voz «Con el
  respaldo de Bolaños Abogados».
- Los archivos de su paquete de marca (logotipos, paleta) están en
  `public/marcas/bolanos/`; el paquete completo, con los papeles del IMPI, no
  se versiona.

### Un plan de trabajo para un cliente: «La ruta de la transición · Ámbar»

`ruta-ambar` (2026-11-06, 2:35), pedido por el supervisor para que Oscar se lo
mande a Logística Ámbar con su correo: la hoja de ruta de la transición de
Recursos Humanos y el piloto de Puntualiza, con la marca de Bolaños y la misma
entrada (`ENTRADA=src/bolanos/index.ts`). Lo que deja:

- **Sale del correo al cliente, nunca del documento interno.** La hoja de ruta
  de Oscar trae columnas, agentes, montos y notas que no son para Ámbar; el
  video dice sólo lo que el correo dice. Lo que el documento promete y la
  plataforma no hace (la firma con NIP de documentos generales) se dice sin
  decir dónde.
- **La línea del tiempo como hilo conductor** (`LineaDeTiempo.tsx`): nace
  grande, se acomoda en una franja abajo y queda encima de todo, también de las
  cortinas, con un marcador que avanza cuando la voz nombra cada paso. **Los
  pasos van a distancias iguales**: a escala de días se enciman.
- **`Reloj` y `Deriva`** (`Reloj.tsx`): una cortina que dura varias escenas se
  mueve con el cuadro del VIDEO (un contexto que pasa por encima de los
  `Sequence`), así no salta en cada corte; la trama que corre y el acercamiento
  lento son lo que hace pasar el `freezedetect` a un texto sobre fondo liso.
  Cuesta bits: el 1080p pasa de 52 a 101 MB; la ligera, 9 MB.
- **La voz de 2:13 en una sola toma sale**, pero no baja de 3 contra el tono de
  referencia: en tomas largas se asienta más grave (165–174 Hz contra 200). Se
  queda la mejor de dos o tres tandas.
- **Música a la medida**: `python herramientas/sonidos.py musica-corporativa
  <nombre> <segundos>`, porque la corporativa dura 110 s.
- **En Git Bash, `VOZ_REMOTO=/tmp/…` necesita `MSYS_NO_PATHCONV=1`**, o la
  ruta remota llega convertida a una de Windows.
- **v2 (2026-11-09)**, con la hoja de ruta del 9 de noviembre: Ámbar ya adoptó
  Puntualiza, así que el piloto pasa a periodo de implementación, sale el paso
  de la decisión y el inicio formal se adelanta al 1 de diciembre. Los seis
  pasos son otros y la línea del tiempo los lee de `PASOS` (los días ya no se
  escriben dos veces). El correo de la v2 trae montos y la permanencia mínima;
  el video sigue sin ellos.

---

## 0.4 La referencia del estilo corporativo

**«WareTrack – Interactive 3D Logistics Dashboard»**, de FY Entertainment —
<https://www.youtube.com/watch?v=ddqVPV9edGk>, 1:18, sin voz. El desarme está
en `docs/videos-explicativos/referencias/corporativo/`. Lo que se copió:

1. **Un gemelo digital, no una caricatura**: lo que se ve es la operación de
   la empresa en maqueta —sitios, gente, datos viajando—, y la interfaz flota
   encima diciendo lo que pasa.
2. **Cámara isométrica** (ortográfica, 45° de giro, ~35° de alto) que **viaja
   sin cortes** por un solo mundo: el mundo es **una capa de todo el video**
   (`Mundo.tsx`), y las escenas de texto lo tapan con una cortina.
3. **Edificios limpios** con remates oscuros y **ninguna cara**: la gente son
   fichas de tablero.
4. **Tarjetas tipo panel**, pines y rutas punteadas por donde corre el dato.
5. **Sonido mínimo**: clic al abrir una tarjeta, barrido cuando la cámara
   viaja, y una pista electrónica tranquila (~115 BPM).

Lo que **no** se copió: la paleta azul de la referencia. Puntualiza es
monocroma y eso es lo que la hace reconocible.

### Reglas del estilo corporativo

| | Regla | Dónde vive |
|---|---|---|
| **Mundo** | Piso de papel con cuadrícula fina; edificios de primitivas (`Oficina`, `Nave`, `Sucursal`) sobre su lote; árboles grises. Con la cámara a 45°, x − z es la derecha de la pantalla y x + z lo de abajo | `kit/corporativo/Iso.tsx` |
| **Gente** | `Ficha`: cápsula y esfera en tinta, sin cara. Su estado es un anillo en la base, que se enciende cuando el panel lo enseña | `Ficha` |
| **Puntualiza** | `Centro`: pedestal negro con el isotipo, que sube del piso; `Ruta` punteada a cada sitio y `Pulso` verde por donde viaja cada marca | `Centro`, `Ruta`, `Pulso` |
| **Etiquetas en el mundo** | `Etiqueta` (Html de drei): siguen a la cámara. **Van debajo de la interfaz**: cada escena se envuelve en una capa con `zIndex: 30` | `Video.tsx` |
| **Interfaz** | `Tarjeta`, `Rotulo`, `Chip`, `Indicador` (cifra que cuenta), `Barras`, `Aviso` (notificación), `Confirmacion`, `Titular` (renglones que suben desde una ranura), `Cortina` (pantalla completa que sube) e `Icono` (trazo de 24 px) | `kit/corporativo/Interfaz.tsx` |
| **Movimiento** | Interfaz: 9 cuadros con `curvas.sale`, 16 px de recorrido, nunca `rebote`. Cámara: viajes de 1.2–1.4 s con `sale` y derivas lineales entre viajes (`recorridoCon`) | `kit/movimiento.ts` |
| **Encuadre** | Si una tarjeta ocupa un lado, **el mundo se corre al otro**: el objetivo de la cámara se mueve contra la derecha de pantalla (`DER = [-3.6, 1, 3.6]`) y se baja el zoom | `Mundo.tsx` |
| **Cifras** | Una gráfica con el eje que no empieza en cero lo dice al pie (`Barras base`) | `Barras` |
| **Voz** | La misma voz, más ágil: `velocidad_voz: 1.15` (~2.6 palabras/s, ~155 ppm) y estilo «presentadora corporativa… segura, clara y profesional». **No** pedir «ritmo ágil» en el estilo además de la velocidad: se suman y salen escenas a más de 3 palabras/s | `guion.json` |
| **Sonido** | `clic`, `barrido`, `aviso`, `golpe`, `tic` y `musica-corporativa` | `herramientas/sonidos.py` |

---

## 0.5 Los cortos verticales para redes

El plan de la serie está en `docs/cortos-para-redes.md`; las cuatro
referencias que lo ordenan, desarmadas, en `referencias/cortos-virales/`. **El
piloto es «Las ocho horas no las inventó Henry Ford»** (`las-ocho-horas`,
2026-10-19): 1080 × 1920, 65 s, se renderiza en 1 min 43 s y pesa 74 MB (2.4 MB
la versión ligera).

| | Regla | Dónde vive |
|---|---|---|
| **Montaje** | `MontajeCorto`: fondo oscuro de la marca o papel por escena (`tono`), la premisa fija arriba, subtítulos de 1 a 3 palabras, la música que se aparta en los silencios (`apartes`) y un acercamiento corto al entrar cada escena. **Ninguna marca**: el único guiño permitido es el isotipo en la pantalla de un teléfono que ya esté en la escena | `src/kit/cortos/Corto.tsx` |
| **Zona segura** | Nada importante en los 290 px de arriba, los 520 de abajo ni los 160 de la derecha (`ZONA`). Se revisa renderizando el borrador con `--props='{"guia":true}'`, que la pinta en rojo | `Corto.tsx` |
| **Ritmo** | Respiro de 3 cuadros y cola de 4 (`RITMO` en el `linea.ts` del video; `arma()` y `enPalabra()` lo reciben), voz a 1.25. `contactos.py` lee el ritmo del mismo sitio | `src/videos/las-ocho-horas/linea.ts` |
| **Subtítulos** | Salen del `subtitulo` del guion, con los tiempos de Whisper palabra por palabra; la palabra que esté en `clave` va en ámbar. **Si el subtítulo y la voz no cuentan las mismas palabras, el render truena**: un subtítulo que no dice lo que se oye no se adivina | `grupos()` en `Corto.tsx` |
| **Colores** | Sobre oscuro, los estados del modo oscuro del panel (`estadoOscuro`); sobre papel, los de siempre | `kit/paleta.ts` |
| **Piezas** | `Sello` (MITO, LEY: la única que golpea), `Metadato` (la fuente en monoespaciada que se escribe), `Cifra` (cuenta), `Entra`, `Grande`, `sacudida` | `src/kit/cortos/Piezas.tsx` |
| **El año en tablero** | `Tablero`: un clip de HyperFrames por cada cambio de año (`anio-flap`, derivada del bloque `split-flap-board`), que arranca en el año anterior y gira sólo las cifras que cambian. Antes de `en` se ve su primer cuadro y después se congela en el último | `src/kit/cortos/Tablero.tsx`, `hyperframes/compositions/anio-flap.html` |
| **Fuentes** | JetBrains Mono (OFL) para años, metadatos y citas | `public/fuentes/`, `FAMILIA_MONO` |
| **Sonido** | `trazo` y `subida`, nuevos; el final a −14 LUFS (`LUFS=-14 bash herramientas/final.sh <video>`), que es a lo que nivelan las redes | `herramientas/sonidos.py`, `final.sh` |

```bash
bash herramientas/hyperframes.sh anio-flap anio-1817-1886 '{"desde":"1817","hasta":"1886"}'
npx remotion render las-ocho-horas borrador.mp4 --scale=0.5 --props='{"guia":true}'
python herramientas/contactos.py las-ocho-horas borrador.mp4 hoja.png      # cuadros verticales, 5 por fila
LUFS=-14 bash herramientas/final.sh las-ocho-horas
```

**Trampas que salieron en el piloto:**

- **HyperFrames carga la fuente tarde**: los primeros cuadros del clip salían
  con la de respaldo. `anio-flap.html` la precarga (`<link rel="preload">`, un
  renglón escondido que la usa y `document.fonts.load`).
- **Whisper parte «52.000» en «52» y «.000»**: `grupos()` los vuelve a pegar
  antes de contar.
- **Whisper oye mal**: escribió «les inventó» y «Cananéa». Por eso el texto
  del subtítulo sale del guion y de Whisper sólo los tiempos.
- **`narra.py` no rehace una pista que ya existe**: cambiar la velocidad o un
  texto es `--rehace` con las escenas.

---

### La segunda versión del piloto (2026-10-19, mismo día)

El supervisor vio la primera «muy estática», con «los colores de Bolaños» (el
fondo carbón con acento dorado se parecía a su paleta), la voz «muy falsa y muy
alegre» y subtítulos todo el tiempo. Lo que cambió, y vale para todo corto:

- **Paleta de Puntualiza**: papel y tinta; negro sólo para los golpes
  (inversiones); **rojo sólo para lo falso** y **verde sólo para lo que es
  ley** (`significado` en `Corto.tsx`). Nada de ámbar ni dorado: la palabra
  clave se invierte (bloque negro, letra clara).
- **La voz es `gemini-3.8-flash-tts` con Kore, en una sola toma**
  (`herramientas/narra-toma.py`): se pide en el servidor (la llave de Gemini
  vive allá; `herramientas/voz-gemini.py`), y se parte por escenas a la mitad
  de cada silencio con Whisper `small`. El tono parejo y las pausas son los de
  la voz. **Ese modelo lee en voz alta la dirección** que va antes del texto
  —no acepta instrucción de sistema ni «Say …:»—, y esa lectura es justo lo
  que le da el tono que eligió el supervisor; `narra-toma.py` la recorta. Los
  modelos de Cloud TTS (`gemini-2.5-flash-tts`, `-pro-tts`, Chirp 3 HD) se
  oyeron falsos o lentos al lado.
- **Treinta tomas de ~2 s, no diez escenas** (`src/kit/cortos/Tomas.tsx`):
  cada toma anclada a una palabra, con cámara que nunca se queda quieta y una
  transición de entrada —barrido con desenfoque direccional (la receta del
  componente `whip-pan-cut` de HyperFrames: `power3.inOut` y 16 px de
  desenfoque a la mitad), empuje, zoom que atraviesa, corte con golpe,
  inversión a negro, destello—. Una toma que queda con menos de 6 cuadros
  truena el render (casi siempre, una palabra ancla repetida: «y»).
- **Cortinillas de HyperFrames** (`Cortinilla`): el muro de palabras
  (`hyperframes/compositions/muro-palabras.html`, derivado de
  `mk-clone-wall-transition`, vertical y con la paleta) tapa los dos cortes
  grandes.
- **Subtítulos sólo en las frases clave** (`"subtitulos": true` en la escena
  del guion), en bloques blancos con tinta; lo demás lo dicen las palabras
  grandes de cada toma. Así lo hacen dos de las cuatro referencias.
- **El guion se escribe como historia**: un gancho, un mundo, un giro, un
  remate; menos fechas en la voz (en pantalla sí).
- **Cronología de inicio a fin** cuando el tema es histórico: el relato va en
  orden y `Cronologia.tsx` pone una línea del tiempo fija debajo de la premisa
  (años a distancias iguales, marcador que avanza en cada salto). El gancho va
  sin fecha para no romperla.
- **Todo en español en pantalla**, también las citas; **contenido centrado** en
  x = 540; la premisa grande y siguiendo el tono de la toma.
- **Cada corto lo audita un agente independiente** antes de darlo por bueno; la
  del piloto está en `public/las-ocho-horas/auditoria.md`.
- **Una sola versión, la completa** (`final.sh` ya no hace la ligera salvo
  `LIGERO=1`).

El segundo desarme de las referencias, enfocado en transiciones, pausas,
texto y cámara, está en `referencias/cortos-virales/*-transiciones.md`
(prompt `herramientas/prompts/transiciones.txt`).

---

## 1. La referencia del estilo maqueta

**«The Importance of Standard Operating Procedures (SOPs)»**, del Southwest
Environmental Finance Center — <https://www.youtube.com/watch?v=nT81nHZyCYM>,
2:26. Lo desarmó Gemini dos veces y lo que vio está en
`docs/videos-explicativos/referencias/sop-swefc/`:

- `desarme.md` — estructura del guion, narración, catálogo de animaciones,
  escena por escena y la transcripción completa.
- `visual.md` — la mirada técnica, a 4 cuadros por segundo: proporciones de
  los muñecos, luz, cámara, gráficos 2D, ritmo y cada efecto de sonido.

### Por qué funciona (y lo que se copia)

1. **Un personaje con nombre y un día concreto.** No explica qué es un SOP:
   enseña a Bill tomando una muestra. El concepto llega solo.
2. **El mismo día dos veces.** Primero sin el procedimiento —y las
   consecuencias se ven—, luego «*Let's go back to the beginning*» y el mismo
   día con él. Es la estructura que más se recuerda, y sirve para casi todo lo
   que Puntualiza resuelve: sin registro / con registro, sin expediente / con
   expediente.
3. **Cada frase tiene su imagen, y cada imagen su sonido.** La tapa cae → se
   oye. El sello baja → golpe. La prueba falla → zumbido. Nada se queda en
   pantalla después de que se dejó de hablar de ello.
4. **Ritmo pausado:** planos de 3 a 5 s, ~130 palabras por minuto, la cámara
   siempre derivando despacio.
5. **Cierra con la moraleja en una frase**, y no con una lista de funciones.

---

## 2. El estilo maqueta, en reglas que se pueden medir

| | Regla | Dónde vive |
|---|---|---|
| **Personajes** | Muñeco de clavija: cuerpo torneado sin brazos ni piernas, cabeza esférica (~40 % del alto), dos ojos de punto, sin boca, manos sueltas flotando a los lados. Mates, sin contorno. Se deslizan meciéndose; no caminan | `kit/Muneco.tsx` |
| **Lugares** | Maquetas: cuarto de tres lados abierto a la cámara, flotando sobre el fondo de la marca; o una tarima redonda cuando no hace falta lugar. Muebles de primitivas con esquinas redondeadas, color plano | `kit/Escenarios.tsx`, `kit/Utileria.tsx` |
| **Color** | Neutros y estados **de los tokens del panel** (`marca`, `estado`); las maquetas en pastel cálido (`escena`); piel y pelo variados (`gente`). Ningún color a mano en una escena | `kit/paleta.ts` |
| **Luz** | Principal arriba a la izquierda con sombra suave; cielo muy alto para que nada llegue a negro; relleno desde la cámara. Sin tone mapping. La tarde entibia la luz (`tarde`) | `kit/Escena3D.tsx` |
| **Cámara** | Lente larga (fov 30°): aplana y da aire de maqueta. **Nunca quieta**: deriva lineal de punta a punta de la escena. Movimientos marcados con la curva suave | `Escena3D`, `recorrido()` |
| **Gráficos 2D** | Pocos y planos, encima del 3D: tarjeta blanca, píldora con nombre, palomita, cruz, sello, círculo de rotulador, burbuja «?». Entran con rebote corto (0.35 s) y se van cuando se deja de hablar de ellos. TASA Orbiter | `kit/Graficos.tsx` |
| **Curvas** | `suave` (0.4, 0, 0.2, 1) para mover; `sale` para entrar; `rebote` (back 1.7) para lo que cae; nada elástico de más | `kit/movimiento.ts` |
| **Transiciones** | Corte seco dentro de un acto; cambio de acto con rebobinado o fundido de 0.5 s; cierre con un iris oscuro hacia la tarjeta final | escenas 4 y 9 del video de prueba |
| **Voz** | Mujer, español de México, cálida y tranquila (Kore, `gemini-2.5-flash-tts`), en tercera persona, ~130 ppm | `herramientas/narra.py` |
| **Sonido** | Voz al 100 %; efectos al 32 %; música al 11 % (~18 dB abajo), con entrada y salida suaves. Un efecto por acción, nunca dos encimados | `kit/Sonido.tsx`, `herramientas/sonidos.py` |
| **Formato** | 1920 × 1080, 30 cps, H.264 CRF 18. Subtítulos apagados por omisión (como la referencia); `subtitulos: true` los enciende para mandarlos por WhatsApp, donde se ven sin sonido | `src/Raiz.tsx` |

---

## 3. Cómo se hace un video nuevo

### Lo que se le pide a Claude

Basta con decir **qué se explica, a quién y en cuánto tiempo**, y nombrar este
documento. Por ejemplo:

> Haz un video explicativo con el estudio de `docs/videos-explicativos.md`:
> cómo un supervisor corrige una marca en la hoja de jornada, para
> administradores, de un minuto. Primero enséñame el guion.

Claude sigue los pasos de abajo y se detiene **dos veces** a enseñar: el guion
(antes de gastar en voz) y las fotos de cada escena (antes de renderizar).

### Paso 1 — El guion (`public/<video>/guion.json`)

```json
{
  "titulo": "Marca tu jornada",
  "estilo_voz": "Lee con voz de narradora mexicana de capacitación, cálida, clara y tranquila.",
  "escenas": [
    { "id": "01-ana", "texto": "Ella es Ana. Hoy se quedó una hora más para terminar un pendiente." }
  ]
}
```

Reglas del guion:

- **Una idea por escena, una o dos frases**, de 4 a 8 s de voz. Si una escena
  necesita tres frases, son dos escenas.
- **Estructura corporativa** (la de por omisión): el problema de hoy (1–2
  escenas) → lo que lo vuelve urgente, con su fuente (1–3: la ley, el juicio)
  → lo que hace Puntualiza, paso a paso (3–4) → cumplimiento o resultado (1) →
  cierre con la marca (1). De 60 s a 2 min. Cada dato legal lleva su artículo
  en pantalla, chico, al pie; y **se verifica contra los documentos del
  proyecto antes de escribirlo** (el 2026-10-16: `CLAUDE.md` → pendientes
  urgentes y `docs/el-metodo-de-la-empresa.md` §4.1).
- **Estructura de maqueta:** gancho con un personaje (1 escena) → el día sin lo
  que se explica y su consecuencia (2–3) → «volvamos a empezar» (1) → el mismo
  día con Puntualiza, paso a paso (3–4) → moraleja (1). En tercera persona y
  con un nombre: «Ana marca su entrada», no «el usuario registra la marca».
- **Antes de prometer una función, se busca en el código.** Para el video
  corporativo se comprobaron las alertas que existen (`GeneradorDeAlertas`,
  `CierreDeJornada`: retardo, falta, salida sin registrar), las horas extra
  dobles y triples contra los topes del año (`JornadaRule`) y el informe de
  inspección.
- **Los años y las cifras se escriben con letra** en el texto de la voz («dos
  mil veintisiete»): así no hay duda de cómo se leen.
- **Lo que manda el producto también manda aquí:** no se enseña nada que no
  esté construido (lo que se enseña se promete); ningún texto nombra una
  industria; ninguna escena dice cuánto se paga —se registra jornada, no se
  calcula nómina—; y las palabras son las de la pantalla (Recursos Humanos,
  centro de trabajo, hoja de jornada, marca).
- **Nada de dos puntos en `estilo_voz`.** Ver «Trampas».

### Paso 2 — La voz

**Desde el 2026-10-23, la misma de los cortos** (§0.0): una sola toma con el
tono de referencia, elegida entre una tanda.

```bash
cd videos
python herramientas/tomas-en-paralelo.py <video> 10 out/tomas/<video>   # ~1 min; las ordena por tono
WHISPER=medium timeout 600 python herramientas/narra-toma.py <video> --toma out/tomas/<video>/cruda-<k>.wav
```

El guion lleva `direccion_voz` (la de `public/el-ascenso/guion.json` es el
punto de partida: el modelo la lee en voz alta y eso le da el tono; después se
recorta) y, si hace falta, `tempo_voz` (p. ej. 1.08). `estilo_voz` y
`velocidad_voz` son de `narra.py` y `narra-toma.py` no los lee. Gana la toma
más cercana: si queda por encima de 3, otra tanda. Deja una pista WAV por
escena, `duraciones.json` (que dimensiona el video) y `palabras.json`:
**cuándo empieza cada palabra**, sacado con Whisper. La voz se genera en el
servidor (`ssh puntualiza-app`), donde vive la llave de Gemini.

`narra.py` —una pista por escena, con `gcloud` y el proyecto
`puntualiza-app-2026`— queda para un video de más de ~1:30 de voz, que no se ha
probado en una sola toma, y para los videos hechos antes de esta fecha.

### Paso 3 — La coreografía (`src/videos/<video>/`)

Una carpeta por video con:

- `Video.tsx` — arma la línea de tiempo con `arma(guion, duraciones, colas)`:
  cada escena dura respiro (0.4 s) + su voz + cola (0.5 s, o la que se le dé).
- `Escenas.tsx` — un componente por escena. Recibe `f` (su cuadro) y `d` (lo
  que dura) **por props**, y todo se calcula de ahí.
- Un set si se repite (como `Oficina.tsx`).

**Todo momento importante se ancla a una palabra**, nunca a un segundo:

```tsx
const w = enPalabra(palabras);
const marca = w('05-entrada', 'marca');      // cuadro en que dice «marca»
const queda = w('05-entrada', 'queda');
<Fx nombre="toque" en={marca} />
<Tarjeta en={marca + 6}>…</Tarjeta>
<Palomita en={queda} />
<Fx nombre="exito" en={queda} />
```

Si el guion cambia y la palabra ya no está, `w()` **truena el render** con la
lista de palabras que sí hay: un video desincronizado en silencio es peor que
uno que no compila.

Y se registra la composición en `src/Raiz.tsx`.

### Paso 4 — Mirarlo antes de renderizarlo

```bash
npm run estudio                     # el estudio de Remotion en el navegador, con línea de tiempo
npx remotion still <video> foto.png --frame=120 --scale=0.5     # una foto suelta
npx remotion render <video> borrador.mp4 --scale=0.5            # el borrador entero (~1 min)
python herramientas/contactos.py <video> borrador.mp4 hoja.png --en 0.5   # un cuadro de cada escena
```

Claude no puede ver el video correr, así que lo revisa con **hojas de
contacto**: un cuadro de cada escena en una sola imagen, rotulado con su id. Se
sacan tres —`--en 0.3`, `0.5` y `0.85`— para ver la entrada, el centro y el
remate de cada escena. Lo que hay que buscar: personajes cortados por el
encuadre, tarjetas tapando caras, objetos que tapan a alguien (la laptop le
tapaba la cara a Ana en la primera vuelta), texto partido en dos renglones, y
gestos que se leen mal (el teléfono a la altura de la cabeza parecía una
llamada).

### Paso 5 — El final

```bash
bash herramientas/final.sh <video>      # → out/<video>.mp4 (1080p) y out/<video>-ligero.mp4 (720p), audio a -16 LUFS
```

Y sobre el final, **el control de calidad**, siempre:
`VERSION=<n> bash herramientas/final.sh <video>` y luego
`WHISPER=medium python herramientas/control-de-calidad.py <video>` (§0.0). Lo
que falle se arregla y se vuelve a renderizar. Al estrenarlo en «El registro
de jornada» (2026-10-23) encontró dos huecos que nadie había visto: 4.4 s de
pantalla negra casi vacía a los 19.5 s y 5.7 s de tarjetas quietas a los 55.6 s.

El render es repetible: el mismo código da el mismo MP4. Los videos van en
`videos/out/`, que **no se versiona** (el código sí, y con él cualquiera lo
regenera). Para compartirlo, se sube a Documentos del portal o se manda el
archivo **ligero** (720p, ~3 MB por minuto): el de 1080p del estilo
corporativo pesa ~30 MB por minuto, porque la cuadrícula fina del piso cuesta
bits.

---

## 4. El kit

| Pieza | Qué hace | Props que importan |
|---|---|---|
| `Escena3D` | El lienzo: cámara, luces, sombras | `camara: {pos, mira, fov}`, `tarde` (0–1) |
| `Muneco` | El personaje | `camisa`, `piel`, `pelo` (`melena` · `corto` · `chongo`), `posicion`, `giro`, `cabeza` [inclina, gira, ladea], `manos` {izq, der}, `ladeo`, `alto`, `estira`, `ojos`, `enLaMano` |
| `Cuarto`, `Tarima` | Los sets | — |
| `Escritorio`, `Laptop`, `Reloj`, `Ventana`, `Planta`, `Repisa`, `Papel`, `Telefono`, `Arbusto` | Utilería | `posicion`, `giro`; `Reloj.minutos`, `Ventana.cielo`, `Telefono.pantalla` y `brillo` |
| `Tarjeta`, `Rotulo` | Lo que la pantalla del sistema diría | `en`, `sale`, `x`, `y` (%), `ancho`, `fondo` |
| `Nombre` | Píldora que presenta a alguien | `en`, `sale`, `x`, `y` |
| `Palomita`, `Cruz` | Quedó / no se pudo, dibujándose | `en`, `x`, `y`, `tam` |
| `Sello` | Cae, golpea y se queda | `en`, `texto`, `color` |
| `Rotulador` | Óvalo a mano alzada que encierra algo | `en`, `ancho`, `alto` |
| `Burbuja` | «?», «!» brotando | `en`, `texto` |
| `Velo`, `Isotipo`, `Subtitulo` | Fundidos, la marca, subtítulos | — |
| `Fx`, `Voz`, `Musica` | El audio | `Fx.nombre`: pop · desliza · toque · exito · error · sello · papel · rebobinar · reloj |
| `recorrido(f, [[cuadro, valor], …])` | Interpola entre poses (números o [x,y,z]) | — |
| `tramo(f, desde, dura, curva)` | 0→1 en un intervalo | — |
| `parpadeo`, `bamboleo`, `brinco`, `tecleo` | Movimientos de fondo que dan vida | `semilla` distinta por personaje |

### Recetas (del video de prueba)

| Momento | Cómo | Escena |
|---|---|---|
| Presentar al personaje | Píldora `Nombre` al decir su nombre, se va antes de la siguiente idea | 1 |
| El tiempo pasa | `Reloj.minutos` interpolado 40 cuadros + cielo y `tarde` a la vez + efecto `reloj` | 1, 6 |
| Alguien se va | Gira (14 cuadros) y se desliza con `bamboleo` + `brinco` fuera de cuadro | 1 |
| Algo se pierde | Una hoja llega, su nota aparece, y otras ocho caen encima escalonadas (5 cuadros) con `papel` | 2 |
| Duda | Tarjeta «¿ ?» + `Cruz` con `error`; cabezas que se ladean; encoger hombros (manos suben y se abren 7 cuadros, vuelven a los 22) | 3 |
| «Volvamos a empezar» | La escena 1 reproducida al revés en 1.5 s, desaturada, con líneas de cinta y «◀◀» + `rebobinar`; luego la marca | 4 |
| Marcar | La mano sube el teléfono (12 cuadros), la otra toca (`toque`), la pantalla pasa a verde, `Tarjeta` + `Palomita` + `exito` | 5, 6 |
| Es evidencia | `Sello` que golpea con temblor de 8 cuadros + `sello`; acciones tachadas | 7 |
| Ver lo mismo | Renglones que entran escalonados (7 cuadros) y palomitas en cascada mientras los dos asienten | 8 |
| Cierre | Saltito con aplastamiento al caer, palomita grande, iris oscuro a la tarjeta final | 9 |

---

## 5. Estudiar otra referencia

Cuando aparezca otro video que guste, se desarma igual antes de imitarlo:
`videos/herramientas/analiza-referencia.py` con los prompts de
`videos/herramientas/prompts/`. **Corre en el servidor**, porque la llave de
Gemini vive allá; las instrucciones están en la cabecera del script. Lo que
sale va a `docs/videos-explicativos/referencias/<nombre>/`.

Para un video **corto de redes**, el prompt es `viral.txt`: gancho cuadro por
cuadro, retención, subtítulos, ritmo y sonido. Así se desarmaron las cuatro
referencias de la serie de cortos verticales (2026-10-19), en
`referencias/cortos-virales/`; el plan de la serie está en
`docs/cortos-para-redes.md`.

---

## 6. Trampas

- **Gemini TTS lee en voz alta la indicación de estilo** si lleva dos puntos:
  «…de capacitación: cálida, clara…» salió narrado delante del texto, y la
  pista duraba el doble (2026-10-16). `narra.py` avisa cuando el ritmo baja de
  1.5 palabras por segundo.
- **YouTube no deja bajar nada desde este equipo** («Sign in to confirm you're
  not a bot») y `--cookies-from-browser` no puede leer las cookies de Chrome
  ni de Edge en Windows. Para estudiar un video no hace falta bajarlo: Gemini
  lo ve por la URL.
- **Nada de `useFrame` ni de relojes de Three.js.** Todo se calcula con el
  cuadro de Remotion y se pasa por props, o el render no sale igual dos veces
  (y el rebobinado de la escena 4 no podría existir).
- **Whisper pega palabras**: «Ni Ana» salió como «Niana». Al anclar, buscar
  por el comienzo (`w(id, 'ni', 1)`) y mirar `palabras.json` si `w()` truena.
- **Whisper `base` se equivoca con los números**: oyó «2021» donde la voz dijo
  «dos mil veintisiete». Para comprobar qué dijo la voz se usa `--model
  medium` sobre el trozo dudoso; para anclar no importa, porque `palabras.json`
  guarda la forma que oyó («48», «40») y se ancla a esa.
- **Cuando Whisper oye mal la palabra ancla, `w()` truena el render** —y es
  lo que debe hacer—: en la versión ágil de Bolaños oyó «no se puede evitar»
  donde la voz dijo «editar». Se comprueba con `--model medium` qué dijo la
  voz; si dijo bien, se corrige esa palabra en `palabras.json` conservando su
  tiempo, y no se vuelve a narrar.
- **Una versión con otra voz reutiliza las escenas con `usaVoz()`**
  (`registro-de-jornada/tiempo.ts`): su punto de entrada la llama antes de
  montar nada y las escenas se anclan a la voz nueva. Así salió la de Bolaños
  más ágil (velocidad 1.28 y pausas más cortas: 1:37 → 1:28), a pedido de
  Oscar.
- **Las etiquetas de drei (`Html`) se pintan encima de todo** si nadie lo
  impide: la interfaz de cada escena va en una capa con `zIndex: 30`.
- **`Html` de drei tumba el render cuando su lienzo se desmonta**: al cortar de
  la escena 3 a la 4 de «Una hora más», React tronó con «removeChild: the node
  to be removed is not a child of this node» y no salió ni un cuadro. En el
  isométrico no pasa porque su mundo nunca se desmonta. En las historias,
  pantallas dibujadas y etiquetas proyectadas (`Proyeccion.tsx`).
- **Un heredoc de bash con texto en español a veces no cierra** («unexpected
  EOF while looking for matching `''»): los scripts de edición largos se
  escriben como archivo y se corren con `python archivo.py`.
- **Dos caras a la misma altura parpadean** («z-fighting»): la banda de la
  sucursal y su techo estaban en el mismo plano. Lo que va encima sobresale
  aunque sea 2 cm.
- **La hoja de contacto necesita las colas de cada escena**: `contactos.py` las
  busca en el archivo del video que llama a `arma()`; si no las encuentra, las
  fotos caen fuera de su momento y parecen defectos que no existen.
- **La voz va en WAV, no en MP3**: el MP3 trae relleno al inicio y descuadra la
  sincronía unas decenas de milisegundos.
- **El 3D se pinta con la tarjeta gráfica** (`setChromiumOpenGlRenderer('angle')`
  en `remotion.config.ts`); sin eso Chrome lo pinta en CPU y cada cuadro tarda
  diez veces más. Este equipo tiene una GT 1030 y alcanza.
- **La fuente se espera** (`useFuentes`, con `delayRender`): sin eso los
  primeros cuadros salen con la de respaldo.
- **Three.js 0.186 ya no tiene `PCFSoftShadowMap`**: `shadows="soft"` cae a
  PCF con un aviso. Se pide `percentage` y la suavidad la da `shadow-radius`.
- **Remotion necesita React < 19.4** por react-three-fiber 9.8: las versiones
  van fijas en `package.json` y se suben juntas, nunca una sola.

---

## 6.1 Remotion + HyperFrames

Pedido por el supervisor el 2026-10-16: «usar los dos para tener
superpoderes». Los dos hacen lo mismo por dentro —Chromium sin cabeza cuadro
por cuadro y FFmpeg—, así que **no compiten: se reparten el trabajo**.

- **Remotion es el esqueleto** y no cambia: la línea de tiempo anclada a la
  voz, el 3D, los personajes, el kit y el montaje.
- **HyperFrames aporta piezas**: su catálogo trae **447** bloques y
  componentes (`hyperframes catalog`) —revelaciones de logotipo, gráficas y
  cifras animadas, diagramas que se dibujan, una docena de rótulos para
  presentar a alguien, transiciones con shaders— escritos en HTML y GSAP.
- **La costura es un clip con alfa**: la pieza se renderiza a WebM
  transparente en `public/clips/` y Remotion la monta encima de su escena con
  `<OffthreadVideo transparent>`. Así no hay que reescribir nada en ninguno de
  los dos.

```bash
cd videos/hyperframes
python genera-isotipo.py ../../resources/svg/isotipo.svg compositions/isotipo-cierre.html --tam 300 --giro 5.7
bash ../herramientas/hyperframes.sh isotipo-cierre     # → public/clips/isotipo-cierre.webm
```

**El primer uso real es el cierre de «La historia de Carmen»**: el isotipo
se arma rayo por rayo —sus 35 trazos llegan cada uno desde su dirección—, late
una vez y florece un brillo. Es el bloque `logo-outro` del catálogo con el
isotipo en vez del logotipo de ejemplo (`genera-isotipo.py` lo genera).

Lo que hay que saber:

- **HyperFrames manda telemetría anónima de cada render.** `hyperframes.sh` la
  apaga (`DO_NOT_TRACK`, `HYPERFRAMES_NO_TELEMETRY`) y fija la versión
  (`hyperframes@0.8.166`).
- **Sus bloques cargan GSAP y fuentes desde CDN**: renderizar necesita red. Las
  fuentes de la marca van locales (`hyperframes/fonts/`).
- **El corte entre un clip y una escena de Remotion se cose con un fundido**:
  el isotipo de HyperFrames (trazos SVG) y el de Remotion (máscara) no se
  dibujan idénticos, y un corte seco salta. En la firma de Carmen, la escena
  12 sigue al clip 10 cuadros y **no mueve nada hasta que acaba el fundido**;
  si se mueve antes, se ven dos.
- **Un clip con alfa pesa más** (~4 MB por 5 s): son los clips, no el video.

---

## 6.2 Lo que se rescató del tutorial de Remotion + HyperFrames

El supervisor trajo el 2026-10-16 un tutorial sobre producir motion graphics
con Claude y esos dos frameworks («How To Create Motion Graphics With
Claude»). Su desarme, con los prompts textuales que enseña, está en
`docs/videos-explicativos/referencias/remotion-hyperframes/tecnica.md`. Su
tesis: los videos que circulan «hechos con un prompt» salen de **un brief
muy detallado y de muchas rondas de autocrítica**, no de una frase.

**Adoptado ya:**

- **El brief** (`videos/plantillas/brief.md` → `public/<video>/brief.md`):
  producto, historia, formato, look, movimiento, sonido, revisión y reglas,
  antes del guion. Lo que el brief no dice, Claude lo inventa genérico.
- **La revisión fina**: además de las hojas de contacto, un cuadro cada medio
  segundo de cada escena (`contactos.py --cada 0.5 --escena <id>`), criticado
  como lo haría una directora de motion design (historia, composición,
  espacios, tipografía, ritmo, profundidad, legibilidad, sonido). **Al menos
  cuatro rondas**, y cada una se anota en `public/<video>/revision.md`: qué
  estaba débil y qué se cambió.

**Para estrenar en el siguiente video** (van en el brief):

- **Un hilo conductor**: en su ejemplo, una línea roja que nunca sale de
  cuadro y termina siendo el logotipo. El nuestro natural es la ruta punteada
  por donde viaja una marca, o un rayo del isotipo.
- **Transformar en vez de cortar**: que una escena se convierta en la
  siguiente (la pantalla del kiosco que se vuelve la tarjeta de la marca, el
  monitor que se vuelve el tablero).
- **Motion blur** en los viajes de cámara: renderiza sub-cuadros y los mezcla;
  Remotion lo trae (`@remotion/motion-blur`). Encarece el render.
- **Los cortes de escena sobre el pulso de la música**: nuestra música es
  sintetizada a un BPM conocido (115 la corporativa), así que la rejilla del
  pulso se calcula.
- **60 cps** para piezas premium cortas (logotipos, cierres).
- **Variantes**: para un logotipo o un cierre, pedir dos o tres y elegir.

**No por ahora:** imagen y video generados (Veo, Seedance, Nano Banana por
MCP). Sirven para rostros y escenas fotorrealistas, que el código no dibuja;
rompen el estilo de la marca y cuestan créditos.

---

## 7. Licencias y costos

- **Remotion** es gratis para empresas de **hasta 3 empleados**, también en uso
  comercial (`videos/node_modules/remotion/LICENSE.md`). Hoy cabemos; **el día
  que la empresa pase de tres personas hay que comprar la Company License**
  (remotion.pro). Las versiones van fijas en `package.json`.
- **HyperFrames** (de HeyGen, Apache 2.0): ver «Remotion + HyperFrames», abajo.
- **Three.js, react-three-fiber, drei**: MIT.
- **HyperFrames**: Apache 2.0, sin tope de empleados. Si el día de la cuarta
  persona la licencia de Remotion no se justifica, HyperFrames podría ser el
  esqueleto, pero eso es reescribir el kit; hoy sólo aporta piezas.
- **La voz**: Text-to-Speech de Google, centavos por video.
- **Música y efectos**: sintetizados en `herramientas/sonidos.py` —sin
  licencia ni atribución—. Si un día se quiere música de verdad, se reemplaza
  `public/sonidos/musica.wav` y nada más cambia.
- **Desarmar una referencia con Gemini**: ~160 000 tokens en modo fino por un
  video de 2:30 — centavos con Flash.
- **Tiempo de render** en este equipo: «Marca tu jornada» (1:04), 51 s el
  borrador y 1 min 21 s el final; «El registro de jornada» (1:31), 1 min 16 s
  el borrador y 2 min 14 s el final; «Una hora más» (1:08), 58 s el borrador y
  1 min 39 s el final (`videos/LEEME.md`).

---

## Supuestos

| Supuesto | Qué lo cambiaría |
|---|---|
| Los videos se hacen en este equipo; no hace falta renderizar en la nube | Que haya que producir muchos a la vez: Remotion Lambda existe, con su costo |
| Una voz sintética basta para capacitación | Que un cliente la note y la rechace: se graba la voz y se pone en `voz/` con el mismo nombre; `palabras.json` se saca igual |
| El estilo de muñecos sirve para administradores y para colaboradores | Que para administradores haga falta enseñar la pantalla real: se combinan escenas 3D con capturas grabadas con Playwright (`docs/presentacion/herramientas/graba.py`) |
| Somos hasta tres empleados (licencia gratuita de Remotion) | Contratar a la cuarta persona |
