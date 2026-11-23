import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Chip} from '../../kit/corporativo/Interfaz';
import {Arbol, Centro, Etiqueta, EscenaIso, Ficha, iso, Nave, Oficina, Pulso, Ruta, Sucursal} from '../../kit/corporativo/Iso';
import {curvas, destello, recorridoCon, tramo, type V3} from '../../kit/movimiento';
import {ETIQUETA} from '../registro-de-jornada/Mundo';
import {G, inicio, linea} from './tiempo';

/**
 * Los cuatro centros de Ámbar alrededor del sitio donde, al empezar la
 * implementación, sube Puntualiza. Es una sola capa de todo el video: las escenas de texto la
 * tapan con una cortina y la cámara sigue donde estaba. Los centros no llevan
 * nombre: la hoja de ruta sólo nombra el de Querétaro, y un nombre inventado
 * en un video para el cliente es un dato falso.
 *
 * Con la cámara a 45°, x − z es la derecha de la pantalla y x + z lo de abajo.
 */
type Sitio = {tipo: 'oficina' | 'nave' | 'sucursal'; pos: V3; alto: number};

const SITIOS: Sitio[] = [
	{tipo: 'nave', pos: [-7, 0, -5.5], alto: 3.2},
	{tipo: 'oficina', pos: [7.5, 0, -6], alto: 5.2},
	{tipo: 'nave', pos: [-8, 0, 6.5], alto: 3.2},
	{tipo: 'sucursal', pos: [7, 0, 6], alto: 2.6},
];

const plaza = (s: Sitio, k: number): V3 => {
	const fondo = s.tipo === 'nave' ? 3.0 : s.tipo === 'oficina' ? 2.8 : 2.1;
	return [s.pos[0] - 0.9 + (k % 3) * 0.9, 0.08, s.pos[2] + fondo / 2 + 1.3 + Math.floor(k / 3) * 0.75];
};

export const Mundo: React.FC = () => {
	const F = useCurrentFrame();
	const fin = linea.total;

	// con una tarjeta a la izquierda el mundo se corre a la derecha de pantalla
	// y todo un poco más abajo en el mundo (x + z), para que la franja de la línea del tiempo no corte el centro de abajo
	const DER: V3 = [-3.2, 1, 5.2];
	const CENTRO: V3 = [1, 1, 1];
	const piloto = G('07-implementacion', 'implementación') - 4;
	const i03 = inicio('03-contratos');
	const i07 = inicio('07-implementacion');
	const i08 = inicio('08-reportes');
	const i10 = inicio('10-inicio');
	const i11 = inicio('11-reglamento');
	const i12 = inicio('12-ley');
	const i13 = inicio('13-necesitamos');

	const camara = {
		objetivo: recorridoCon<V3>(F, [
			[0, CENTRO],
			[i03, CENTRO],
			[i03 + 36, DER, curvas.sale],
			[i10, DER],
			[i10 + 36, CENTRO, curvas.sale],
			[i11, CENTRO],
			[i11 + 36, DER, curvas.sale],
			[i12, DER],
			[i13, CENTRO],
			[fin, CENTRO],
		]),
		zoom: recorridoCon<number>(F, [
			[0, 40],
			[i03, 44],
			[i03 + 36, 50, curvas.sale],
			[i07, 52],
			[i07 + 30, 50, curvas.sale],
			[i08, 50],
			[i08 + 34, 52, curvas.sale],
			[i10, 50],
			[i10 + 36, 44, curvas.suave],
			[i11, 44],
			[i11 + 36, 50, curvas.sale],
			[i12, 50],
			[i13, 41],
			[fin, 38],
		]),
		azimut: recorridoCon<number>(F, [
			[0, Math.PI / 4 - 0.18],
			[i03 + 36, Math.PI / 4, curvas.suave],
			[i10, Math.PI / 4 + 0.06],
			[i13, Math.PI / 4 + 0.3, curvas.suave],
			[fin, Math.PI / 4 + 0.4],
		]),
	};

	// Puntualiza sube al empezar el piloto, y de ahí las rutas a cada centro
	const sube = tramo(F, piloto, 22, curvas.sale);
	const ondas = [piloto + 14, piloto + 34, ...Array.from({length: 30}, (_, k) => piloto + 70 + k * 40)].map((o) => (F - o) / 40);

	// durante la implementación cada centro marca: pulsos hacia el centro
	const marcan = G('07-implementacion', 'cuatro');
	const firman = G('06-politica', 'firm');

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
				const dibujo = tramo(F, piloto + 16 + i * 6, 20, curvas.sale);
				return (
					<group key={i}>
						<E posicion={s.pos} />
						<Ruta desde={[0, 0.9, 0]} hasta={[s.pos[0], 0.3, s.pos[2]]} dibujo={dibujo} corre={F * 0.015} />
						{Array.from({length: 6}, (_, k) => {
							const firma = firman + i * 6 + k * 3;
							return (
								<Ficha
									key={k}
									posicion={plaza(s, k)}
									estado="presente"
									anillo={F > firma ? Math.max(0.35, destello(F, firma, 24)) : 0}
									color={iso.tinta}
								/>
							);
						})}
						{F > marcan &&
							Array.from({length: 3}, (_, k) => {
								const periodo = 76;
								const fase = (F - marcan + i * 19 + k * 25) % periodo;
								return <Pulso key={k} desde={plaza(s, k * 2)} hasta={[0, 1.1, 0]} p={fase / 34} />;
							})}
					</group>
				);
			})}

			<Centro sube={sube} giroIsotipo={F * 0.002} ondas={ondas} />

			{/* «en los cuatro centros»: cada uno dice que está en implementación */}
			{SITIOS.map((s, i) => {
				const t = marcan + i * 5;
				const v = Math.min(tramo(F, t, 9, curvas.sale), 1 - tramo(F, i08 - 7, 7));
				return (
					<Etiqueta key={i} posicion={[s.pos[0], s.alto, s.pos[2]]} visible={v}>
						<div style={ETIQUETA}>
							<Chip estado="presente" tam={18}>
								En implementación
							</Chip>
						</div>
					</Etiqueta>
				);
			})}
		</EscenaIso>
	);
};
