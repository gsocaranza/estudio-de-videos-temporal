import React, {createContext, useContext} from 'react';
import {AbsoluteFill} from 'remotion';
import {inicio, linea} from './tiempo';

/**
 * El cuadro del VIDEO, no el de la escena: dentro de un <Sequence> el reloj
 * empieza en cero, y una cortina que dura varias escenas (la ley, la lista de
 * lo que necesitamos) tiene que moverse sin saltar en cada corte.
 */
export const Reloj = createContext(0);

/** Los tramos que van sobre la cortina carbón, de punta a punta. */
const TRAMOS: (() => [number, number])[] = [
	() => [0, inicio('02-mapa')],
	() => [inicio('12-ley'), inicio('13-necesitamos')],
	() => [inicio('13-necesitamos'), linea.total],
];

const tramoDe = (F: number) => TRAMOS.map((t) => t()).find(([a, b]) => F >= a && F < b) ?? [F, F + 1];

/**
 * Lo que va sobre la cortina nunca se queda quieto (el control de calidad
 * rechaza 4 s sin movimiento): una trama fina que corre por debajo y un
 * acercamiento lento del contenido, los dos con el reloj del video.
 */
export const Deriva: React.FC<{children: React.ReactNode}> = ({children}) => {
	const F = useContext(Reloj);
	const [a, b] = tramoDe(F);
	const p = Math.min(1, Math.max(0, (F - a) / (b - a)));
	return (
		<>
			<AbsoluteFill
				style={{
					backgroundImage:
						'repeating-linear-gradient(60deg, rgba(240,236,235,.06) 0 1px, transparent 1px 46px), repeating-linear-gradient(-60deg, rgba(240,236,235,.06) 0 1px, transparent 1px 46px)',
					backgroundPosition: `${F * 0.9}px ${F * 0.5}px`,
				}}
			/>
			<AbsoluteFill
				style={{
					transform: `scale(${1 + 0.05 * p}) translateY(${-16 * p}px)`,
					transformOrigin: '35% 45%',
				}}
			>
				{children}
			</AbsoluteFill>
		</>
	);
};
