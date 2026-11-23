import {RoundedBox} from '@react-three/drei';
import React from 'react';
import {escena, estado, marca} from './paleta';
import type {V3} from './movimiento';

/**
 * Los objetos de las maquetas. Primitivas con esquinas redondeadas y color
 * plano: el detalle justo para que se reconozcan, ni uno más.
 */
const mate = {roughness: 0.85, metalness: 0} as const;

type Pos = {posicion?: V3; giro?: number; escala?: number};

const Grupo: React.FC<Pos & {children: React.ReactNode}> = ({posicion = [0, 0, 0], giro = 0, escala = 1, children}) => (
	<group position={posicion} rotation={[0, giro, 0]} scale={escala}>
		{children}
	</group>
);

/** Escritorio de 1.7 × 0.75, cubierta a 0.55 de alto. */
export const Escritorio: React.FC<Pos> = (p) => (
	<Grupo {...p}>
		<RoundedBox args={[1.7, 0.07, 0.75]} radius={0.02} position={[0, 0.55, 0]} castShadow receiveShadow>
			<meshStandardMaterial color={escena.maderaClara} {...mate} />
		</RoundedBox>
		{[-0.76, 0.76].map((x) => (
			<RoundedBox key={x} args={[0.06, 0.52, 0.66]} radius={0.015} position={[x, 0.26, 0]} castShadow receiveShadow>
				<meshStandardMaterial color={escena.madera} {...mate} />
			</RoundedBox>
		))}
	</Grupo>
);

/** Laptop abierta. `brillo` enciende la pantalla. */
export const Laptop: React.FC<Pos & {brillo?: number}> = ({brillo = 1, ...p}) => (
	<Grupo {...p}>
		<RoundedBox args={[0.5, 0.025, 0.34]} radius={0.01} position={[0, 0.0125, 0]} castShadow>
			<meshStandardMaterial color={escena.metal} {...mate} />
		</RoundedBox>
		<group position={[0, 0.02, -0.16]} rotation={[-0.28, 0, 0]}>
			<RoundedBox args={[0.5, 0.33, 0.02]} radius={0.01} position={[0, 0.165, 0]} castShadow>
				<meshStandardMaterial color={escena.metal} {...mate} />
			</RoundedBox>
			<mesh position={[0, 0.17, 0.0105]}>
				<planeGeometry args={[0.44, 0.27]} />
				<meshStandardMaterial
					color={escena.pantalla}
					emissive={estado.justificadoSuave}
					emissiveIntensity={0.55 * brillo}
				/>
			</mesh>
		</group>
	</Grupo>
);

/**
 * Reloj de pared. `minutos` desde las 12:00 (p. ej. 19 h = 1140): las dos
 * manecillas salen de ahí, así que hacer correr el tiempo es interpolar un número.
 */
export const Reloj: React.FC<Pos & {minutos: number}> = ({minutos, ...p}) => {
	const horas = minutos / 60;
	const angHora = -((horas % 12) / 12) * Math.PI * 2;
	const angMin = -((minutos % 60) / 60) * Math.PI * 2;
	return (
		<Grupo {...p}>
			<mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
				<cylinderGeometry args={[0.26, 0.26, 0.05, 48]} />
				<meshStandardMaterial color={marca.tinta} {...mate} />
			</mesh>
			<mesh position={[0, 0, 0.026]}>
				<circleGeometry args={[0.225, 48]} />
				<meshStandardMaterial color={escena.papel} {...mate} />
			</mesh>
			{Array.from({length: 12}, (_, i) => {
				const a = (i / 12) * Math.PI * 2;
				const largo = i % 3 === 0 ? 0.045 : 0.025;
				return (
					<mesh key={i} position={[Math.sin(a) * 0.19, Math.cos(a) * 0.19, 0.03]} rotation={[0, 0, -a]}>
						<planeGeometry args={[0.012, largo]} />
						<meshBasicMaterial color={marca.tinta} />
					</mesh>
				);
			})}
			<group rotation={[0, 0, angHora]} position={[0, 0, 0.034]}>
				<mesh position={[0, 0.055, 0]}>
					<planeGeometry args={[0.022, 0.12]} />
					<meshBasicMaterial color={marca.tinta} />
				</mesh>
			</group>
			<group rotation={[0, 0, angMin]} position={[0, 0, 0.038]}>
				<mesh position={[0, 0.08, 0]}>
					<planeGeometry args={[0.014, 0.17]} />
					<meshBasicMaterial color={marca.tinta} />
				</mesh>
			</group>
			<mesh position={[0, 0, 0.04]}>
				<circleGeometry args={[0.016, 16]} />
				<meshBasicMaterial color={estado.falta} />
			</mesh>
		</Grupo>
	);
};

/** Ventana con el cielo de la hora del día. */
export const Ventana: React.FC<Pos & {cielo: string}> = ({cielo, ...p}) => (
	<Grupo {...p}>
		<RoundedBox args={[1.1, 0.8, 0.06]} radius={0.02} castShadow receiveShadow>
			<meshStandardMaterial color={marca.blanco} {...mate} />
		</RoundedBox>
		{[-0.26, 0.26].map((x) => (
			<mesh key={x} position={[x, 0, 0.031]}>
				<planeGeometry args={[0.47, 0.68]} />
				<meshBasicMaterial color={cielo} />
			</mesh>
		))}
	</Grupo>
);

/** Planta de maceta, follaje facetado. */
export const Planta: React.FC<Pos> = (p) => (
	<Grupo {...p}>
		<mesh position={[0, 0.17, 0]} castShadow receiveShadow>
			<cylinderGeometry args={[0.16, 0.12, 0.34, 24]} />
			<meshStandardMaterial color={escena.maceta} {...mate} />
		</mesh>
		<mesh position={[0, 0.55, 0]} castShadow>
			<icosahedronGeometry args={[0.28, 0]} />
			<meshStandardMaterial color={escena.planta} {...mate} flatShading />
		</mesh>
		<mesh position={[0.12, 0.75, 0.05]} rotation={[0.4, 0.3, 0]} castShadow>
			<icosahedronGeometry args={[0.17, 0]} />
			<meshStandardMaterial color={escena.plantaOscura} {...mate} flatShading />
		</mesh>
	</Grupo>
);

/** Repisa con carpetas. */
export const Repisa: React.FC<Pos> = (p) => (
	<Grupo {...p}>
		<RoundedBox args={[1.1, 0.05, 0.28]} radius={0.01} castShadow receiveShadow>
			<meshStandardMaterial color={escena.madera} {...mate} />
		</RoundedBox>
		{escena.carpetas.concat(escena.carpetas.slice(0, 2)).map((c, i) => (
			<RoundedBox
				key={i}
				args={[0.09, 0.3, 0.22]}
				radius={0.012}
				position={[-0.42 + i * 0.12, 0.175, 0]}
				rotation={[0, 0, i === 5 ? -0.25 : 0]}
				castShadow
			>
				<meshStandardMaterial color={c} {...mate} />
			</RoundedBox>
		))}
	</Grupo>
);

/** Una hoja de papel tamaño carta (acostada). */
export const Papel: React.FC<Pos & {rot?: V3; color?: string}> = ({rot = [0, 0, 0], color = escena.papel, ...p}) => (
	<Grupo {...p}>
		<mesh rotation={rot} castShadow receiveShadow>
			<boxGeometry args={[0.22, 0.004, 0.28]} />
			<meshStandardMaterial color={color} {...mate} />
		</mesh>
	</Grupo>
);

/**
 * El teléfono. Va de pie (pantalla hacia +z). `pantalla` es el color de lo que
 * enseña, y `brillo` lo enciende.
 */
export const Telefono: React.FC<Pos & {pantalla?: string; brillo?: number; rot?: V3}> = ({
	pantalla = estado.justificadoSuave,
	brillo = 1,
	rot = [0, 0, 0],
	...p
}) => (
	<Grupo {...p}>
		<group rotation={rot}>
			<RoundedBox args={[0.1, 0.2, 0.014]} radius={0.012} smoothness={4} castShadow>
				<meshStandardMaterial color={marca.oscuro} roughness={0.5} />
			</RoundedBox>
			<mesh position={[0, 0, 0.0075]}>
				<planeGeometry args={[0.086, 0.18]} />
				<meshStandardMaterial color={pantalla} emissive={pantalla} emissiveIntensity={0.6 * brillo} />
			</mesh>
		</group>
	</Grupo>
);

/** Una nube de follaje redondo para exteriores y rellenos. */
export const Arbusto: React.FC<Pos & {color?: string}> = ({color = escena.planta, ...p}) => (
	<Grupo {...p}>
		{(
			[
				[0, 0.18, 0, 0.22],
				[0.18, 0.13, 0.05, 0.16],
				[-0.17, 0.12, 0.04, 0.15],
			] as const
		).map(([x, y, z, r], i) => (
			<mesh key={i} position={[x, y, z]} castShadow>
				<icosahedronGeometry args={[r, 1]} />
				<meshStandardMaterial color={color} {...mate} flatShading />
			</mesh>
		))}
	</Grupo>
);
