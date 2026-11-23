import {PerspectiveCamera} from '@react-three/drei';
import {ThreeCanvas} from '@remotion/three';
import React, {useLayoutEffect, useRef} from 'react';
import {useVideoConfig} from 'remotion';
import type * as THREE from 'three';
import {mezcla, type V3} from '../movimiento';
import {marca} from '../paleta';

/**
 * El lienzo de las historias: cámara con perspectiva (lente de 28–35°, que
 * aplana un poco y da aire de maqueta) y luz de estudio que cambia con la
 * hora. `noche` 0→1 baja el cielo, enfría la luz y oscurece el fondo; las
 * ventanas y lámparas encendidas las pone cada set.
 */
export const EscenaHistoria: React.FC<{
	camara: {pos: V3; mira: V3; fov?: number};
	noche?: number;
	tarde?: number;
	fondo?: string;
	/** medio lado del área que proyecta sombra */
	sombra?: number;
	children: React.ReactNode;
}> = ({camara, noche = 0, tarde = 0, fondo, sombra = 8, children}) => {
	const {width, height} = useVideoConfig();
	const cielo = fondo ?? (noche > 0.5 ? '#1F232B' : marca.fondo);
	const g = 0.97 - 0.15 * tarde - 0.1 * noche;
	const b = 0.93 - 0.3 * tarde + 0.12 * noche;
	return (
		<ThreeCanvas width={width} height={height} flat shadows="percentage" gl={{antialias: true, preserveDrawingBuffer: true}}>
			<color attach="background" args={[cielo]} />
			<Camara {...camara} />
			<hemisphereLight args={[noche > 0.5 ? '#8FA0BF' : '#FFFFFF', '#C9C2B7', mezcla(1.7, 0.75, noche)]} />
			<directionalLight
				position={[-5, 10, 7]}
				intensity={mezcla(1.75, 0.55, noche)}
				color={[1, g, b]}
				castShadow
				shadow-mapSize={[4096, 4096]}
				shadow-bias={-0.0003}
				shadow-normalBias={0.02}
				shadow-radius={5}
				shadow-camera-left={-sombra}
				shadow-camera-right={sombra}
				shadow-camera-top={sombra}
				shadow-camera-bottom={-sombra}
				shadow-camera-near={1}
				shadow-camera-far={60}
			/>
			<directionalLight position={[4, 4, 9]} intensity={mezcla(0.4, 0.2, noche)} />
			{children}
		</ThreeCanvas>
	);
};

const Camara: React.FC<{pos: V3; mira: V3; fov?: number}> = ({pos, mira, fov = 32}) => {
	const ref = useRef<THREE.PerspectiveCamera>(null);
	useLayoutEffect(() => {
		ref.current?.lookAt(mira[0], mira[1], mira[2]);
		ref.current?.updateProjectionMatrix();
	});
	return <PerspectiveCamera ref={ref} makeDefault position={pos} fov={fov} near={0.1} far={200} />;
};
