import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {curvas, mezcla, tramo} from '../movimiento';
import {marca} from '../paleta';
import {Fx, type Efecto} from '../Sonido';
import {Fondo, type Tono} from './Corto';

/**
 * Las tomas de un corto: el video entero partido en planos de ~2 s, cada uno
 * anclado a una palabra de la voz, con su cámara y su transición de entrada.
 *
 * Sale del segundo desarme de las cuatro referencias
 * (docs/videos-explicativos/referencias/cortos-virales/*-transiciones.md): un
 * cambio de plano cada 2–4 s, ninguna cámara quieta, y transiciones que no son
 * un fundido —barrido con desenfoque, empuje, zoom que atraviesa, corte seco
 * con golpe, inversión a negro, destello—. El barrido sigue la receta del
 * componente `whip-pan-cut` de HyperFrames: las dos tomas en una tira que se
 * desliza con `power3.inOut` y un desenfoque direccional que llega a 16 px
 * justo a la mitad, en la velocidad máxima.
 *
 * Los tiempos de una toma son cuadros del VIDEO (no de la escena).
 */
export type Transicion = 'corte' | 'barrido' | 'barrido-der' | 'empuje' | 'zoom' | 'inversion' | 'destello';

/**
 * `golpes`: acercamientos por pasos dentro de la toma —[cuadro de la toma, cuánto
 * acerca]—, anclados a una palabra: lo que hacen las referencias en cada dato
 * (un «punch-in» de 6 cuadros que se queda).
 */
export type Camara = {escala?: [number, number]; x?: [number, number]; y?: [number, number]; giro?: [number, number]; golpes?: [number, number][]};

export type Toma = {
	desde: number;
	entra?: Transicion;
	tono?: Tono;
	camara?: Camara;
	/** la toma; `f` es el cuadro desde que empieza (negativo mientras entra), `d` lo que dura */
	C: React.FC<{f: number; d: number}>;
	/** sonido de la transición; por omisión el que le toca */
	sinSonido?: boolean;
	/** los efectos de la toma, en cuadros de la toma (van fuera del reloj congelado de la toma) */
	fx?: {nombre: Efecto; en: number; volumen?: number}[];
};

/** La mitad de cada transición, en cuadros: la toma que entra empieza a verse `MITAD` antes de su `desde`. */
const MITAD: Record<Transicion, number> = {
	corte: 0,
	inversion: 0,
	destello: 2,
	barrido: 6,
	'barrido-der': 6,
	empuje: 6,
	zoom: 6,
};

const W = 1080;
const H = 1920;

/** power3.inOut, la curva del barrido de HyperFrames */
const enOut3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Dónde está una toma durante una transición. `p` va de 0 a 1 a lo largo de
 * la transición; `lado` es 'entra' para la nueva y 'sale' para la anterior.
 */
const estado = (tipo: Transicion, p: number, lado: 'entra' | 'sale') => {
	const e = enOut3(Math.max(0, Math.min(1, p)));
	const pico = Math.sin(Math.PI * Math.max(0, Math.min(1, p))); // 0 → 1 → 0, máximo a la mitad
	switch (tipo) {
		case 'barrido':
			return {x: lado === 'entra' ? W * (1 - e) : -W * e, y: 0, escala: 1, desenfoqueX: 16 * pico, desenfoqueY: 0, opacidad: 1};
		case 'barrido-der':
			return {x: lado === 'entra' ? -W * (1 - e) : W * e, y: 0, escala: 1, desenfoqueX: 16 * pico, desenfoqueY: 0, opacidad: 1};
		case 'empuje':
			return {x: 0, y: lado === 'entra' ? H * (1 - e) : -H * e, escala: 1, desenfoqueX: 0, desenfoqueY: 14 * pico, opacidad: 1};
		case 'zoom':
			// la que sale se agranda hasta atravesarla; la que entra llega desde más chica
			return lado === 'sale'
				? {x: 0, y: 0, escala: mezcla(1, 3.2, e), desenfoqueX: 10 * pico, desenfoqueY: 10 * pico, opacidad: 1 - tramo(p, 0.45, 0.4)}
				: // la que entra llega desde MÁS grande: desde más chica se le veía el borde (auditoría, 0:02 y 0:16)
					{x: 0, y: 0, escala: mezcla(1.3, 1, e), desenfoqueX: 8 * (1 - e), desenfoqueY: 8 * (1 - e), opacidad: Math.min(1, p * 2.2)};
		default:
			return {x: 0, y: 0, escala: 1, desenfoqueX: 0, desenfoqueY: 0, opacidad: 1};
	}
};

const UnaToma: React.FC<{toma: Toma; i: number; desde: number; hasta: number; sale?: Transicion}> = ({toma, i, desde, hasta, sale}) => {
	const g = useCurrentFrame() + desde; // cuadro del video
	const f = g - toma.desde;
	const d = hasta - toma.desde;
	const mIn = MITAD[toma.entra ?? 'corte'];
	const mOut = sale ? MITAD[sale] : 0;

	// la transición de entrada, la de salida, o ninguna
	let est = estado('corte', 1, 'entra');
	if (mIn > 0 && f < mIn) est = estado(toma.entra!, (f + mIn) / (2 * mIn), 'entra');
	else if (sale && mOut > 0 && g > hasta - mOut) est = estado(sale, (g - (hasta - mOut)) / (2 * mOut), 'sale');

	// la cámara nunca está quieta: deriva por toda la toma, y un golpe corto al entrar por corte
	const c = toma.camara ?? {};
	const q = Math.max(0, Math.min(1, f / Math.max(d, 1)));
	const golpe = (toma.entra ?? 'corte') === 'corte' || toma.entra === 'inversion' ? 1.06 - 0.06 * tramo(f, 0, 7, curvas.sale) : 1;
	const pasos = (c.golpes ?? []).reduce((m, [en, cuanto]) => m * (1 + cuanto * tramo(f, en, 6, curvas.sale)), 1);
	// el vaivén: una cámara en mano muy suave, para que nada quede clavado
	const vaiven = {x: Math.sin(g / 37) * 7, y: Math.cos(g / 51) * 5, giro: Math.sin(g / 61) * 0.5};
	const escala = mezcla(...(c.escala ?? [1, 1.1]), q) * golpe * pasos * est.escala;
	const x = mezcla(...(c.x ?? [0, 0]), q) + est.x + vaiven.x;
	const y = mezcla(...(c.y ?? [0, 0]), q) + est.y + vaiven.y;
	const giro = mezcla(...(c.giro ?? [0, 0]), q) + vaiven.giro;
	const filtro = `mb-${i}`;
	const desenfoca = est.desenfoqueX > 0.2 || est.desenfoqueY > 0.2;
	return (
		<AbsoluteFill style={{opacity: est.opacidad}}>
			{desenfoca && (
				<svg width={0} height={0} style={{position: 'absolute'}}>
					<filter id={filtro} x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation={`${est.desenfoqueX.toFixed(2)} ${est.desenfoqueY.toFixed(2)}`} />
					</filter>
				</svg>
			)}
			<AbsoluteFill
				style={{
					transform: `translate(${x}px, ${y}px) scale(${escala}) rotate(${giro}deg)`,
					transformOrigin: '50% 45%',
					filter: desenfoca ? `url(#${filtro})` : undefined,
				}}
			>
				<Fondo tono={toma.tono ?? 'papel'} f={g} />
				{/* dentro de la toma, useCurrentFrame() es el cuadro de la toma (mientras entra, el 0) */}
				<Freeze frame={Math.max(0, f)}>
					<toma.C f={Math.max(0, f)} d={d} />
				</Freeze>
			</AbsoluteFill>
			{(toma.fx ?? []).map((e, k) => (
				<Sequence key={k} from={e.en + mIn} layout="none" name={`fx ${e.nombre}`}>
					<Fx nombre={e.nombre} en={0} volumen={e.volumen} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};

/** El sonido de cada transición, en el cuadro del corte. */
const SONIDO: Partial<Record<Transicion, 'barrido' | 'golpe' | 'clic' | 'subida'>> = {
	barrido: 'barrido',
	'barrido-der': 'barrido',
	empuje: 'barrido',
	zoom: 'barrido',
	inversion: 'golpe',
	destello: 'golpe',
	corte: 'clic',
};

/** Pinta las tomas en orden, con sus transiciones encimadas. `fin` es el último cuadro del video. */
export const Tomas: React.FC<{tomas: Toma[]; fin: number}> = ({tomas, fin}) => {
	// una palabra ancla mal elegida (la primera «y» en vez de la segunda) deja una toma con duración negativa
	tomas.forEach((t, i) => {
		const hasta = tomas[i + 1]?.desde ?? fin;
		if (hasta - t.desde < 6) throw new Error(`La toma ${i + 1} dura ${hasta - t.desde} cuadros (de ${t.desde} a ${hasta}): revisa sus anclas`);
	});
	return (
	<>
		{tomas.map((t, i) => {
			const sig = tomas[i + 1];
			const hasta = sig ? sig.desde : fin;
			const mIn = MITAD[t.entra ?? 'corte'];
			const mOut = sig ? MITAD[sig.entra ?? 'corte'] : 0;
			const desde = t.desde - mIn;
			return (
				<Sequence key={i} from={desde} durationInFrames={hasta + mOut - desde} name={`toma ${i + 1}`}>
					<UnaToma toma={t} i={i} desde={desde} hasta={hasta} sale={sig?.entra} />
				</Sequence>
			);
		})}
		{/* el destello de las tomas que entran con destello: un papel blanco que se apaga */}
		{tomas.map((t, i) =>
			t.entra === 'destello' ? (
				<Sequence key={`d${i}`} from={t.desde - 2} durationInFrames={10} name="destello">
					<Destello />
				</Sequence>
			) : null,
		)}
		{tomas.map((t, i) => {
			const s = SONIDO[t.entra ?? 'corte'];
			return i > 0 && s && !t.sinSonido ? (
				<Sequence key={`s${i}`} from={Math.max(0, t.desde - MITAD[t.entra ?? 'corte'])} durationInFrames={30} layout="none">
					<Fx nombre={s} en={0} volumen={s === 'clic' ? 0.7 : 1} />
				</Sequence>
			) : null;
		})}
	</>
	);
};

const Destello: React.FC = () => {
	const f = useCurrentFrame();
	const o = f < 2 ? f / 2 : 1 - tramo(f, 2, 8, curvas.sale);
	return <AbsoluteFill style={{background: marca.blanco, opacity: o, zIndex: 60}} />;
};

/**
 * Una cortinilla de HyperFrames encima de todo (el muro de palabras): un clip
 * con alfa que tapa la pantalla mientras abajo se corta. `corte` es el cuadro
 * del video donde la toma de abajo cambia; el clip empieza `ANTES` cuadros
 * antes, que es cuando todavía no tapa.
 */
export const Cortinilla: React.FC<{clip: string; corte: number; antes?: number; largo?: number}> = ({clip, corte, antes = 18, largo = 42}) => (
	<Sequence from={corte - antes} durationInFrames={largo} name={`cortinilla ${clip}`}>
		<AbsoluteFill style={{zIndex: 55}}>
			<OffthreadVideo src={staticFile(`clips/${clip}.webm`)} transparent muted />
		</AbsoluteFill>
		<Fx nombre="barrido" en={0} volumen={1.1} />
	</Sequence>
);

export {Freeze};
