import {RoundedBox} from '@react-three/drei';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mezcla, type V3} from '../movimiento';
import {estado as colores} from '../paleta';

/**
 * Persona del estilo corporativo (2026-10-16): proporción adulta (~1.75 de
 * alto, la cabeza un séptimo), sin rostro, ropa de oficina en los neutros de
 * la marca. Es lo contrario del muñeco de clavija: se lee como «una persona de
 * la empresa», no como un juguete. El supervisor pidió personajes, 3D y
 * animación formal; las caras y los ojos grandes eran lo que la hacía aniñada.
 *
 * Está armada con articulaciones (cadera, rodilla, hombro, codo, tronco y
 * cabeza) que se dan como ángulos; las poses de abajo (`pie`, `andar`,
 * `sentada`, `teclear`, `telefono`, `llamada`, `tocar`) devuelven esos ángulos y
 * `mezclaPose` pasa de una a otra. Todo con el cuadro: nada de relojes.
 */
export type Pose = {
	alto: number; // cuánto sube o baja la pelvis
	tronco: V3;
	cabeza: V3;
	hombroI: V3;
	hombroD: V3;
	codoI: number;
	codoD: number;
	caderaI: number;
	caderaD: number;
	rodillaI: number;
	rodillaD: number;
};

const CERO: Pose = {
	alto: 0,
	tronco: [0, 0, 0],
	cabeza: [0, 0, 0],
	hombroI: [0, 0, 0.08],
	hombroD: [0, 0, -0.08],
	codoI: -0.12,
	codoD: -0.12,
	caderaI: 0,
	caderaD: 0,
	rodillaI: 0,
	rodillaD: 0,
};

const m3 = (a: V3, b: V3, p: number): V3 => [mezcla(a[0], b[0], p), mezcla(a[1], b[1], p), mezcla(a[2], b[2], p)];

export const mezclaPose = (a: Pose, b: Pose, p: number): Pose => ({
	alto: mezcla(a.alto, b.alto, p),
	tronco: m3(a.tronco, b.tronco, p),
	cabeza: m3(a.cabeza, b.cabeza, p),
	hombroI: m3(a.hombroI, b.hombroI, p),
	hombroD: m3(a.hombroD, b.hombroD, p),
	codoI: mezcla(a.codoI, b.codoI, p),
	codoD: mezcla(a.codoD, b.codoD, p),
	caderaI: mezcla(a.caderaI, b.caderaI, p),
	caderaD: mezcla(a.caderaD, b.caderaD, p),
	rodillaI: mezcla(a.rodillaI, b.rodillaI, p),
	rodillaD: mezcla(a.rodillaD, b.rodillaD, p),
});

/** De pie, respirando. `f` el cuadro; `semilla` para que no respiren todos a la vez. */
export const pie = (f: number, semilla = 0): Pose => {
	const r = Math.sin((f + semilla * 31) * 0.07);
	return {...CERO, alto: r * 0.004, tronco: [r * 0.01, 0, 0], cabeza: [r * 0.015, 0, 0]};
};

/** Caminando. `fase` en radianes: una zancada completa cada 2π. */
export const andar = (fase: number): Pose => {
	const s = Math.sin(fase);
	const c = Math.cos(fase);
	return {
		...CERO,
		alto: -0.018 + Math.abs(c) * 0.022,
		tronco: [0.04, s * 0.04, 0],
		cabeza: [-0.03, -s * 0.03, 0],
		hombroI: [s * 0.38, 0, 0.1],
		hombroD: [-s * 0.38, 0, -0.1],
		codoI: -0.25 - Math.max(0, s) * 0.3,
		codoD: -0.25 - Math.max(0, -s) * 0.3,
		caderaI: -s * 0.42,
		caderaD: s * 0.42,
		rodillaI: 0.08 + Math.max(0, Math.sin(fase - 0.9)) * 0.62,
		rodillaD: 0.08 + Math.max(0, Math.sin(fase + Math.PI - 0.9)) * 0.62,
	};
};

/** Sentada en una silla de 0.5 de alto. */
export const sentada = (f: number, semilla = 0): Pose => ({
	...pie(f, semilla),
	alto: -0.43,
	caderaI: -1.5,
	caderaD: -1.5,
	rodillaI: 1.45,
	rodillaD: 1.45,
});

/** Las manos sobre un teclado; teclea si `teclea`. */
export const teclear = (base: Pose, f: number, teclea = true): Pose => {
	const t = teclea ? Math.sin(f * 0.9) * 0.05 : 0;
	return {
		...base,
		tronco: [0.12, 0, 0],
		cabeza: [0.25, 0, 0],
		hombroI: [-0.75 + t, 0, 0.18],
		hombroD: [-0.75 - t, 0, -0.18],
		codoI: -0.95,
		codoD: -0.95,
	};
};

/** Mira el teléfono que sostiene con la derecha delante del pecho. */
export const telefono = (base: Pose): Pose => ({
	...base,
	cabeza: [0.42, 0, 0],
	hombroD: [-0.35, 0, -0.18],
	codoD: -1.75,
});

/** Toca la pantalla del teléfono con la izquierda (`p` 0→1→0). */
export const tocaTelefono = (base: Pose, p: number): Pose => ({
	...base,
	hombroI: m3(base.hombroI, [-0.45, 0, 0.32], p),
	codoI: mezcla(base.codoI, -1.55, p),
});

/** Teléfono al oído: una llamada. */
export const llamada = (base: Pose): Pose => ({
	...base,
	cabeza: [0.05, 0, -0.12],
	hombroD: [-0.25, 0, -0.55],
	codoD: -2.45,
});

/** Toca algo enfrente a la altura del pecho (un kiosco). `p` 0→1. */
export const tocar = (base: Pose, p: number): Pose => ({
	...base,
	cabeza: m3(base.cabeza, [0.3, 0, 0], p),
	hombroD: m3(base.hombroD, [-1.15, 0, -0.05], p),
	codoD: mezcla(base.codoD, -0.25, p),
});

/** Señala o explica con la mano abierta. */
export const ademan = (base: Pose, p: number): Pose => ({
	...base,
	hombroD: m3(base.hombroD, [-0.7, 0.2, -0.35], p),
	codoD: mezcla(base.codoD, -0.9, p),
});

/** Encoger los hombros con las palmas arriba: «no tengo con qué». `p` 0→1. */
export const encoger = (base: Pose, p: number): Pose => ({
	...base,
	cabeza: m3(base.cabeza, [0.05, 0, 0.12], p),
	hombroI: m3(base.hombroI, [-0.35, 0, 0.5], p),
	hombroD: m3(base.hombroD, [-0.35, 0, -0.5], p),
	codoI: mezcla(base.codoI, -1.2, p),
	codoD: mezcla(base.codoD, -1.2, p),
});

/** Asentir: la cabeza baja y sube una vez entre `desde` y `desde + 14`. */
export const asentir = (base: Pose, f: number, desde: number): Pose => {
	const t = (f - desde) / 14;
	const a = t > 0 && t < 1 ? Math.sin(t * Math.PI * 2) * 0.16 : 0;
	return {...base, cabeza: [base.cabeza[0] + Math.max(0, a), base.cabeza[1], base.cabeza[2]]};
};

/** Caminar por una ruta de puntos: dónde va, hacia dónde mira y en qué fase de la zancada. */
export const caminar = (f: number, puntos: V3[], desde: number, velocidad = 1.25, fps = 30) => {
	const largos = puntos.slice(1).map((p, i) => Math.hypot(p[0] - puntos[i][0], p[2] - puntos[i][2]));
	const total = largos.reduce((a, b) => a + b, 0);
	const s = Math.min(total, Math.max(0, ((f - desde) / fps) * velocidad));
	let resto = s;
	let i = 0;
	while (i < largos.length - 1 && resto > largos[i]) {
		resto -= largos[i];
		i++;
	}
	const a = puntos[i];
	const b = puntos[i + 1] ?? a;
	const t = largos[i] ? resto / largos[i] : 1;
	return {
		pos: [mezcla(a[0], b[0], t), mezcla(a[1], b[1], t), mezcla(a[2], b[2], t)] as V3,
		giro: Math.atan2(b[0] - a[0], b[2] - a[2]),
		fase: (s / 1.35) * Math.PI * 2,
		andando: f > desde && s < total,
		llego: s >= total,
	};
};

export type Vestuario = {
	piel: string;
	camisa: string;
	pantalon: string;
	pelo: string;
	peinado: 'corto' | 'largo' | 'chongo' | 'rapado';
	saco?: string; // si lleva saco, la camisa sólo asoma en el cuello
};

const mate = {roughness: 0.8, metalness: 0} as const;

export const Persona: React.FC<{
	posicion: V3;
	giro?: number;
	pose: Pose;
	ropa: Vestuario;
	escala?: number;
	/** anillo de estado bajo los pies (0→1) */
	anillo?: number;
	estado?: 'presente' | 'retardo' | 'falta';
	/** lo que lleva en la mano derecha */
	enLaMano?: React.ReactNode;
}> = ({posicion, giro = 0, pose, ropa, escala = 1, anillo = 0, estado = 'presente', enLaMano}) => {
	const torso = useMemo(() => {
		// tronco torneado: cintura, pecho y hombros redondeados
		const perfil = [
			[0.0, -0.02],
			[0.15, 0.0],
			[0.155, 0.12],
			[0.175, 0.3],
			[0.19, 0.42],
			[0.16, 0.5],
			[0.07, 0.54],
			[0.0, 0.545],
		].map(([x, y]) => new THREE.Vector2(x, y));
		const g = new THREE.LatheGeometry(new THREE.SplineCurve(perfil).getPoints(30), 40);
		g.scale(1.12, 1, 0.68);
		return g;
	}, []);
	const arriba = ropa.saco ?? ropa.camisa;
	return (
		<group position={posicion} rotation={[0, giro, 0]} scale={escala}>
			{anillo > 0 && (
				<mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.7 + 0.3 * anillo}>
					<ringGeometry args={[0.36, 0.44, 48]} />
					<meshBasicMaterial color={colores[estado]} transparent opacity={anillo} toneMapped={false} />
				</mesh>
			)}
			<group position={[0, 0.94 + pose.alto, 0]}>
				{/* pelvis: una pieza baja y ancha, escondida bajo el tronco */}
				<RoundedBox args={[0.3, 0.16, 0.19]} radius={0.07} smoothness={4} position={[0, -0.02, 0]} castShadow>
					<meshStandardMaterial color={ropa.pantalon} {...mate} />
				</RoundedBox>
				<Pierna x={-0.085} cadera={pose.caderaI} rodilla={pose.rodillaI} ropa={ropa} />
				<Pierna x={0.085} cadera={pose.caderaD} rodilla={pose.rodillaD} ropa={ropa} />
				<group rotation={pose.tronco}>
					<mesh geometry={torso} position={[0, 0.02, 0]} castShadow>
						<meshStandardMaterial color={arriba} {...mate} />
					</mesh>
					{ropa.saco && (
						// la camisa asoma en el escote del saco
						<mesh position={[0, 0.49, 0.055]} rotation={[0.35, 0, 0]}>
							<coneGeometry args={[0.06, 0.14, 3]} />
							<meshStandardMaterial color={ropa.camisa} {...mate} />
						</mesh>
					)}
					<mesh position={[0, 0.6, 0]} castShadow>
						<cylinderGeometry args={[0.045, 0.05, 0.12, 16]} />
						<meshStandardMaterial color={ropa.piel} {...mate} />
					</mesh>
					<group position={[0, 0.74, 0]} rotation={pose.cabeza}>
						<mesh castShadow scale={[0.9, 1.08, 0.98]}>
							<sphereGeometry args={[0.122, 32, 24]} />
							<meshStandardMaterial color={ropa.piel} {...mate} />
						</mesh>
						<Peinado tipo={ropa.peinado} color={ropa.pelo} />
					</group>
					<Brazo x={-0.215} hombro={pose.hombroI} codo={pose.codoI} manga={arriba} piel={ropa.piel} />
					<Brazo x={0.215} hombro={pose.hombroD} codo={pose.codoD} manga={arriba} piel={ropa.piel}>
						{enLaMano}
					</Brazo>
				</group>
			</group>
		</group>
	);
};

const Pierna: React.FC<{x: number; cadera: number; rodilla: number; ropa: Vestuario}> = ({x, cadera, rodilla, ropa}) => (
	<group position={[x, -0.04, 0]} rotation={[cadera, 0, 0]}>
		<mesh position={[0, -0.2, 0]} castShadow>
			<capsuleGeometry args={[0.072, 0.3, 6, 16]} />
			<meshStandardMaterial color={ropa.pantalon} {...mate} />
		</mesh>
		<group position={[0, -0.42, 0]} rotation={[rodilla, 0, 0]}>
			<mesh position={[0, -0.2, 0]} castShadow>
				<capsuleGeometry args={[0.06, 0.3, 6, 16]} />
				<meshStandardMaterial color={ropa.pantalon} {...mate} />
			</mesh>
			<mesh position={[0, -0.43, 0.045]} castShadow>
				<boxGeometry args={[0.1, 0.07, 0.24]} />
				<meshStandardMaterial color="#1E1E1D" roughness={0.5} />
			</mesh>
		</group>
	</group>
);

const Brazo: React.FC<{x: number; hombro: V3; codo: number; manga: string; piel: string; children?: React.ReactNode}> = ({
	x,
	hombro,
	codo,
	manga,
	piel,
	children,
}) => (
	<group position={[x, 0.45, 0]} rotation={hombro}>
		<mesh position={[0, -0.14, 0]} castShadow>
			<capsuleGeometry args={[0.052, 0.2, 6, 14]} />
			<meshStandardMaterial color={manga} {...mate} />
		</mesh>
		<group position={[0, -0.28, 0]} rotation={[codo, 0, 0]}>
			<mesh position={[0, -0.12, 0]} castShadow>
				<capsuleGeometry args={[0.044, 0.19, 6, 14]} />
				<meshStandardMaterial color={manga} {...mate} />
			</mesh>
			<group position={[0, -0.27, 0]}>
				<mesh castShadow scale={[0.8, 1.15, 0.6]}>
					<sphereGeometry args={[0.05, 16, 12]} />
					<meshStandardMaterial color={piel} {...mate} />
				</mesh>
				{children}
			</group>
		</group>
	</group>
);

const Peinado: React.FC<{tipo: Vestuario['peinado']; color: string}> = ({tipo, color}) => {
	const mat = <meshStandardMaterial color={color} {...mate} side={THREE.DoubleSide} />;
	if (tipo === 'rapado') {
		return (
			<mesh position={[0, 0.012, -0.005]} rotation={[-0.3, 0, 0]} scale={[0.92, 1.1, 1]}>
				<sphereGeometry args={[0.119, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
				{mat}
			</mesh>
		);
	}
	if (tipo === 'corto') {
		return (
			<mesh position={[0, 0.018, -0.008]} rotation={[-0.35, 0, 0]} scale={[0.95, 1.12, 1.03]}>
				<sphereGeometry args={[0.122, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
				{mat}
			</mesh>
		);
	}
	return (
		<group>
			<mesh position={[0, 0.012, -0.012]} rotation={[-0.6, 0, 0]} scale={[0.96, 1.12, 1.04]}>
				<sphereGeometry args={[0.124, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
				{mat}
			</mesh>
			{tipo === 'largo' ? (
				<mesh position={[0, -0.09, -0.05]} scale={[1, 1, 0.7]}>
					<cylinderGeometry args={[0.105, 0.09, 0.2, 24, 1, true, Math.PI * 0.35, Math.PI * 1.3]} />
					{mat}
				</mesh>
			) : (
				<mesh position={[0, 0.06, -0.12]}>
					<sphereGeometry args={[0.055, 20, 14]} />
					{mat}
				</mesh>
			)}
		</group>
	);
};

/** El elenco: ropa de oficina en los neutros de la marca, piel y pelo variados. */
export const ELENCO: Record<string, Vestuario> = {
	ana: {piel: '#C68863', camisa: '#F4F2EE', pantalon: '#4A4743', pelo: '#2B211C', peinado: 'largo', saco: '#B9B2A7'},
	luis: {piel: '#8A5A3F', camisa: '#F4F2EE', pantalon: '#3A3A38', pelo: '#1C1A19', peinado: 'corto', saco: '#3A3A38'},
	marta: {piel: '#E5B396', camisa: '#E2DDD5', pantalon: '#5E5A55', pelo: '#6B6560', peinado: 'chongo'},
	jorge: {piel: '#B07A58', camisa: '#FBFAF8', pantalon: '#6E6A64', pelo: '#2A2522', peinado: 'rapado'},
	sofia: {piel: '#9C6B4E', camisa: '#8C8579', pantalon: '#3A3A38', pelo: '#1A1716', peinado: 'chongo'},
	raul: {piel: '#D9A383', camisa: '#CFC9C0', pantalon: '#4A4743', pelo: '#3B2E26', peinado: 'corto'},
	elena: {piel: '#E1AE8F', camisa: '#F4F2EE', pantalon: '#8C8579', pelo: '#4A3428', peinado: 'largo'},
	tomas: {piel: '#7A4E36', camisa: '#E9E6E1', pantalon: '#3A3A38', pelo: '#151413', peinado: 'rapado', saco: '#9E978C'},
	carmen: {piel: '#D4A07F', camisa: '#F4F2EE', pantalon: '#242423', pelo: '#2B211C', peinado: 'chongo', saco: '#242423'},
};
