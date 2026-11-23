import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FAMILIA_MONO} from '../fuentes';
import {curvas, tramo} from '../movimiento';
import {marca} from '../paleta';
import type {Tono} from './Corto';

/**
 * La cronología de un corto: una línea con los años del relato, fija debajo
 * de la premisa, y un marcador que avanza en cada salto de época. Pedida por el
 * supervisor el 2026-10-19: «quiero que todo tenga una cronología en el video,
 * bien hecha de inicio a fin».
 *
 * Los años van a distancias iguales (no a escala): 1906, 1914 y 1917 quedarían
 * encimados a escala, y lo que importa es el orden. El marcador viaja con la
 * curva de interfaz en 12 cuadros; lo recorrido se pinta lleno. Sigue el tono
 * de la toma, como la premisa.
 *
 * Los cuadros (`en`, `desde`, `hasta`) son del VIDEO.
 */
export type Hito = {anio: number; en: number};

const TOP = 318;
const IZQ = 190;
const ANCHO = 660; // el 2026 del extremo cabe en la zona segura (auditoría v5)

export const Cronologia: React.FC<{
	anios: number[];
	hitos: Hito[];
	desde: number;
	hasta: number;
	tonoEn?: (f: number) => Tono;
}> = ({anios, hitos, desde, hasta, tonoEn}) => {
	const f = useCurrentFrame();
	// NO está siempre visible (supervisor, 2026-10-19): aparece en cada salto de época
	// —de 6 cuadros antes a ~1.7 s después— y se va. Fuera de [desde, hasta], nunca.
	const ventana = (en: number) => Math.min(tramo(f, en - 6, 8, curvas.sale), 1 - tramo(f, en + 44, 10, curvas.entra));
	const vis = f < desde - 6 || f > hasta ? 0 : Math.max(...hitos.slice(1).map((h) => ventana(h.en)));
	if (vis <= 0) return null;

	// dónde está el marcador: entre el hito anterior y el actual, con la curva de interfaz
	const x = (i: number) => IZQ + (i * ANCHO) / (anios.length - 1);
	const indice = (a: number) => Math.max(0, anios.indexOf(a));
	let pos = x(indice(hitos[0].anio));
	let actual = hitos[0].anio;
	for (let k = 1; k < hitos.length; k++) {
		if (f < hitos[k].en) break;
		const p = tramo(f, hitos[k].en, 12, curvas.sale);
		pos = x(indice(hitos[k - 1].anio)) + (x(indice(hitos[k].anio)) - x(indice(hitos[k - 1].anio))) * p;
		actual = p > 0.5 ? hitos[k].anio : hitos[k - 1].anio;
	}

	const oscuro = tonoEn ? [0, 1, 2, 3, 4, 5].reduce((n, k) => n + (tonoEn(f - k) === 'oscuro' ? 1 : 0), 0) / 6 : 0;
	const tinta = oscuro > 0.5 ? marca.claro : marca.tinta;
	const tenue = oscuro > 0.5 ? 'rgba(249,249,248,.45)' : marca.tenue;
	const vacia = oscuro > 0.5 ? 'rgba(249,249,248,.18)' : marca.linea;

	return (
		<div style={{position: 'absolute', top: 0, left: 0, width: 1080, height: 520, opacity: vis, transform: `translateY(${(1 - vis) * -20}px)`, pointerEvents: 'none'}}>
			{/* la línea vacía y lo recorrido */}
			<div style={{position: 'absolute', top: TOP, left: IZQ, width: ANCHO, height: 4, borderRadius: 4, background: vacia}} />
			<div style={{position: 'absolute', top: TOP, left: IZQ, width: Math.max(0, pos - IZQ), height: 4, borderRadius: 4, background: tinta}} />
			{anios.map((a, i) => {
				const pasado = x(i) <= pos + 0.5;
				const es = a === actual;
				return (
					<div key={a}>
						<div
							style={{
								position: 'absolute',
								top: TOP + 2 - (es ? 9 : 6),
								left: x(i) - (es ? 9 : 6),
								width: es ? 18 : 12,
								height: es ? 18 : 12,
								borderRadius: 18,
								background: pasado ? tinta : vacia,
							}}
						/>
						<div
							style={{
								position: 'absolute',
								top: TOP + 18,
								left: x(i) - 70,
								width: 140,
								textAlign: 'center',
								fontFamily: FAMILIA_MONO,
								fontWeight: es ? 700 : 500,
								fontSize: es ? 34 : 24,
								color: es ? tinta : tenue,
							}}
						>
							{a}
						</div>
					</div>
				);
			})}
			{/* el marcador */}
			<div style={{position: 'absolute', top: TOP + 2 - 13, left: pos - 13, width: 26, height: 26, borderRadius: 26, border: `4px solid ${tinta}`, background: oscuro > 0.5 ? marca.oscuro : marca.fondo}} />
		</div>
	);
};
