import React from 'react';
import {interpolateColors} from 'remotion';
import {EscenaHistoria} from './EscenaHistoria';
import {Exterior, ENTRADA, KIOSCO, OficinaAbierta, OficinaLuis, PUERTA, PUESTOS, Recepcion, SILLA_LUIS} from './Lugares';
import {andar, caminar, ELENCO, llamada, Persona, pie, telefono, tocaTelefono, tocar, type Pose} from './Persona';
import {pantallaMarca} from './Piezas';
import {Telefono, type Dibujo} from './Sets';
import {curvas, destello, recorridoCon, tramo, type V3} from '../movimiento';
import {estado} from '../paleta';

/**
 * Tomas 3D que se repiten entre historias: alguien marca en el kiosco, en la
 * aplicación o por llamada, y la directora (o el supervisor) en su oficina.
 * Cada una recibe `g`, el cuadro dentro de la toma, y el cuadro en que pasa
 * lo importante (`toca`); el que camina se ajusta para llegar antes.
 */
const hora = (h: number, m = 0) => h * 60 + m;

/** Alguien entra a la recepción y marca en el kiosco en el cuadro `toca`. */
export const TomaKiosco: React.FC<{
	g: number;
	dura: number;
	toca: number;
	quien?: keyof typeof ELENCO;
	cerca?: boolean;
	reloj?: number;
	/** lo que enseña el kiosco, si no es «Marca tu entrada» */
	pantalla?: Dibujo;
}> = ({g, dura, toca, quien = 'elena', cerca = false, reloj = hora(8, 57), pantalla}) => {
	const puntos: V3[] = [[PUERTA[0] + 0.3, 0, -1.6], [KIOSCO[0] - 0.25, 0, KIOSCO[2] + 0.62]];
	const largo = Math.hypot(puntos[1][0] - puntos[0][0], puntos[1][2] - puntos[0][2]);
	const sale = toca - 8 - (largo / 1.35) * 30;
	const ruta = caminar(g, puntos, sale, 1.35);
	const pT = tramo(g, toca - 6, 8, curvas.sale) * (1 - tramo(g, toca + 26, 10));
	const pose: Pose = ruta.andando ? andar(ruta.fase) : tocar(pie(g, 1), pT);
	const ok = tramo(g, toca, 4);
	const camara = cerca
		? {pos: recorridoCon<V3>(g, [[0, [1.0, 1.8, 3.2]], [dura, [0.6, 1.7, 2.7]]]), mira: [-1.2, 1.2, 0.2] as V3, fov: 32}
		: {pos: recorridoCon<V3>(g, [[0, [2.8, 2.4, 6.0]], [dura, [1.8, 2.1, 4.8]]]), mira: [-1.2, 1.1, -0.4] as V3, fov: 34};
	return (
		<EscenaHistoria camara={camara}>
			<Recepcion minutos={reloj} abre={tramo(g, sale - 12, 10) * (1 - tramo(g, sale + 20, 12))} kiosco={pantalla ?? pantallaMarca('Entrada', '8:58 a. m.', ok)}>
				<Persona posicion={ruta.pos} giro={ruta.andando ? ruta.giro : Math.PI + 0.35} pose={pose} ropa={ELENCO[quien]} />
				<Persona posicion={[2.2, 0, -1.85]} pose={pie(g, 6)} ropa={ELENCO.sofia} />
			</Recepcion>
		</EscenaHistoria>
	);
};

/** Alguien de pie junto a su escritorio marca con el teléfono en el cuadro `toca`. */
export const TomaApp: React.FC<{g: number; dura: number; toca: number; quien?: keyof typeof ELENCO}> = ({g, dura, toca, quien = 'jorge'}) => {
	const base = pie(g, 3);
	const conTel = tramo(g, 0, 8, curvas.sale);
	const pose = tocaTelefono(telefono(base), destello(g, toca - 4, 14));
	const ok = tramo(g, toca + 2, 4);
	const lugar: V3 = [PUESTOS[2][0] - 1.1, 0, PUESTOS[2][2] + 0.5];
	return (
		<EscenaHistoria camara={{pos: recorridoCon<V3>(g, [[0, [lugar[0] + 1.6, 1.75, lugar[2] + 2.6]], [dura, [lugar[0] + 1.2, 1.65, lugar[2] + 2.1]]]), mira: [lugar[0], 1.25, lugar[2]], fov: 32}}>
			<OficinaAbierta minutos={hora(8, 59)} noche={0}>
				<Persona
					posicion={lugar}
					giro={0.4}
					pose={conTel > 0 ? pose : base}
					ropa={ELENCO[quien]}
					enLaMano={<Telefono posicion={[0, -0.03, 0.05]} rot={[-1.25, 0, 0]} color={interpolateColors(ok, [0, 1], ['#F4F2EE', estado.presente])} />}
				/>
			</OficinaAbierta>
		</EscenaHistoria>
	);
};

/** Alguien en la calle, con el teléfono al oído: marca por llamada. */
export const TomaLlamada: React.FC<{g: number; dura: number; quien?: keyof typeof ELENCO}> = ({g, dura, quien = 'raul'}) => {
	const ruta = caminar(g, [[ENTRADA[0] - 3.2, 0, 3.0], [ENTRADA[0] - 1.0, 0, 2.2]], 0, 0.6);
	const pose = llamada(ruta.andando ? andar(ruta.fase * 0.8) : pie(g, 4));
	return (
		<EscenaHistoria sombra={14} camara={{pos: recorridoCon<V3>(g, [[0, [ENTRADA[0] + 1.6, 1.6, 6.2]], [dura, [ENTRADA[0] + 1.2, 1.6, 5.4]]]), mira: [ENTRADA[0] - 1.8, 1.4, 2.4], fov: 34}}>
			<Exterior noche={0}>
				<Persona posicion={ruta.pos} giro={ruta.andando ? ruta.giro : 1.2} pose={pose} ropa={ELENCO[quien]} enLaMano={<Telefono posicion={[0, -0.02, 0.03]} rot={[-0.4, 0, 0]} />} />
			</Exterior>
		</EscenaHistoria>
	);
};

/** La oficina de la directora: ella en su escritorio con el monitor. */
export const TomaOficina: React.FC<{
	camara: {pos: V3; mira: V3; fov?: number};
	quien?: keyof typeof ELENCO;
	pose: Pose;
	pantalla?: Dibujo;
	otro?: {quien: keyof typeof ELENCO; pos: V3; giro: number; pose: Pose};
	children?: React.ReactNode;
}> = ({camara, quien = 'carmen', pose, pantalla, otro, children}) => (
	<EscenaHistoria camara={camara}>
		<OficinaLuis pantalla={pantalla}>
			<Persona posicion={[SILLA_LUIS[0], 0, SILLA_LUIS[2] + 0.04]} pose={pose} ropa={ELENCO[quien]} />
			{otro && <Persona posicion={otro.pos} giro={otro.giro} pose={otro.pose} ropa={ELENCO[otro.quien]} />}
			{children}
		</OficinaLuis>
	</EscenaHistoria>
);
