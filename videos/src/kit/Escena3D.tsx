import {PerspectiveCamera} from '@react-three/drei';
import {ThreeCanvas} from '@remotion/three';
import React, {useLayoutEffect, useRef} from 'react';
import {useVideoConfig} from 'remotion';
import type * as THREE from 'three';
import {escena} from './paleta';
import type {V3} from './movimiento';

/**
 * El lienzo 3D de una escena, con la luz y la cámara del estilo.
 *
 * - Lente larga (fov ~30°): aplana la perspectiva y da el aire de maqueta.
 * - Luz principal arriba a la izquierda con sombra suave, y una luz de cielo
 *   muy alta para que ninguna sombra llegue a negro.
 * - `flat` (sin tone mapping): los colores de la paleta salen como se
 *   escribieron, que es lo que hace que la maqueta se vea de la marca.
 *
 * Todo lo que se mueve se calcula con el cuadro de Remotion y se pasa por
 * props: nada de `useFrame`, o el render no sería repetible.
 */
export const Escena3D: React.FC<{
	camara: {pos: V3; mira: V3; fov?: number};
	fondo?: string;
	/** 0 día · 1 tarde: entibia la luz principal */
	tarde?: number;
	children: React.ReactNode;
}> = ({camara, fondo = escena.cielo, tarde = 0, children}) => {
	const {width, height} = useVideoConfig();
	return (
		<ThreeCanvas
			width={width}
			height={height}
			flat
			shadows="percentage"
			style={{background: fondo}}
			gl={{antialias: true, preserveDrawingBuffer: true}}
		>
			<color attach="background" args={[fondo]} />
			<Camara {...camara} />
			<Luces tarde={tarde} />
			{children}
		</ThreeCanvas>
	);
};

const Camara: React.FC<{pos: V3; mira: V3; fov?: number}> = ({pos, mira, fov = 30}) => {
	const ref = useRef<THREE.PerspectiveCamera>(null);
	useLayoutEffect(() => {
		ref.current?.lookAt(mira[0], mira[1], mira[2]);
		ref.current?.updateProjectionMatrix();
	});
	return <PerspectiveCamera ref={ref} makeDefault position={pos} fov={fov} near={0.1} far={100} />;
};

const Luces: React.FC<{tarde: number}> = ({tarde}) => {
	// del blanco cálido del día al naranja de la tarde
	const r = 1;
	const g = 0.97 - 0.17 * tarde;
	const b = 0.92 - 0.35 * tarde;
	return (
		<>
			<hemisphereLight args={['#FFFFFF', '#C9BFAE', 1.75 - 0.25 * tarde]} />
			<directionalLight
				position={[-3, 9, 7]}
				intensity={1.9}
				color={[r, g, b]}
				castShadow
				shadow-mapSize={[2048, 2048]}
				shadow-bias={-0.0004}
				shadow-normalBias={0.02}
				shadow-radius={6}
				shadow-camera-left={-6}
				shadow-camera-right={6}
				shadow-camera-top={6}
				shadow-camera-bottom={-6}
				shadow-camera-near={1}
				shadow-camera-far={25}
			/>
			{/* relleno desde la cámara: levanta las caras que la luz principal no toca */}
			<directionalLight position={[3, 3, 8]} intensity={0.45} />
		</>
	);
};
