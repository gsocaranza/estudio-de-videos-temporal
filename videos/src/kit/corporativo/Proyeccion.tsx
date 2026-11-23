import React, {useLayoutEffect, useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import * as THREE from 'three';
import type {V3} from '../movimiento';

/**
 * Dos piezas para no usar `Html` de drei en las historias.
 *
 * `Html` monta su DOM pegado al lienzo, y cuando una escena corta de lugar y
 * su lienzo se desmonta, React truena con «removeChild: the node to be removed
 * is not a child» y el render entero se cae (pasó el 2026-10-16 en el cuadro
 * 630 de «Una hora más»). En el video isométrico no pasaba porque su mundo no
 * se desmonta nunca. Así que:
 *
 * - lo que flota sobre un personaje es 2D y se coloca proyectando su punto 3D
 *   con la misma cámara (`proyecta`, `EtiquetaPlana`);
 * - lo que se ve en una pantalla (monitor, kiosco) se dibuja en un canvas que
 *   se usa como textura (`PantallaDibujada`).
 */
export type Camara = {pos: V3; mira: V3; fov?: number};

/** Dónde cae un punto del mundo en la pantalla, en píxeles. */
export const proyecta = (punto: V3, camara: Camara, ancho: number, alto: number) => {
	const c = new THREE.PerspectiveCamera(camara.fov ?? 32, ancho / alto, 0.1, 200);
	c.position.set(...camara.pos);
	c.lookAt(...camara.mira);
	c.updateMatrixWorld();
	const v = new THREE.Vector3(...punto).project(c);
	return {x: ((v.x + 1) / 2) * ancho, y: ((1 - v.y) / 2) * alto, detras: v.z > 1};
};

/** Algo 2D pegado a un punto 3D: su borde de abajo apunta al punto. */
export const EtiquetaPlana: React.FC<{punto: V3; camara: Camara; visible: number; children: React.ReactNode}> = ({
	punto,
	camara,
	visible,
	children,
}) => {
	const {width, height} = useVideoConfig();
	if (visible <= 0) return null;
	const {x, y, detras} = proyecta(punto, camara, width, height);
	if (detras) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%, calc(-100% + ${(1 - visible) * 14}px))`,
				opacity: visible,
				whiteSpace: 'nowrap',
				pointerEvents: 'none',
			}}
		>
			{children}
		</div>
	);
};

/**
 * Una pantalla 3D cuyo contenido se dibuja con la API de canvas. `dibuja`
 * recibe el contexto y el tamaño en píxeles; `clave` dice cuándo volver a
 * dibujar (cuando cambia lo que se ve, no en cada cuadro).
 */
export const PantallaDibujada: React.FC<{
	ancho: number;
	alto: number;
	dibuja: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
	clave: string;
	resolucion?: number;
}> = ({ancho, alto, dibuja, clave, resolucion = 900}) => {
	const lienzo = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = Math.round(resolucion * (ancho / Math.max(ancho, alto)));
		c.height = Math.round(resolucion * (alto / Math.max(ancho, alto)));
		return c;
	}, [ancho, alto, resolucion]);
	const textura = useMemo(() => {
		const t = new THREE.CanvasTexture(lienzo);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 4;
		return t;
	}, [lienzo]);
	useLayoutEffect(() => {
		const ctx = lienzo.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, lienzo.width, lienzo.height);
		dibuja(ctx, lienzo.width, lienzo.height);
		textura.needsUpdate = true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clave, lienzo, textura]);
	return (
		<mesh>
			<planeGeometry args={[ancho, alto]} />
			<meshBasicMaterial map={textura} toneMapped={false} />
		</mesh>
	);
};

/** Fuente de la marca para el canvas. */
export const fuente = (peso: number, px: number) => `${peso} ${px}px "TASA Orbiter", system-ui, sans-serif`;
