import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FAMILIA, FAMILIA_TITULOS} from '../../kit/fuentes';
import {curvas, tramo} from '../../kit/movimiento';
import {marca} from '../../kit/paleta';
import {G, inicio} from './tiempo';

/**
 * El hilo conductor: la línea del tiempo de los seis pasos, del 10 de
 * noviembre al 1 de enero. Nace grande en el centro cuando
 * la voz dice «seis pasos», se acomoda abajo al empezar el primero y se queda
 * ahí, también sobre las cortinas, con un marcador dorado que avanza a cada
 * paso cuando la voz lo nombra. Se va al llegar a «lo que necesitamos».
 */
export const DORADO = '#D7A55A';

type Paso = {dia: number; nombre: string; fecha: string; en: () => number};

const PASOS: Paso[] = [
	{
		dia: 0,
		nombre: 'Formalización',
		fecha: '10 – 13 nov',
		en: () => G('03-contratos', 'primero'),
	},
	{
		dia: 1,
		nombre: 'Puesta en marcha',
		fecha: '11 – 17 nov',
		en: () => G('04-alfa', 'segundo'),
	},
	{
		dia: 7,
		nombre: 'Implementación',
		fecha: '17 nov – 16 dic',
		en: () => G('07-implementacion', 'tercero'),
	},
	{
		dia: 14,
		nombre: 'Entrega-recepción',
		fecha: '24 – 30 nov',
		en: () => G('09-entrega', 'cuarto'),
	},
	{
		dia: 21,
		nombre: 'Inicio formal',
		fecha: '1 dic',
		en: () => G('10-inicio', 'quinto'),
	},
	{
		dia: 52,
		nombre: 'Registro exigible',
		fecha: '1 ene',
		en: () => G('12-ley', 'sexto'),
	},
];

const X0 = 280;
const ANCHO = 1360;
// los pasos a distancias iguales (a escala de días, el 3 y el 4 se enciman);
// entre dos pasos, los días se reparten en línea recta
const DIAS = PASOS.map((p) => p.dia);
const x = (dia: number) =>
	interpolate(
		dia,
		DIAS,
		DIAS.map((_, i) => X0 + (i / (DIAS.length - 1)) * ANCHO),
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);
const Y = 100; // la línea, dentro de la franja de 220

export const LineaDeTiempo: React.FC = () => {
	const F = useCurrentFrame();
	const nace = G('02-mapa', 'seis') - 4;
	const traza = tramo(F, nace + 4, 50, curvas.suave);
	const baja = tramo(F, inicio('03-contratos') - 4, 22, curvas.suave);
	const se = tramo(F, inicio('13-necesitamos') + 2, 10, curvas.entra);
	const v = tramo(F, nace, 12, curvas.sale) * (1 - se);
	if (v <= 0) return null;

	const anclas = PASOS.map((p) => p.en());
	// el marcador viaja al paso que la voz acaba de nombrar
	const dia = interpolate(F, anclas.flatMap((a) => [a, a + 20]).slice(1), anclas.flatMap((_, i) => [PASOS[Math.max(0, i - 1)].dia, PASOS[i].dia]).slice(1), {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: curvas.suave,
	});
	const marcador = tramo(F, anclas[0] - 4, 10, curvas.sale);
	const activo = anclas.filter((a) => F >= a).length - 1;
	const banda = tramo(F, G('07-implementacion', 'implementación'), 34, curvas.suave);

	// grande en el centro → franja de abajo
	const cy = interpolate(baja, [0, 1], [520, 1080 - 110]);
	const escala = interpolate(baja, [0, 1], [1.1, 0.9]);

	return (
		<AbsoluteFill style={{zIndex: 35, pointerEvents: 'none', opacity: v}}>
			{/* fondo: tarjeta en el centro, franja completa abajo */}
			<div
				style={{
					position: 'absolute',
					left: interpolate(baja, [0, 1], [70, 0]),
					right: interpolate(baja, [0, 1], [70, 0]),
					top: cy - interpolate(baja, [0, 1], [170, 110]),
					height: interpolate(baja, [0, 1], [340, 220]),
					background: marca.blanco,
					border: `1px solid ${marca.linea}`,
					borderRadius: interpolate(baja, [0, 1], [18, 0]),
					boxShadow: `0 ${interpolate(baja, [0, 1], [24, -8])}px 50px -24px rgba(20,20,20,.3)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: cy - 110,
					width: 1920,
					height: 220,
					transform: `scale(${escala})`,
					transformOrigin: '50% 50%',
					fontFamily: FAMILIA,
				}}
			>
				{/* la línea que se traza */}
				<div
					style={{
						position: 'absolute',
						left: X0,
						top: Y - 1,
						width: ANCHO * traza,
						height: 3,
						background: marca.linea,
					}}
				/>
				{/* lo ya recorrido, en carbón */}
				<div
					style={{
						position: 'absolute',
						left: X0,
						top: Y - 1,
						width: x(dia) - X0,
						height: 3,
						background: marca.tinta,
						opacity: marcador,
					}}
				/>
				{/* la implementación, la banda dorada del 17 de noviembre al 16 de diciembre */}
				<div
					style={{
						position: 'absolute',
						left: x(7),
						top: Y + 16,
						width: (x(36) - x(7)) * banda,
						height: 8,
						borderRadius: 4,
						background: DORADO,
						opacity: 0.85,
					}}
				/>

				{PASOS.map((p, i) => {
					const aparece = tramo(F, nace + 10 + i * 5, 10, curvas.sale) * (traza * ANCHO >= x(p.dia) - X0 - 2 ? 1 : 0);
					const hecho = activo >= i;
					const actual = activo === i;
					return (
						<div
							key={p.nombre}
							style={{
								position: 'absolute',
								left: x(p.dia),
								top: 0,
								opacity: aparece,
							}}
						>
							<div
								style={{
									position: 'absolute',
									left: -11,
									top: Y - 11,
									width: 22,
									height: 22,
									borderRadius: '50%',
									boxSizing: 'border-box',
									background: hecho ? marca.tinta : marca.blanco,
									border: `3px solid ${hecho ? marca.tinta : marca.linea}`,
								}}
							/>
							<div
								style={{
									position: 'absolute',
									top: Y - 66,
									left: 0,
									transform: 'translateX(-50%)',
									fontSize: 19,
									fontWeight: 700,
									letterSpacing: '0.14em',
									textTransform: 'uppercase',
									color: marca.tenue,
									whiteSpace: 'nowrap',
								}}
							>
								Paso {i + 1}
							</div>
							<div
								style={{
									position: 'absolute',
									top: Y + 36,
									left: 0,
									transform: 'translateX(-50%)',
									textAlign: 'center',
									whiteSpace: 'nowrap',
								}}
							>
								<div
									style={{
										fontFamily: FAMILIA_TITULOS,
										fontSize: 24,
										fontWeight: actual ? 800 : 600,
										color: actual || activo < 0 ? marca.tinta : marca.secundario,
									}}
								>
									{p.nombre}
								</div>
								<div
									style={{
										fontSize: 20,
										color: marca.secundario,
										marginTop: 2,
									}}
								>
									{p.fecha}
								</div>
							</div>
						</div>
					);
				})}

				{/* el marcador */}
				{marcador > 0 && (
					<div
						style={{
							position: 'absolute',
							left: x(dia) - 17,
							top: Y - 17,
							width: 34,
							height: 34,
							borderRadius: '50%',
							background: DORADO,
							boxShadow: `0 0 0 ${6 + 4 * Math.sin(F / 9)}px rgba(215,165,90,.22)`,
							transform: `scale(${marcador})`,
						}}
					/>
				)}
			</div>
		</AbsoluteFill>
	);
};
