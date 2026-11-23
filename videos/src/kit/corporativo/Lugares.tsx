import React from 'react';
import {interpolateColors} from 'remotion';
import {
	Arbol,
	Calle,
	Carpeta,
	Cuarto,
	Edificio,
	Escritorio,
	Estrado,
	Farola,
	Hoja,
	Kiosco,
	MesaJuntas,
	Monitor,
	Mostrador,
	Pizarron,
	Planta,
	PuertaCristal,
	Reloj,
	RelojChecador,
	Repisa,
	set,
	Silla,
	Taza,
	Teclado,
	Ventanal,
	type Dibujo,
} from './Sets';
import type {V3} from '../movimiento';

/**
 * Los lugares de las historias (nacieron en «Una hora más»). Cada uno es un set fijo; lo que cambia
 * de una escena a otra es la hora (reloj, cielo, luz) y quién está.
 */

// --- la oficina abierta: tres puestos, Ana en el de en medio
export const PUESTOS: V3[] = [
	[-3, 0, -1.4],
	[0, 0, -1.4],
	[3, 0, -1.4],
];
/** dónde se sienta quien ocupa un puesto (detrás del escritorio, mirando a la cámara) */
export const asiento = (p: V3): V3 => [p[0], 0, p[2] - 0.62];

export const OficinaAbierta: React.FC<{minutos: number; noche: number; children?: React.ReactNode}> = ({minutos, noche, children}) => (
	<Cuarto ancho={10} fondo={7}>
		<Ventanal posicion={[-1.2, 1.75, -3.49]} ancho={5.6} alto={1.7} hojas={4} cielo={interpolateColors(noche, [0, 0.6, 1], [set.manana, set.tarde, set.noche])} />
		<Reloj posicion={[3.2, 2.35, -3.48]} minutos={minutos} />
		<Repisa posicion={[-4.88, 1.45, -0.5]} giro={Math.PI / 2} />
		<Planta posicion={[4.3, 0, -2.9]} />
		<Planta posicion={[-4.3, 0, -2.9]} />
		{PUESTOS.map((p, i) => (
			<group key={i}>
				<Escritorio posicion={p} ancho={1.6} />
				<Monitor posicion={[p[0] + 0.45, 0.76, p[2] - 0.12]} giro={Math.PI} apagado={i !== 1 && noche > 0.8} />
				<Teclado posicion={[p[0] - 0.05, 0.77, p[2] - 0.15]} />
				<Silla posicion={asiento(p)} />
			</group>
		))}
		<Taza posicion={[-0.55, 0.76, -1.25]} />
		{children}
	</Cuarto>
);

// --- la oficina de Luis
export const ESCRITORIO_LUIS: V3 = [0.4, 0, -0.9];
export const SILLA_LUIS: V3 = [0.4, 0, -1.55];

export const OficinaLuis: React.FC<{pantalla?: Dibujo; children?: React.ReactNode}> = ({pantalla, children}) => (
	<Cuarto ancho={8} fondo={6}>
		<Ventanal posicion={[-1.4, 1.75, -2.99]} ancho={3.2} alto={1.6} cielo={set.manana} />
		<Pizarron posicion={[2.3, 1.6, -2.97]} />
		<Repisa posicion={[-3.88, 1.5, -0.4]} giro={Math.PI / 2} />
		<Planta posicion={[-3.3, 0, -2.4]} />
		<Escritorio posicion={ESCRITORIO_LUIS} ancho={1.8} />
		<Monitor posicion={[ESCRITORIO_LUIS[0] + 0.35, 0.76, ESCRITORIO_LUIS[2] - 0.1]} giro={Math.PI - 0.25} dibujo={pantalla} />
		<Carpeta posicion={[ESCRITORIO_LUIS[0] - 0.5, 0.77, ESCRITORIO_LUIS[2] + 0.05]} giro={0.2} />
		<Silla posicion={SILLA_LUIS} />
		{children}
	</Cuarto>
);

// --- la sala de audiencias
export const SalaAudiencias: React.FC<{children?: React.ReactNode}> = ({children}) => (
	<Cuarto ancho={10} fondo={7} pared="#E9E5DF">
		<Estrado posicion={[0, 0, -2.6]} />
		{[-2.3, 2.3].map((x) => (
			<group key={x}>
				<MesaJuntas posicion={[x, 0, 0.6]} largo={1.9} />
				<Silla posicion={[x - 0.4, 0, 1.35]} giro={Math.PI} />
				<Silla posicion={[x + 0.4, 0, 1.35]} giro={Math.PI} />
			</group>
		))}
		<Carpeta posicion={[2.1, 0.77, 0.5]} color={set.grafito} />
		<Hoja posicion={[2.6, 0.765, 0.55]} rot={0.15} />
		{children}
	</Cuarto>
);

// --- la recepción
export const KIOSCO: V3 = [-1.2, 0, 0.3];
export const PUERTA: V3 = [-2.6, 0, -2.99];

export const CHECADOR: V3 = [-1.25, 1.3, -2.95];

/**
 * `checador` 0→1 cuelga el reloj checador de huella junto a la puerta;
 * `kioscoSube` 0→1 hace subir el kiosco del piso (1 = ya está, por omisión).
 */
export const Recepcion: React.FC<{
	minutos: number;
	abre: number;
	kiosco?: Dibujo;
	checador?: number;
	led?: number;
	kioscoSube?: number;
	children?: React.ReactNode;
}> = ({minutos, abre, kiosco, checador = 0, led = 0, kioscoSube = 1, children}) => (
	<Cuarto ancho={9} fondo={6}>
		<PuertaCristal posicion={PUERTA} abre={abre} />
		<Reloj posicion={[0.4, 2.3, -2.98]} minutos={minutos} />
		<Mostrador posicion={[2.2, 0, -1.2]} />
		<Planta posicion={[-3.9, 0, -2.4]} />
		<Planta posicion={[3.9, 0, -2.4]} />
		{checador > 0 && <RelojChecador posicion={CHECADOR} escala={checador} led={led} />}
		{kioscoSube > 0 && (
			<group position={[0, -1.5 * (1 - kioscoSube), 0]}>
				<Kiosco posicion={KIOSCO} giro={0.35} dibujo={kiosco} />
			</group>
		)}
		{children}
	</Cuarto>
);

// --- la calle
export const EDIFICIO: V3 = [0, 0, -4];
export const ENTRADA: V3 = [1.4, 0, -0.6];

export const Exterior: React.FC<{noche: number; children?: React.ReactNode}> = ({noche, children}) => (
	<group>
		<Calle color={interpolateColors(noche, [0, 1], ['#D3CEC6', '#7E8089'])} />
		<Edificio posicion={EDIFICIO} pisos={6} luz={noche} />
		{[-7, -2.5, 4.5, 9].map((x) => (
			<Farola key={x} posicion={[x, 0, 5.4]} luz={noche} />
		))}
		{[-9, -5, 6.5, 11].map((x) => (
			<Arbol key={x} posicion={[x, 0, 4.6]} />
		))}
		<Edificio posicion={[-11, 0, -6]} pisos={4} luz={noche * 0.7} ancho={5} />
		<Edificio posicion={[11, 0, -6]} pisos={5} luz={noche * 0.6} ancho={5} />
		{children}
	</group>
);
