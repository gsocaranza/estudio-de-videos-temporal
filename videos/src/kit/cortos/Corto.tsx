import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FAMILIA, useFuentes} from '../fuentes';
import {FPS, type Escena, type Palabras} from '../linea';
import {curvas, tramo} from '../movimiento';
import {estado, marca} from '../paleta';
import {NIVEL, Voz} from '../Sonido';
import {Isotipo} from '../Graficos';

/**
 * El montaje de un corto vertical para redes (docs/cortos-para-redes.md):
 * 1080 × 1920, con la paleta de Puntualiza —papel y tinta; negro para los
 * golpes; color sólo con significado—. Encima van las tomas (Tomas.tsx);
 * debajo, la voz por escena, los subtítulos SÓLO en las frases clave, la
 * premisa fija y la música que se aparta en los silencios.
 *
 * Nada de marca: ni esquina, ni firma, ni tarjeta final. El video termina en
 * su bucle.
 *
 * Corregido el 2026-10-19 tras el primer piloto: el supervisor lo vio
 * «muy estático», con «los colores de Bolaños» (fondo carbón y acento dorado)
 * y subtítulos todo el tiempo.
 */
export const ANCHO = 1080;
export const ALTO = 1920;

/** Lo que tapan las redes con su interfaz (medido en las referencias, redondeado hacia arriba). */
export const ZONA = {arriba: 290, abajo: 520, derecha: 160};

/** Las franjas del diseño, en píxeles desde arriba. */
export const FRANJA = {
	premisa: 196, // más arriba que la zona segura de 290 px, por instrucción del supervisor (2026-10-19)
	subtitulo: 1240,
	suelo: 1400,
};

export type Tono = 'oscuro' | 'papel';

/** Los colores de cada tono. En Puntualiza no hay acento: la palabra clave se invierte. */
export const tinta = (tono: Tono) =>
	tono === 'papel'
		? {texto: marca.tinta, tenue: marca.tenue, fondo: marca.fondo, invertido: marca.oscuro, sobreInvertido: marca.claro, linea: marca.linea}
		: {texto: marca.claro, tenue: marca.tenue, fondo: marca.oscuro, invertido: marca.claro, sobreInvertido: marca.oscuro, linea: 'rgba(249,249,248,.16)'};

/** Los colores con significado: rojo lo que es falso o se rompe, verde lo que es ley. */
export const significado = {falso: estado.falta, ley: estado.presente};

// ---------------------------------------------------------------- fondo

const Grano: React.FC<{f: number; tono: Tono}> = ({f, tono}) => (
	<svg width={ANCHO} height={ALTO} style={{position: 'absolute', inset: 0, opacity: tono === 'papel' ? 0.06 : 0.08}}>
		<filter id={`grano-${tono}`}>
			<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(f / 2) % 9} />
			<feColorMatrix type="saturate" values="0" />
		</filter>
		<rect width="100%" height="100%" filter={`url(#grano-${tono})`} />
	</svg>
);

/** El fondo nunca está quieto: la retícula de puntos sube despacio y el grano cambia cada dos cuadros. */
export const Fondo: React.FC<{tono: Tono; f: number}> = ({tono, f}) => (
	<AbsoluteFill
		style={{
			background: tono === 'papel' ? marca.fondo : marca.oscuro,
			backgroundImage: `radial-gradient(${tono === 'papel' ? marca.linea : 'rgba(249,249,248,.07)'} 2px, transparent 2px)`,
			backgroundSize: '44px 44px',
			backgroundPosition: `${Math.sin(f / 90) * 10}px ${-f * 0.7}px`,
		}}
	>
		<Grano f={f} tono={tono} />
	</AbsoluteFill>
);

// ---------------------------------------------------------------- premisa

/** Mezcla dos colores hex. */
const mezclaColor = (a: string, b: string, t: number) => {
	const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
	const [x, y] = [n(a), n(b)];
	return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};

/**
 * La pregunta del video, fija arriba. Sigue a la toma de abajo: pastilla de
 * tinta sobre el papel y de papel sobre el negro, cambiando en seis cuadros
 * cuando cambia la toma. Así no se pierde nunca, pero tampoco grita
 * (supervisor, 2026-10-19: «más grande, y que el fondo vaya cambiando con las
 * escenas para que no se pierda, pero tampoco que se vea tanto»).
 */
export const Premisa: React.FC<{texto: string; tonoEn?: (f: number) => Tono}> = ({texto, tonoEn}) => {
	const f = useCurrentFrame();
	// cambia de golpe con la toma: un fundido pasaba por gris sobre gris y la premisa se perdía (auditoría v3)
	const oscuro = tonoEn && tonoEn(f) === 'oscuro' ? 1 : 0;
	return (
		<div style={{position: 'absolute', top: FRANJA.premisa, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					background: mezclaColor(marca.tinta, marca.fondo, oscuro),
					opacity: 0.94,
					borderRadius: 20,
					padding: '16px 34px',
					color: mezclaColor(marca.claro, marca.tinta, oscuro),
					fontFamily: FAMILIA,
					fontWeight: 700,
					fontSize: 46,
					letterSpacing: 0,
					boxShadow: '0 8px 24px rgba(20,20,20,.16)',
				}}
			>
				{texto}
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- subtítulos

const normal = (t: string) =>
	t
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9ñ]/g, '');

type Palabra = {p: string; ini: number; fin: number};

/** Whisper parte «52.000» en «52» y «.000»: se vuelven a pegar. */
const pegaCifras = (lista: Palabra[]) =>
	lista.reduce<Palabra[]>((acc, w) => {
		if (acc.length && /^[.,]\d/.test(w.p)) acc[acc.length - 1] = {...acc[acc.length - 1], p: acc[acc.length - 1].p + w.p, fin: w.fin};
		else acc.push(w);
		return acc;
	}, []);

export type Grupo = {texto: string[]; claves: boolean[]; desde: number; hasta: number};

/**
 * Los grupos de una escena: de una a tres palabras, partidos donde hay
 * puntuación o un silencio de más de 120 ms. El texto sale del `subtitulo` del
 * guion; el tiempo, de Whisper. Si los dos no cuentan lo mismo (Whisper oye
 * «8» donde el guion dice «ocho», o junta dos palabras), cada palabra del
 * subtítulo toma el tiempo de la palabra oída que le corresponde en proporción.
 */
export const grupos = (id: string, texto: string, palabras: Palabras, claves: string[], respiro: number, finVoz: number): Grupo[] => {
	const voz = pegaCifras(palabras[id]?.palabras ?? []);
	const fichas = texto.split(/\s+/).filter(Boolean);
	if (!voz.length) return [];
	const tiempo = (k: number) => voz[Math.min(voz.length - 1, Math.round((k * (voz.length - 1)) / Math.max(1, fichas.length - 1)))];
	const ini = (k: number) => (voz.length === fichas.length ? voz[k].ini : tiempo(k).ini);
	const fin = (k: number) => (voz.length === fichas.length ? voz[k].fin : tiempo(k).fin);
	const esClave = (t: string) => claves.some((c) => normal(c) && normal(t) === normal(c));
	const salida: Grupo[] = [];
	let actual: number[] = [];
	const cierra = () => {
		if (!actual.length) return;
		salida.push({
			texto: actual.map((k) => fichas[k]),
			claves: actual.map((k) => esClave(fichas[k])),
			desde: respiro + Math.round(ini(actual[0]) * FPS),
			hasta: 0,
		});
		actual = [];
	};
	fichas.forEach((t, k) => {
		const largo = actual.reduce((n, j) => n + fichas[j].length + 1, 0);
		const pausa = k > 0 && ini(k) - fin(k - 1) > 0.12;
		if (actual.length && (actual.length >= 3 || largo + t.length > 16 || pausa)) cierra();
		actual.push(k);
		if (/[.,:;?!»]$/.test(t)) cierra();
	});
	cierra();
	salida.forEach((g, k) => (g.hasta = k + 1 < salida.length ? salida[k + 1].desde : finVoz));
	return salida;
};

/**
 * El subtítulo de una frase clave: bloques de papel blanco con la tinta, y la
 * palabra clave en un bloque negro. Se lee igual sobre papel que sobre negro.
 */
const Subtitulos: React.FC<{lista: Grupo[]}> = ({lista}) => {
	const f = useCurrentFrame();
	const g = lista.find((x) => f >= x.desde && f < x.hasta);
	if (!g) return null;
	const p = tramo(f, g.desde, 5, curvas.sale);
	return (
		<div
			style={{
				position: 'absolute',
				top: FRANJA.subtitulo,
				left: ANCHO / 2,
				width: 820,
				transform: `translate(-50%, -50%) scale(${0.86 + 0.14 * p}) translateY(${(1 - p) * 10}px)`,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				gap: 12,
			}}
		>
			{g.texto.map((t, k) => (
				<span
					key={k}
					style={{
						background: g.claves[k] ? marca.oscuro : marca.blanco,
						color: g.claves[k] ? marca.claro : marca.tinta,
						fontFamily: FAMILIA,
						fontWeight: 700,
						fontSize: 72,
						lineHeight: 1.05,
						letterSpacing: -0.5,
						padding: '6px 18px 4px',
						borderRadius: 10,
						boxShadow: '0 8px 24px rgba(20,20,20,.18)',
					}}
				>
					{t.replace(/[«»]/g, '')}
				</span>
			))}
		</div>
	);
};

// ---------------------------------------------------------------- guía

/** Las franjas que tapa la interfaz de las redes, sólo para mirar en el estudio. */
const ZonaSegura: React.FC = () => {
	const velo = 'rgba(234,107,96,.22)';
	return (
		<AbsoluteFill style={{zIndex: 90, pointerEvents: 'none'}}>
			<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: ZONA.arriba, background: velo}} />
			<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: ZONA.abajo, background: velo}} />
			<div style={{position: 'absolute', top: ZONA.arriba, bottom: ZONA.abajo, right: 0, width: ZONA.derecha, background: velo}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- música

/** La música de fondo, que se aparta (a una cuarta parte) en cada silencio de `apartes`, en cuadros del video. */
const MusicaCorto: React.FC<{apartes: [number, number][]}> = ({apartes}) => {
	const {durationInFrames, fps} = useVideoConfig();
	return (
		<Audio
			src={staticFile('sonidos/musica-corporativa.wav')}
			volume={(f) => {
				const borde = interpolate(f, [0, fps * 0.4, durationInFrames - fps * 1.5, durationInFrames - 2], [0.6, 1, 1, 0], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				const aparte = apartes.reduce((m, [a, b]) => {
					const dentro = interpolate(f, [a - 5, a, b, b + 8], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
					return Math.max(m, dentro);
				}, 0);
				return NIVEL.musica * borde * (1 - 0.8 * aparte);
			}}
		/>
	);
};

// ---------------------------------------------------------------- firma

/**
 * El isotipo de Puntualiza, chico y tenue, centrado abajo (supervisor,
 * 2026-10-20: «quitar el título y poner el logo de Puntualiza abajo muy sutil,
 * sólo el isotipo, centrado»). Va en blanco con fusión de diferencia, así que
 * sale oscuro sobre el papel y claro sobre el negro sin saber qué toma hay
 * debajo. Va al pie, centrado a ~140 px del borde, donde lo marcó el supervisor (v7).
 */
export const Firma: React.FC = () => (
	<AbsoluteFill style={{zIndex: 80, mixBlendMode: 'difference', pointerEvents: 'none'}}>
		<div style={{position: 'absolute', top: ALTO - 176, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 0.32}}>
			<Isotipo tam={64} tinta="#ffffff" />
		</div>
	</AbsoluteFill>
);

// ---------------------------------------------------------------- montaje

export type GuionCorto = {
	titulo: string;
	premisa: string;
	escenas: {id: string; texto: string; subtitulo?: string; subtitulos?: boolean; subtitulos_hasta?: string; clave?: string[]}[];
};

export const MontajeCorto: React.FC<{
	video: string;
	guion: GuionCorto;
	escenas: Escena[];
	palabras: Palabras;
	/** las tomas (Tomas.tsx) y las cortinillas, ya armadas */
	imagen: React.ReactNode;
	apartes?: [number, number][];
	guia?: boolean;
	/** el tono de la toma que se ve en cada cuadro, para que la premisa la siga */
	tonoEn?: (f: number) => Tono;
	/** la pregunta fija arriba; los cortos desde R1 v6 no la llevan */
	conPremisa?: boolean;
	/** el isotipo tenue abajo (desde R1 v6) */
	firma?: boolean;
}> = ({video, guion, escenas, palabras, imagen, apartes = [], guia, tonoEn, conPremisa = true, firma = false}) => {
	useFuentes();
	return (
		<AbsoluteFill style={{background: marca.fondo}}>
			{imagen}
			{escenas.map((e) => {
				const g = guion.escenas.find((x) => x.id === e.id);
				const todos = g?.subtitulos
					? grupos(e.id, e.subtitulo ?? e.texto, palabras, g?.clave ?? [], e.respiro, e.respiro + Math.ceil(e.voz * FPS))
					: [];
				// `subtitulos_hasta`: sólo la primera frase lleva subtítulo; lo demás ya lo dicen las palabras grandes
				const corte = g?.subtitulos_hasta ? (palabras[e.id]?.palabras ?? []).find((w) => normal(w.p).startsWith(normal(g.subtitulos_hasta!))) : undefined;
				const tope = corte ? e.respiro + Math.ceil(corte.fin * FPS) + 6 : Infinity;
				const lista = todos.filter((x) => x.desde < tope).map((x) => ({...x, hasta: Math.min(x.hasta, tope)}));
				return (
					<Sequence key={e.id} from={e.desde} durationInFrames={e.duracion} name={`voz ${e.id}`}>
						<Voz video={video} id={e.id} en={e.respiro} />
						{lista.length > 0 && (
							<AbsoluteFill style={{zIndex: 70}}>
								<Subtitulos lista={lista} />
							</AbsoluteFill>
						)}
					</Sequence>
				);
			})}
			{conPremisa && (
				<AbsoluteFill style={{zIndex: 80}}>
					<Premisa texto={guion.premisa} tonoEn={tonoEn} />
				</AbsoluteFill>
			)}
			{firma && <Firma />}
			<MusicaCorto apartes={apartes} />
			{guia && <ZonaSegura />}
		</AbsoluteFill>
	);
};
