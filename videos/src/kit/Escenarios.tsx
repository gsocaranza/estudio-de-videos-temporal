import {RoundedBox} from '@react-three/drei';
import React from 'react';
import {escena} from './paleta';

/**
 * Los sets. Como en el estilo de referencia, son maquetas: un cuarto de tres
 * lados abierto hacia la cámara y flotando sobre el fondo de la marca, o una
 * tarima redonda cuando la escena no necesita lugar.
 */
const mate = {roughness: 0.9, metalness: 0} as const;

/** Cuarto de 6 × 4 con pared al fondo y a la izquierda; el piso es una losa con canto. */
export const Cuarto: React.FC<{children?: React.ReactNode; pared?: string}> = ({children, pared = escena.pared}) => (
	<group>
		{/* losa del piso */}
		<RoundedBox args={[6, 0.3, 4]} radius={0.05} position={[0, -0.15, 0]} receiveShadow castShadow>
			<meshStandardMaterial color={escena.piso} {...mate} />
		</RoundedBox>
		{/* pared del fondo */}
		<RoundedBox args={[6, 3.1, 0.18]} radius={0.04} position={[0, 1.4, -2.09]} receiveShadow castShadow>
			<meshStandardMaterial color={pared} {...mate} />
		</RoundedBox>
		{/* pared izquierda */}
		<RoundedBox args={[0.18, 3.1, 4.18]} radius={0.04} position={[-3.09, 1.4, 0]} receiveShadow castShadow>
			<meshStandardMaterial color={escena.paredLateral} {...mate} />
		</RoundedBox>
		{/* zoclos */}
		<mesh position={[0, 0.06, -1.995]} receiveShadow>
			<boxGeometry args={[6, 0.12, 0.02]} />
			<meshStandardMaterial color={escena.zoclo} {...mate} />
		</mesh>
		<mesh position={[-2.995, 0.06, 0]} receiveShadow>
			<boxGeometry args={[0.02, 0.12, 4]} />
			<meshStandardMaterial color={escena.zoclo} {...mate} />
		</mesh>
		{children}
	</group>
);

/** Tarima redonda: el escenario neutro para explicar sin un lugar concreto. */
export const Tarima: React.FC<{radio?: number; children?: React.ReactNode}> = ({radio = 2.4, children}) => (
	<group>
		<mesh position={[0, -0.12, 0]} receiveShadow castShadow>
			<cylinderGeometry args={[radio, radio, 0.24, 96]} />
			<meshStandardMaterial color={escena.tarimaCanto} {...mate} />
		</mesh>
		<mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<circleGeometry args={[radio - 0.02, 96]} />
			<meshStandardMaterial color={escena.tarima} {...mate} />
		</mesh>
		{children}
	</group>
);
