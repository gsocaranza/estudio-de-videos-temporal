import {Easing, interpolate} from 'remotion';

/**
 * Las curvas y los tiempos del estilo. Salen del desarme del video de
 * referencia (docs/videos-explicativos.md, «El estilo»): nada elástico de más,
 * cámara siempre en movimiento lento, y los gráficos que «caen» con un rebote
 * corto.
 */
export const curvas = {
	/** cámara, traslados, todo lo que va de un sitio a otro */
	suave: Easing.bezier(0.4, 0, 0.2, 1),
	/** entradas: arranca rápido y se posa */
	sale: Easing.bezier(0.16, 1, 0.3, 1),
	/** sellos, tarjetas y palomitas: se pasan un poco y vuelven */
	rebote: Easing.out(Easing.back(1.7)),
	/** salidas: arranca despacio y se va */
	entra: Easing.in(Easing.cubic),
	lineal: Easing.linear,
};

/** Duraciones típicas, en segundos. */
export const tiempos = {
	pop: 0.35, // un gráfico que aparece
	trazo: 0.45, // una palomita o un círculo que se dibuja
	sello: 0.3,
	traslado: 1.6, // un muñeco que cruza la maqueta
	fundido: 0.5, // fundido a negro entre actos
};

/** 0→1 entre `desde` y `desde + dura` (en cuadros), con la curva dada. Fuera, se queda en 0 o en 1. */
export const tramo = (f: number, desde: number, dura: number, curva = curvas.suave) =>
	interpolate(f, [desde, desde + Math.max(dura, 1)], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: curva,
	});

export const mezcla = (a: number, b: number, p: number) => a + (b - a) * p;

export type V3 = [number, number, number];

export const mezcla3 = (a: V3, b: V3, p: number): V3 => [
	mezcla(a[0], b[0], p),
	mezcla(a[1], b[1], p),
	mezcla(a[2], b[2], p),
];

/**
 * Un recorrido por varias poses: [[cuadro, valor], …]. Entre dos poses va con
 * la curva suave; antes de la primera y después de la última se queda quieto.
 */
export const recorrido = <T extends number | V3>(f: number, poses: [number, T][], curva = curvas.suave): T => {
	if (f <= poses[0][0]) return poses[0][1];
	for (let i = 1; i < poses.length; i++) {
		const [f0, v0] = poses[i - 1];
		const [f1, v1] = poses[i];
		if (f <= f1) {
			const p = tramo(f, f0, f1 - f0, curva);
			return (typeof v0 === 'number'
				? mezcla(v0, v1 as number, p)
				: mezcla3(v0 as V3, v1 as V3, p)) as T;
		}
	}
	return poses[poses.length - 1][1];
};

/** Escala vertical de los ojos: parpadea cada 3–5 s, dos cuadros cerrado. */
export const parpadeo = (f: number, semilla = 0) => {
	const periodo = 96 + ((semilla * 37) % 54);
	const k = (f + semilla * 23) % periodo;
	if (k === 0 || k === 3) return 0.45;
	if (k === 1 || k === 2) return 0.08;
	return 1;
};

/** Bamboleo al desplazarse: los muñecos no caminan, se deslizan meciéndose. */
export const bamboleo = (f: number, intensidad: number) => Math.sin(f * 0.42) * 0.09 * intensidad;

/** Saltito al desplazarse (va con el bamboleo). */
export const brinco = (f: number, intensidad: number) => Math.abs(Math.sin(f * 0.42)) * 0.035 * intensidad;

/** Manos tecleando: botan alternadas a ~3.5 Hz. */
export const tecleo = (f: number, mano: 0 | 1) => Math.max(0, Math.sin(f * 0.75 + mano * Math.PI)) * 0.035;

/** Pasa segundos a cuadros. */
export const s = (segundos: number, fps = 30) => Math.round(segundos * fps);

/**
 * Como `recorrido`, pero cada pose dice con qué curva se llega a ella:
 * [[cuadro, valor, curva?], …]. Sirve para la cámara corporativa, que alterna
 * derivas lineales casi quietas con viajes cortos (`sale`).
 */
export const recorridoCon = <T extends number | V3>(f: number, poses: [number, T, ((t: number) => number)?][]): T => {
	if (f <= poses[0][0]) return poses[0][1];
	for (let i = 1; i < poses.length; i++) {
		const [f0, v0] = poses[i - 1];
		const [f1, v1, curva = curvas.lineal] = poses[i];
		if (f <= f1) {
			const p = tramo(f, f0, f1 - f0, curva);
			return (typeof v0 === 'number' ? mezcla(v0, v1 as number, p) : mezcla3(v0 as V3, v1 as V3, p)) as T;
		}
	}
	return poses[poses.length - 1][1];
};

/** Sube y baja: 0→1→0 entre `desde` y `desde + dura`. */
export const destello = (f: number, desde: number, dura: number) =>
	f < desde || f > desde + dura ? 0 : Math.sin(((f - desde) / dura) * Math.PI);
