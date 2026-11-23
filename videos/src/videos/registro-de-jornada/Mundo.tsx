import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Chip, Icono} from '../../kit/corporativo/Interfaz';
import {
	Arbol,
	Centro,
	Etiqueta,
	EscenaIso,
	Ficha,
	iso,
	Nave,
	Oficina,
	Pulso,
	Ruta,
	Sucursal,
	type EstadoFicha,
} from '../../kit/corporativo/Iso';
import {FAMILIA} from '../../kit/fuentes';
import {curvas, destello, recorridoCon, tramo, type V3} from '../../kit/movimiento';
import {marca} from '../../kit/paleta';
import {G, inicio, linea} from './tiempo';

/**
 * El mundo de la empresa: cuatro centros de trabajo alrededor de un centro
 * vacío, que es donde aparece Puntualiza. Es una sola capa de todo el video;
 * las escenas de texto (la ley, la gráfica, el juicio, la evidencia) la tapan
 * con una cortina y la cámara sigue donde estaba.
 *
 * Con la cámara a 45°, x − z es la derecha de la pantalla y x + z lo de abajo:
 * los cuatro centros quedan en rombo (arriba, derecha, izquierda, abajo).
 */
type Sitio = {nombre: string; tipo: 'oficina' | 'nave' | 'sucursal'; pos: V3; alto: number; antes: string; icono: 'papel' | 'hoja' | 'memoria'};

export const SITIOS: Sitio[] = [
	{nombre: 'Oficinas', tipo: 'oficina', pos: [-7, 0, -5], alto: 5.2, antes: 'Hoja de cálculo', icono: 'hoja'},
	{nombre: 'Centro Norte', tipo: 'nave', pos: [7.5, 0, -6], alto: 3.2, antes: 'Lista en papel', icono: 'papel'},
	{nombre: 'Centro Sur', tipo: 'nave', pos: [-8, 0, 6.5], alto: 3.2, antes: 'De memoria', icono: 'memoria'},
	{nombre: 'Sucursal Centro', tipo: 'sucursal', pos: [7, 0, 6], alto: 2.6, antes: 'Lista en papel', icono: 'papel'},
];

/** Dónde se paran las fichas: una plaza de 2 × 3 delante de cada edificio. */
export const plaza = (s: Sitio, k: number): V3 => {
	const fondo = s.tipo === 'nave' ? 3.0 : s.tipo === 'oficina' ? 2.8 : 2.1;
	return [s.pos[0] - 0.9 + (k % 3) * 0.9, 0.08, s.pos[2] + fondo / 2 + 1.3 + Math.floor(k / 3) * 0.75];
};

/** El estado de cada ficha cuando el panel lo enseña (escena 8). */
export const ESTADOS: EstadoFicha[][] = [
	['presente', 'presente', 'presente', 'presente', 'retardo', 'presente'],
	['presente', 'presente', 'falta', 'presente', 'presente', 'presente'],
	['presente', 'retardo', 'presente', 'presente', 'presente', 'falta'],
	['presente', 'presente', 'presente', 'presente', 'presente', 'presente'],
];

export const conteo = (i: number) => ESTADOS[i].filter((e) => e !== 'falta').length;

export const ETIQUETA: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 10,
	padding: '8px 14px',
	background: marca.blanco,
	border: `1px solid ${marca.linea}`,
	borderRadius: 12,
	boxShadow: '0 12px 28px -16px rgba(20,20,20,.35)',
	fontSize: 20,
	fontWeight: 600,
	color: marca.tinta,
	fontFamily: FAMILIA,
};

export const Mundo: React.FC = () => {
	const F = useCurrentFrame();
	const fin = linea.total;

	// --- cámara: derivas casi quietas y viajes cortos
	const oficinas = SITIOS[0].pos;
	const cada02 = G('02-dispersa', 'centro') - 6;
	// Cuando hay una tarjeta a la izquierda (escenas 1, 8 y 9) el mundo se corre
	// a la derecha: el objetivo se mueve contra el «derecha de pantalla», que
	// con la cámara a 45° es (1, 0, −1).
	const DER: V3 = [-3.6, 1, 3.6];
	const CENTRO: V3 = [0, 1, 0];
	const i08 = inicio('08-control');
	const i10 = inicio('10-cierre');
	const camara = {
		objetivo: recorridoCon<V3>(F, [
			[0, DER],
			[inicio('02-dispersa') + 4, DER],
			[inicio('02-dispersa') + 44, [oficinas[0] + 1.2, 2.2, oficinas[2] + 0.5], curvas.sale],
			[cada02, [oficinas[0] + 1.0, 2.2, oficinas[2] + 0.3]],
			[cada02 + 40, CENTRO, curvas.sale],
			[i08 + 6, CENTRO],
			[i08 + 40, DER, curvas.sale],
			[i10, DER],
			[i10 + 40, CENTRO, curvas.suave],
			[fin - 50, [0, 0.6, 0], curvas.suave],
		]),
		zoom: recorridoCon<number>(F, [
			[0, 45],
			[inicio('02-dispersa') + 4, 48],
			[inicio('02-dispersa') + 44, 100, curvas.sale],
			[cada02, 106],
			[cada02 + 40, 58, curvas.sale],
			[inicio('06-marca'), 58],
			[inicio('07-evidencia'), 62],
			[i08 + 6, 58],
			[i08 + 40, 52, curvas.sale],
			[i10, 51],
			[fin - 50, 44, curvas.suave],
		]),
		azimut: recorridoCon<number>(F, [
			[0, Math.PI / 4],
			[i10, Math.PI / 4],
			[fin - 30, Math.PI / 4 + 0.32, curvas.suave],
		]),
	};

	// --- Puntualiza aparece
	const llega = G('06-marca', 'puntualiza') - 6;
	const sube = tramo(F, llega, 22, curvas.sale);
	const ondas = [llega + 14, llega + 34, ...Array.from({length: 12}, (_, k) => G('10-cierre', 'puntualiza') + k * 26)].map(
		(o) => (F - o) / 40,
	);

	// --- cada quien marca (escena 6): un destello en su anillo y un pulso al centro
	const marcaDe = (i: number, k: number) => G('06-marca', 'registra') + i * 7 + k * 5;
	// el panel enseña el estado (escena 8) y lo sigue enseñando
	const enVivo = G('08-control', 'real');

	return (
		<EscenaIso objetivo={camara.objetivo} zoom={camara.zoom} azimut={camara.azimut}>
			<Arbol posicion={[-2.5, 0, -8]} />
			<Arbol posicion={[-1.6, 0, -8.6]} escala={0.8} />
			<Arbol posicion={[11.5, 0, -1]} />
			<Arbol posicion={[-12, 0, 1.5]} escala={0.9} />
			<Arbol posicion={[2.5, 0, 10]} />
			<Arbol posicion={[3.4, 0, 10.6]} escala={0.75} />

			{SITIOS.map((s, i) => {
				const E = s.tipo === 'oficina' ? Oficina : s.tipo === 'nave' ? Nave : Sucursal;
				const dibujo = tramo(F, llega + 16 + i * 6, 20, curvas.sale);
				return (
					<group key={s.nombre}>
						<E posicion={s.pos} />
						<Ruta desde={[0, 0.9, 0]} hasta={[s.pos[0], 0.3, s.pos[2]]} dibujo={dibujo} corre={F * 0.015} />
						{Array.from({length: 6}, (_, k) => {
							const e = ESTADOS[i][k];
							const tm = marcaDe(i, k);
							const vivo = tramo(F, enVivo + i * 4 + k, 8, curvas.sale);
							const ausente = e === 'falta' ? vivo : 0;
							return (
								<React.Fragment key={k}>
									<Ficha
										posicion={plaza(s, k)}
										estado={vivo > 0 ? e : 'presente'}
										anillo={Math.max(vivo, e === 'falta' ? 0 : destello(F, tm, 22))}
										color={ausente > 0 ? '#CFCAC3' : iso.tinta}
										escala={1 - 0.15 * ausente}
									/>
									{e !== 'falta' && <Pulso desde={plaza(s, k)} hasta={[0, 1.1, 0]} p={(F - tm) / 34} />}
								</React.Fragment>
							);
						})}
						{/* después de la escena 8 los datos siguen llegando */}
						{F > enVivo &&
							Array.from({length: 3}, (_, k) => {
								const periodo = 70;
								const fase = (F - enVivo + i * 17 + k * 23) % periodo;
								return <Pulso key={k} desde={plaza(s, k * 2)} hasta={[0, 1.1, 0]} p={fase / 34} />;
							})}
					</group>
				);
			})}

			<Centro sube={sube} giroIsotipo={F * 0.002} ondas={ondas} />

			<Etiquetas F={F} />
		</EscenaIso>
	);
};

/** Lo que flota sobre los edificios, escena por escena. */
const Etiquetas: React.FC<{F: number}> = ({F}) => {
	const i01 = inicio('01-hoy');
	const i02 = inicio('02-dispersa');
	const cada = G('02-dispersa', 'centro') - 6;
	const i03 = inicio('03-ley');
	const enVivo = G('08-control', 'real');
	const i10 = inicio('10-cierre');
	const oficinas = SITIOS[0];
	const entre = (a: number, b: number, k = 0) => Math.min(tramo(F, a + k, 9, curvas.sale), 1 - tramo(F, b - 7, 7));
	return (
		<>
			{/* 1 · nadie sabe */}
			{SITIOS.map((s, i) => (
				<Etiqueta key={`q${i}`} posicion={[s.pos[0], s.alto, s.pos[2]]} visible={entre(i01 + 10, i02 + 6, i * 5)}>
					<div style={{...ETIQUETA, fontSize: 30, padding: '6px 18px', color: marca.tenue}}>?</div>
				</Etiqueta>
			))}

			{/* 2 · cada quien con lo suyo: de cerca en Oficinas… */}
			{(
				[
					['listas', 'papel', 'Lista en papel', [-2.6, 3.4, 0.6]],
					['hojas', 'hoja', 'Hoja de cálculo', [0.4, 5.6, -0.6]],
					['memoria', 'memoria', 'Memoria del supervisor', [2.7, 3.0, 1.2]],
				] as const
			).map(([palabra, icono, texto, d]) => (
				<Etiqueta
					key={palabra}
					posicion={[oficinas.pos[0] + d[0], d[1], oficinas.pos[2] + d[2]]}
					visible={entre(G('02-dispersa', palabra), cada + 4)}
				>
					<div style={{...ETIQUETA, fontSize: 24, padding: '12px 18px'}}>
						<Icono nombre={icono} tam={30} />
						{texto}
					</div>
				</Etiqueta>
			))}
			{/* …y de lejos, cada centro con su método */}
			{SITIOS.map((s, i) => (
				<Etiqueta key={`m${i}`} posicion={[s.pos[0], s.alto, s.pos[2]]} visible={entre(cada + 30, i03 + 10, i * 6)}>
					<div style={{...ETIQUETA, color: marca.secundario}}>
						<Icono nombre={s.icono} tam={24} color={marca.secundario} />
						{s.antes}
					</div>
				</Etiqueta>
			))}

			{/* 6 · la primera marca de cada centro */}
			{SITIOS.map((s, i) => {
				const t = G('06-marca', 'registra') + i * 7;
				const [x, , z] = s.pos;
				return (
					<Etiqueta key={`e${i}`} posicion={[x, s.alto, z]} visible={entre(t + 4, t + 70)}>
						<div style={ETIQUETA}>
							<Chip estado="presente" tam={18}>
								Entrada
							</Chip>
							{['8:58', '9:01', '8:55', '9:00'][i]} a. m.
						</div>
					</Etiqueta>
				);
			})}

			{/* 8 y 9 · cada centro, en vivo */}
			{SITIOS.map((s, i) => (
				<Etiqueta key={`v${i}`} posicion={[s.pos[0], s.alto, s.pos[2]]} visible={entre(enVivo + 6, i10 + 30, i * 4)}>
					<div style={ETIQUETA}>
						{s.nombre}
						<span style={{fontWeight: 500, color: marca.secundario}}>
							{conteo(i)} de 6
						</span>
					</div>
				</Etiqueta>
			))}
		</>
	);
};
