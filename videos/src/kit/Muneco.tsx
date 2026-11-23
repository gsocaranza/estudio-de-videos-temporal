import React, {useMemo} from 'react';
import * as THREE from 'three';
import {gente} from './paleta';
import type {V3} from './movimiento';

/**
 * El muñeco de clavija: el personaje del estilo.
 *
 * Cuerpo torneado (sin brazos ni piernas), cabeza esférica apoyada encima,
 * dos ojos de punto, sin boca, y manos sueltas que flotan a los lados. Mide
 * ~1.15 de alto; la cabeza es el 40 % de esa altura, que es lo que lo hace
 * leerse como juguete. Todo mate (roughness alto, sin metal, sin contorno).
 *
 * Las poses se dan por props y se calculan con el cuadro (ver movimiento.ts):
 * `bamboleo` y `brinco` al desplazarse, `cabeza` para mirar o ladearse,
 * `manos` en coordenadas del cuerpo.
 */
export type Pelo = 'melena' | 'corto' | 'chongo' | 'ninguno';

export type PropsMuneco = {
	posicion?: V3;
	/** giro sobre el eje vertical, en radianes; 0 mira a la cámara */
	giro?: number;
	camisa: string;
	piel?: string;
	pelo?: Pelo;
	colorPelo?: string;
	/** [inclinación adelante, giro, ladeo] de la cabeza */
	cabeza?: V3;
	/** ladeo del cuerpo entero (bamboleo) */
	ladeo?: number;
	/** cuánto sube el muñeco (brinco) */
	alto?: number;
	ojos?: number;
	manos?: {izq?: V3; der?: V3};
	/** lo que lleva en la mano derecha (un teléfono, un papel) */
	enLaMano?: React.ReactNode;
	escala?: number;
	/** squash & stretch: <1 se aplasta, >1 se estira */
	estira?: number;
};

const MANO_IZQ: V3 = [-0.34, 0.36, 0.06];
const MANO_DER: V3 = [0.34, 0.36, 0.06];

const mate = {roughness: 0.82, metalness: 0} as const;

export const Muneco: React.FC<PropsMuneco> = ({
	posicion = [0, 0, 0],
	giro = 0,
	camisa,
	piel = gente.pielClara,
	pelo = 'ninguno',
	colorPelo = gente.pelo,
	cabeza = [0, 0, 0],
	ladeo = 0,
	alto = 0,
	ojos = 1,
	manos = {},
	enLaMano,
	escala = 1,
	estira = 1,
}) => {
	const cuerpo = useMemo(() => {
		// perfil de una clavija de madera: base ancha y redondeada, hombros suaves
		const puntos = [
			[0, 0],
			[0.17, 0.005],
			[0.24, 0.04],
			[0.265, 0.12],
			[0.255, 0.3],
			[0.235, 0.46],
			[0.2, 0.58],
			[0.13, 0.665],
			[0, 0.69],
		].map(([x, y]) => new THREE.Vector2(x, y));
		return new THREE.LatheGeometry(new THREE.SplineCurve(puntos).getPoints(40), 48);
	}, []);

	const der = manos.der ?? MANO_DER;
	const izq = manos.izq ?? MANO_IZQ;

	return (
		<group position={[posicion[0], posicion[1] + alto, posicion[2]]} rotation={[0, giro, 0]} scale={escala}>
			{/* el ladeo pivota desde la base, como un tentetieso */}
			<group rotation={[0, 0, ladeo]} scale={[2 - estira, estira, 2 - estira]}>
				<mesh geometry={cuerpo} castShadow receiveShadow>
					<meshStandardMaterial color={camisa} {...mate} />
				</mesh>
				<group position={[0, 0.9, 0]} rotation={cabeza}>
					<mesh castShadow receiveShadow>
						<sphereGeometry args={[0.235, 48, 32]} />
						<meshStandardMaterial color={piel} {...mate} />
					</mesh>
					{[-1, 1].map((lado) => (
						<mesh key={lado} position={[0.075 * lado, 0.015, 0.212]} scale={[1, ojos, 0.6]}>
							<sphereGeometry args={[0.027, 16, 12]} />
							<meshStandardMaterial color={gente.ojos} roughness={0.4} />
						</mesh>
					))}
					<Peinado tipo={pelo} color={colorPelo} />
				</group>
			</group>
			<Mano pos={izq} piel={piel} />
			<Mano pos={der} piel={piel}>
				{enLaMano}
			</Mano>
		</group>
	);
};

const Mano: React.FC<{pos: V3; piel: string; children?: React.ReactNode}> = ({pos, piel, children}) => (
	<group position={pos}>
		<mesh castShadow>
			<sphereGeometry args={[0.068, 24, 16]} />
			<meshStandardMaterial color={piel} {...mate} />
		</mesh>
		{children}
	</group>
);

const Peinado: React.FC<{tipo: Pelo; color: string}> = ({tipo, color}) => {
	if (tipo === 'ninguno') return null;
	const material = <meshStandardMaterial color={color} {...mate} side={THREE.DoubleSide} />;
	if (tipo === 'corto') {
		return (
			<mesh position={[0, 0.02, -0.012]} rotation={[-0.25, 0, 0]} castShadow>
				<sphereGeometry args={[0.247, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
				{material}
			</mesh>
		);
	}
	if (tipo === 'chongo') {
		return (
			<group>
				<mesh position={[0, 0.01, -0.01]} rotation={[-0.3, 0, 0]} castShadow>
					<sphereGeometry args={[0.247, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
					{material}
				</mesh>
				<mesh position={[0, 0.2, -0.17]} castShadow>
					<sphereGeometry args={[0.1, 24, 16]} />
					{material}
				</mesh>
			</group>
		);
	}
	// melena: casquete más bajo por detrás y a los lados, y un fleco
	return (
		<group>
			<mesh position={[0, 0.005, -0.02]} rotation={[-0.55, 0, 0]} castShadow>
				<sphereGeometry args={[0.255, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
				{material}
			</mesh>
			<mesh position={[0, 0.12, 0.09]} rotation={[0.35, 0, 0]} scale={[1, 0.55, 0.7]} castShadow>
				<sphereGeometry args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
				{material}
			</mesh>
		</group>
	);
};
