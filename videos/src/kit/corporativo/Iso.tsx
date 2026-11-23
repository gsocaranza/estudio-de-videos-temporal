import {Html, Line, OrthographicCamera, RoundedBox, useTexture} from '@react-three/drei';
import {ThreeCanvas} from '@remotion/three';
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {staticFile, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {FAMILIA} from '../fuentes';
import type {V3} from '../movimiento';
import {estado, marca} from '../paleta';

/**
 * El estilo corporativo en 3D (2026-10-16): un mundo isométrico de la marca.
 *
 * Sale del desarme del demo logístico de referencia
 * (docs/videos-explicativos/referencias/corporativo/): cámara ortográfica a
 * 45° y ~35° de alto, edificios geométricos limpios sobre una cuadrícula
 * clara, sin personajes con cara, y la información flotando en tarjetas. Con
 * la paleta de Puntualiza, que es monocroma: papel, blanco, grises cálidos y
 * negro; el color sólo aparece cuando significa algo (presente, retardo,
 * falta).
 */
export const iso = {
	papel: marca.fondo,
	blanco: '#FBFAF8',
	muro: '#F4F2EE',
	lote: '#E9E6E1',
	linea: '#DEDAD4',
	gris: '#CFCAC3',
	grisOscuro: '#9E9A94',
	tinta: marca.tinta,
	negro: marca.oscuro,
	vidrio: '#2E2E2C',
	/** la textura del isotipo sobre el pedestal; un tema puede cambiarla */
	isotipo: 'marca/isotipo-claro.png',
};

const mate = {roughness: 0.78, metalness: 0} as const;

/** Lienzo isométrico: cámara ortográfica, luz de estudio y sombras suaves. */
export const EscenaIso: React.FC<{
	objetivo: V3;
	/** píxeles por unidad: 40 ve todo el mundo, 100 un edificio */
	zoom: number;
	azimut?: number;
	elevacion?: number;
	children: React.ReactNode;
}> = ({objetivo, zoom, azimut = Math.PI / 4, elevacion = 0.62, children}) => {
	const {width, height} = useVideoConfig();
	return (
		<ThreeCanvas width={width} height={height} flat shadows="percentage" gl={{antialias: true, preserveDrawingBuffer: true}}>
			<color attach="background" args={[iso.papel]} />
			<CamaraIso objetivo={objetivo} zoom={zoom} azimut={azimut} elevacion={elevacion} />
			<hemisphereLight args={['#FFFFFF', '#D6D1C9', 1.9]} />
			<directionalLight
				position={[-9, 18, 12]}
				intensity={1.6}
				color="#FFFDF8"
				castShadow
				shadow-mapSize={[4096, 4096]}
				shadow-bias={-0.0003}
				shadow-normalBias={0.03}
				shadow-radius={5}
				shadow-camera-left={-22}
				shadow-camera-right={22}
				shadow-camera-top={22}
				shadow-camera-bottom={-22}
				shadow-camera-near={1}
				shadow-camera-far={60}
			/>
			<directionalLight position={[10, 6, 14]} intensity={0.35} />
			<Suelo />
			{children}
		</ThreeCanvas>
	);
};

const CamaraIso: React.FC<{objetivo: V3; zoom: number; azimut: number; elevacion: number}> = ({
	objetivo,
	zoom,
	azimut,
	elevacion,
}) => {
	const ref = useRef<THREE.OrthographicCamera>(null);
	const d = 60;
	const pos: V3 = [
		objetivo[0] + d * Math.cos(elevacion) * Math.sin(azimut),
		objetivo[1] + d * Math.sin(elevacion),
		objetivo[2] + d * Math.cos(elevacion) * Math.cos(azimut),
	];
	useLayoutEffect(() => {
		ref.current?.lookAt(objetivo[0], objetivo[1], objetivo[2]);
		ref.current?.updateProjectionMatrix();
	});
	return <OrthographicCamera ref={ref} makeDefault position={pos} zoom={zoom} near={0.1} far={200} />;
};

/** El piso: papel con una cuadrícula fina, como la hoja de un plano. */
const Suelo: React.FC = () => {
	const lineas = useMemo(() => {
		const g = new THREE.GridHelper(80, 80, iso.linea, iso.linea);
		(g.material as THREE.Material).transparent = true;
		(g.material as THREE.Material).opacity = 0.55;
		return g;
	}, []);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[200, 200]} />
				<meshStandardMaterial color={iso.papel} {...mate} />
			</mesh>
			<primitive object={lineas} position={[0, 0.002, 0]} />
		</group>
	);
};

type Pos = {posicion: V3; giro?: number; /** 0→1: el edificio sube desde el piso */ sube?: number};

const Base: React.FC<Pos & {ancho: number; fondo: number; children: React.ReactNode}> = ({
	posicion,
	giro = 0,
	sube = 1,
	ancho,
	fondo,
	children,
}) => (
	<group position={posicion} rotation={[0, giro, 0]}>
		{/* el lote */}
		<RoundedBox args={[ancho + 1.4, 0.08, fondo + 1.4]} radius={0.03} position={[0, 0.04, 0]} receiveShadow>
			<meshStandardMaterial color={iso.lote} {...mate} />
		</RoundedBox>
		<group scale={[1, Math.max(0.001, sube), 1]} position={[0, 0.08, 0]}>
			{children}
		</group>
	</group>
);

/** Franja de ventanas sobre las dos caras que ve la cámara (+x y +z). */
const Ventanas: React.FC<{ancho: number; fondo: number; y: number; alto: number}> = ({ancho, fondo, y, alto}) => (
	<>
		<mesh position={[0, y, fondo / 2 + 0.006]}>
			<planeGeometry args={[ancho - 0.3, alto]} />
			<meshStandardMaterial color={iso.vidrio} roughness={0.35} />
		</mesh>
		<mesh position={[ancho / 2 + 0.006, y, 0]} rotation={[0, Math.PI / 2, 0]}>
			<planeGeometry args={[fondo - 0.3, alto]} />
			<meshStandardMaterial color={iso.vidrio} roughness={0.35} />
		</mesh>
	</>
);

/** Edificio de oficinas: torre con franjas de ventanas y pretil negro. */
export const Oficina: React.FC<Pos> = (p) => {
	const [a, f, h] = [2.8, 2.8, 4.2];
	return (
		<Base {...p} ancho={a} fondo={f}>
			<RoundedBox args={[a, h, f]} radius={0.05} position={[0, h / 2, 0]} castShadow receiveShadow>
				<meshStandardMaterial color={iso.blanco} {...mate} />
			</RoundedBox>
			{[0.75, 1.5, 2.25, 3.0, 3.75].map((y) => (
				<Ventanas key={y} ancho={a} fondo={f} y={y} alto={0.38} />
			))}
			<RoundedBox args={[a + 0.08, 0.14, f + 0.08]} radius={0.03} position={[0, h + 0.05, 0]} castShadow>
				<meshStandardMaterial color={iso.tinta} {...mate} />
			</RoundedBox>
			<mesh position={[0.6, 0.32, f / 2 + 0.008]}>
				<planeGeometry args={[0.7, 0.62]} />
				<meshStandardMaterial color={iso.negro} {...mate} />
			</mesh>
		</Base>
	);
};

/** Nave: bloque largo con techo de dientes de sierra y cortina de carga. */
export const Nave: React.FC<Pos> = (p) => {
	const [a, f, h] = [4.6, 3.0, 1.7];
	const dientes = 4;
	return (
		<Base {...p} ancho={a} fondo={f}>
			<RoundedBox args={[a, h, f]} radius={0.04} position={[0, h / 2, 0]} castShadow receiveShadow>
				<meshStandardMaterial color={iso.blanco} {...mate} />
			</RoundedBox>
			{Array.from({length: dientes}, (_, i) => {
				const ancho = a / dientes;
				return (
					<group key={i} position={[-a / 2 + ancho * (i + 0.5), h, 0]}>
						<mesh rotation={[0, 0, 0]} position={[0, 0.3, 0]} castShadow>
							<Diente ancho={ancho} fondo={f} alto={0.6} />
						</mesh>
					</group>
				);
			})}
			{[-1.3, 0.1].map((x) => (
				<mesh key={x} position={[x, 0.6, f / 2 + 0.006]}>
					<planeGeometry args={[1.0, 1.1]} />
					<meshStandardMaterial color={iso.gris} {...mate} />
				</mesh>
			))}
			<mesh position={[1.6, 0.32, f / 2 + 0.008]}>
				<planeGeometry args={[0.55, 0.62]} />
				<meshStandardMaterial color={iso.negro} {...mate} />
			</mesh>
			<Ventanas ancho={a} fondo={f} y={1.35} alto={0.18} />
		</Base>
	);
};

const Diente: React.FC<{ancho: number; fondo: number; alto: number}> = ({ancho, fondo, alto}) => {
	const geo = useMemo(() => {
		const forma = new THREE.Shape();
		forma.moveTo(-ancho / 2, -alto / 2);
		forma.lineTo(ancho / 2, -alto / 2);
		forma.lineTo(ancho / 2, alto / 2);
		forma.lineTo(-ancho / 2, -alto / 2);
		const g = new THREE.ExtrudeGeometry(forma, {depth: fondo, bevelEnabled: false});
		g.translate(0, 0, -fondo / 2);
		return g;
	}, [ancho, fondo, alto]);
	return (
		<>
			<primitive object={geo} attach="geometry" />
			<meshStandardMaterial color={iso.muro} {...mate} />
		</>
	);
};

/** Sucursal: local de un piso con fachada de vidrio y banda negra. */
export const Sucursal: React.FC<Pos> = (p) => {
	const [a, f, h] = [2.6, 2.1, 1.5];
	return (
		<Base {...p} ancho={a} fondo={f}>
			<RoundedBox args={[a, h, f]} radius={0.04} position={[0, h / 2, 0]} castShadow receiveShadow>
				<meshStandardMaterial color={iso.blanco} {...mate} />
			</RoundedBox>
			<mesh position={[0, 0.55, f / 2 + 0.006]}>
				<planeGeometry args={[a - 0.4, 0.9]} />
				<meshStandardMaterial color={iso.vidrio} roughness={0.35} />
			</mesh>
			{/* la banda sobresale 2 cm del techo: a la misma altura los dos planos se pelean el pixel */}
			<RoundedBox args={[a + 0.06, 0.26, f + 0.06]} radius={0.02} position={[0, h - 0.11, 0]} castShadow>
				<meshStandardMaterial color={iso.tinta} {...mate} />
			</RoundedBox>
		</Base>
	);
};

/** Árbol de maqueta, en gris: el verde se reserva para «presente». */
export const Arbol: React.FC<{posicion: V3; escala?: number}> = ({posicion, escala = 1}) => (
	<group position={posicion} scale={escala}>
		<mesh position={[0, 0.25, 0]} castShadow>
			<cylinderGeometry args={[0.04, 0.05, 0.5, 8]} />
			<meshStandardMaterial color={iso.grisOscuro} {...mate} />
		</mesh>
		<mesh position={[0, 0.72, 0]} castShadow>
			<sphereGeometry args={[0.32, 20, 16]} />
			<meshStandardMaterial color={iso.gris} {...mate} />
		</mesh>
	</group>
);

export type EstadoFicha = 'neutro' | 'presente' | 'retardo' | 'falta';

const colorDe: Record<EstadoFicha, string> = {
	neutro: iso.grisOscuro,
	presente: estado.presente,
	retardo: estado.retardo,
	falta: estado.falta,
};

/**
 * Un colaborador: ficha sin cara, como las de un tablero. El anillo de la base
 * dice su estado; `anillo` 0→1 lo enciende.
 */
export const Ficha: React.FC<{posicion: V3; estado?: EstadoFicha; anillo?: number; escala?: number; color?: string}> = ({
	posicion,
	estado: e = 'neutro',
	anillo = 0,
	escala = 1,
	color = iso.tinta,
}) => (
	<group position={posicion} scale={escala}>
		<mesh position={[0, 0.2, 0]} castShadow>
			<capsuleGeometry args={[0.13, 0.16, 8, 20]} />
			<meshStandardMaterial color={color} roughness={0.6} />
		</mesh>
		<mesh position={[0, 0.5, 0]} castShadow>
			<sphereGeometry args={[0.095, 20, 16]} />
			<meshStandardMaterial color={color} roughness={0.6} />
		</mesh>
		{anillo > 0 && (
			<mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.6 + 0.4 * anillo}>
				<ringGeometry args={[0.2, 0.27, 40]} />
				<meshBasicMaterial color={colorDe[e]} transparent opacity={anillo} />
			</mesh>
		)}
	</group>
);

/** Puntualiza en el mundo: pedestal negro con el isotipo, que sube del piso. */
export const Centro: React.FC<{posicion?: V3; sube: number; giroIsotipo?: number; ondas?: number[]}> = ({
	posicion = [0, 0, 0],
	sube,
	giroIsotipo = 0,
	ondas = [],
}) => {
	const isotipo = useTexture(staticFile(iso.isotipo));
	if (sube <= 0) return null;
	return (
		<group position={posicion}>
			<group position={[0, -1.2 * (1 - sube), 0]}>
				<RoundedBox args={[2.4, 1.1, 2.4]} radius={0.12} smoothness={4} position={[0, 0.55, 0]} castShadow receiveShadow>
					<meshStandardMaterial color={iso.negro} roughness={0.45} />
				</RoundedBox>
				<mesh position={[0, 1.105, 0]} rotation={[-Math.PI / 2, 0, giroIsotipo]}>
					<planeGeometry args={[1.5, 1.5]} />
					<meshBasicMaterial map={isotipo} transparent toneMapped={false} />
				</mesh>
			</group>
			{ondas.map((o, i) =>
				o > 0 && o < 1 ? (
					<mesh key={i} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1.6 + o * 3.2}>
						<ringGeometry args={[0.98, 1, 64]} />
						<meshBasicMaterial color={iso.tinta} transparent opacity={(1 - o) * 0.5} />
					</mesh>
				) : null,
			)}
		</group>
	);
};

/** Curva entre dos puntos, levantada en el medio. */
export const curva = (a: V3, b: V3, alto = 1.2) =>
	new THREE.QuadraticBezierCurve3(
		new THREE.Vector3(...a),
		new THREE.Vector3((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + alto, (a[2] + b[2]) / 2),
		new THREE.Vector3(...b),
	);

/** La conexión de un centro con Puntualiza: línea punteada que se dibuja (0→1) y corre. */
export const Ruta: React.FC<{desde: V3; hasta: V3; dibujo: number; corre?: number; color?: string}> = ({
	desde,
	hasta,
	dibujo,
	corre = 0,
	color = iso.tinta,
}) => {
	const puntos = useMemo(() => curva(desde, hasta).getPoints(60), [desde, hasta]);
	if (dibujo <= 0) return null;
	const n = Math.max(2, Math.round(puntos.length * Math.min(1, dibujo)));
	return (
		<Line
			points={puntos.slice(0, n)}
			color={color}
			lineWidth={2.2}
			dashed
			dashSize={0.22}
			gapSize={0.14}
			dashOffset={-corre}
		/>
	);
};

/** Un dato que viaja por la ruta (0→1). */
export const Pulso: React.FC<{desde: V3; hasta: V3; p: number; color?: string}> = ({desde, hasta, p, color = estado.presente}) => {
	const c = useMemo(() => curva(desde, hasta), [desde, hasta]);
	if (p <= 0 || p >= 1) return null;
	const pt = c.getPoint(p);
	return (
		<mesh position={pt}>
			<sphereGeometry args={[0.12, 20, 16]} />
			<meshBasicMaterial color={color} toneMapped={false} />
		</mesh>
	);
};

/**
 * Una etiqueta de interfaz pegada a un punto del mundo (sigue a la cámara).
 * `visible` 0→1 la hace aparecer subiendo un poco, sin rebote.
 */
export const Etiqueta: React.FC<{posicion: V3; visible: number; children: React.ReactNode}> = ({posicion, visible, children}) =>
	visible <= 0 ? null : (
		<Html position={posicion} center zIndexRange={[20, 0]} style={{pointerEvents: 'none'}}>
			<div
				style={{
					opacity: visible,
					transform: `translateY(${(1 - visible) * 14}px)`,
					fontFamily: FAMILIA,
					whiteSpace: 'nowrap',
				}}
			>
				{children}
			</div>
		</Html>
	);

/** La geovalla de un centro: un anillo punteado en el piso que se dibuja (0→1). */
export const Geovalla: React.FC<{centro: V3; radio: number; dibujo: number; color?: string}> = ({centro, radio, dibujo, color = estado.presente}) => {
	const puntos = useMemo(
		() => Array.from({length: 97}, (_, i) => new THREE.Vector3(centro[0] + Math.cos((i / 96) * Math.PI * 2) * radio, 0.03, centro[2] + Math.sin((i / 96) * Math.PI * 2) * radio)),
		[centro, radio],
	);
	if (dibujo <= 0) return null;
	return (
		<>
			<Line points={puntos.slice(0, Math.max(2, Math.round(97 * Math.min(1, dibujo))))} color={color} lineWidth={2.4} dashed dashSize={0.3} gapSize={0.18} />
			<mesh position={[centro[0], 0.02, centro[2]]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[radio, 64]} />
				<meshBasicMaterial color={color} transparent opacity={0.07 * Math.min(1, dibujo)} toneMapped={false} />
			</mesh>
		</>
	);
};
