import {Easing, interpolate, spring} from 'remotion';
/** Los comerciales van a 60 fps (método «launch-motion»). */
export const FPS = 60;

/**
 * El movimiento de los comerciales (docs/videos-explicativos/comerciales.md), con las reglas de «launch-motion»
 * (docs/videos-explicativos/referencias/launch-motion/leccion.md):
 *
 * - nada es lineal; las entradas duran ~0.5 s y se pasan apenas (resorte con
 *   amortiguación 14: en un comercial se permite, en los cortos no);
 * - las salidas duran ~60 % de la entrada y aceleran al irse;
 * - las piezas de un grupo se desfasan unos cuadros, y el movimiento siguiente
 *   empieza antes de que el anterior termine;
 * - la cámara arranca y para suave, y nada se queda quieto del todo.
 */
export const EASE = Easing.bezier(0.42, 0, 0.58, 1);
export const SALE = Easing.in(Easing.cubic);
export const FRENA = Easing.out(Easing.cubic);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 entre `desde` y `desde + dura` con la curva dada. */
export const tramo = (f: number, desde: number, dura: number, curva = EASE) =>
	interpolate(f, [desde, desde + Math.max(1, dura)], [0, 1], {...clamp, easing: curva});

export const mezcla = (a: number, b: number, p: number) => a + (b - a) * p;

/** La entrada: ~30 cuadros (0.5 s), con un sobrepaso leve. */
export const entra = (f: number, en: number) =>
	f < en ? 0 : spring({frame: f - en, fps: FPS, config: {damping: 14, stiffness: 140, mass: 0.7}, durationInFrames: 30});

/** La salida: 18 cuadros (60 % de la entrada), acelerando. Devuelve 0→1. */
export const sale = (f: number, en: number | undefined, dura = 18) => (en === undefined ? 0 : tramo(f, en, dura, SALE));

/** Visibilidad de una pieza que entra en `en` y, si se da, sale en `fuera`. */
export const vive = (f: number, en: number, fuera?: number) => Math.max(0, Math.min(entra(f, en), 1.2) * (1 - sale(f, fuera)));

/** La deriva de lo que se sostiene: nunca se queda quieto. */
export const deriva = (f: number, semilla = 0) => ({
	x: Math.sin((f + semilla * 37) / 90) * 4,
	y: Math.cos((f + semilla * 53) / 110) * 3,
	s: 1 + Math.sin((f + semilla * 11) / 140) * 0.008,
});

export type Punto = [number, number];

/**
 * Un punto que viaja de `a` a `b` en arco, como una mano: curva cuadrática con
 * el control desplazado 15 % de la distancia, arranque y parada suaves y un
 * pequeño asiento al final.
 */
export const arco = (p: number, a: Punto, b: Punto, lado = 1): Punto => {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const d = Math.hypot(dx, dy) || 1;
	const c: Punto = [(a[0] + b[0]) / 2 - (dy / d) * d * 0.15 * lado, (a[1] + b[1]) / 2 + (dx / d) * d * 0.15 * lado];
	const t = p;
	const u = 1 - t;
	return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};

/** Curva del cursor: suave y con un asiento de 3 % al llegar. */
export const ASIENTO = Easing.bezier(0.5, 0, 0.25, 1.08);

/** Cada clic hunde: 1 → 0.96 → 1 en 8 cuadros. */
export const hundido = (f: number, clic: number) => {
	const k = f - clic;
	if (k < 0 || k > 8) return 1;
	return 1 - 0.04 * Math.sin((k / 8) * Math.PI);
};
