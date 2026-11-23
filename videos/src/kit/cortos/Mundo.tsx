import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

/**
 * La cámara de la serie: un mundo grande y una cámara que viaja por él.
 *
 * Es la regla de las transiciones (reglas-de-los-cortos.md §0, 2026-10-21):
 * de toma a toma la cámara VIAJA ~0.9 s con arranque y parada suaves, nunca
 * corta, y mientras se sostiene siempre empuja un poco, para que ningún plano
 * se quede congelado (control-de-calidad.py lo mide con freezedetect). Cada
 * corto pone en el mundo su propia dirección de arte; lo común es cómo se
 * mueve la cámara, como el texto es común con `Cinetico`.
 *
 * Una pose dice adónde mira la cámara en el cuadro `f`: el punto `x, y` del
 * mundo queda en el centro de la pantalla, con escala `s`. El viaje hacia una
 * pose se centra en su cuadro: empieza `viaje / 2` antes y termina después.
 */
export type Pose = {f: number; x: number; y: number; s?: number};

const EASE = Easing.bezier(0.42, 0, 0.58, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const camaraEn = (poses: Pose[], f: number, viaje = 28, alejar = 0.08) => {
	let x = poses[0].x;
	let y = poses[0].y;
	let s = poses[0].s ?? 1;
	let desde = poses[0].f;
	let lejos = 0;
	// nunca quieta: empuja despacio y parejo mientras se sostiene
	const empujeEn = (cuadro: number, base: number) => 1 + 0.05 * interpolate(cuadro, [base, base + 200], [0, 1], clamp);
	let empuje = empujeEn(f, desde);
	for (let k = 1; k < poses.length; k++) {
		const p = poses[k];
		const a = p.f - viaje / 2;
		if (f < a) break;
		const q = interpolate(f, [a, a + viaje], [0, 1], {...clamp, easing: EASE});
		x += (p.x - x) * q;
		y += (p.y - y) * q;
		s += ((p.s ?? 1) - s) * q;
		// a medio viaje la cámara se aleja un poco: se lee como movimiento, no como deslizamiento plano
		lejos = Math.max(lejos, q > 0 && q < 1 ? Math.sin(q * Math.PI) : 0);
		// lo empujado se suelta DURANTE el viaje. Antes volvía a 1 de golpe al llegar: un brinco de
		// hasta 4 % en un solo cuadro (medido el 2026-11-04, al producir Los dos días)
		const alSalir = empujeEn(a, desde);
		if (q >= 1) {
			desde = p.f + viaje / 2;
			empuje = empujeEn(f, desde);
		} else {
			empuje = alSalir + (1 - alSalir) * q;
		}
	}
	return {x, y, s: s * empuje * (1 - alejar * lejos)};
};

/** El mundo: lo que va dentro se coloca en coordenadas del mundo, en píxeles. */
export const Mundo: React.FC<{poses: Pose[]; children: React.ReactNode; viaje?: number}> = ({poses, children, viaje}) => {
	const f = useCurrentFrame();
	const c = camaraEn(poses, f, viaje);
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${540 - c.x * c.s}px, ${960 - c.y * c.s}px) scale(${c.s})`}}>
				{children}
			</div>
		</div>
	);
};
