import {RoundedBox} from '@react-three/drei';
import React from 'react';
import type {V3} from '../movimiento';
import {estado, marca} from '../paleta';
import {PantallaDibujada} from './Proyeccion';

/**
 * Las escenografías de las historias (2026-10-16): maquetas 3D con perspectiva
 * —el formato del primer video, que al supervisor le gustó— pero con la
 * paleta de la marca y mobiliario de oficina sobrio. Blanco, grises cálidos y
 * negro; madera clara para que no se vuelva frío; el color de estado sólo
 * donde significa algo.
 */
export const set = {
	piso: '#D9D4CC',
	pisoClaro: '#E7E3DD',
	pared: '#F1EEE9',
	paredLateral: '#E4E0D9',
	zoclo: '#CFC9C0',
	blanco: '#FBFAF8',
	madera: '#C9B79E',
	maderaOscura: '#8C7A66',
	negro: marca.oscuro,
	tinta: marca.tinta,
	grafito: '#3A3A38',
	gris: '#A7A39C',
	vidrio: '#2E2E2C',
	planta: '#7D8F78', // verde apagado: vida, sin competir con «presente»
	plantaOscura: '#64765F',
	maceta: '#2B2B2A',
	// cielos por hora
	manana: '#DCE6EC',
	tarde: '#EBC9A8',
	noche: '#2F3747',
};

const mate = {roughness: 0.82, metalness: 0} as const;

type Pos = {posicion?: V3; giro?: number; escala?: number};
const G: React.FC<Pos & {children: React.ReactNode}> = ({posicion = [0, 0, 0], giro = 0, escala = 1, children}) => (
	<group position={posicion} rotation={[0, giro, 0]} scale={escala}>
		{children}
	</group>
);

/** Cuarto de maqueta: piso con canto, pared de fondo y pared izquierda. */
export const Cuarto: React.FC<{ancho?: number; fondo?: number; alto?: number; pared?: string; piso?: string; children?: React.ReactNode}> = ({
	ancho = 8,
	fondo = 6,
	alto = 3.2,
	pared = set.pared,
	piso = set.piso,
	children,
}) => (
	<group>
		<RoundedBox args={[ancho, 0.3, fondo]} radius={0.04} position={[0, -0.15, 0]} receiveShadow castShadow>
			<meshStandardMaterial color={piso} {...mate} />
		</RoundedBox>
		<RoundedBox args={[ancho, alto, 0.16]} radius={0.03} position={[0, alto / 2 - 0.15, -fondo / 2 - 0.08]} receiveShadow castShadow>
			<meshStandardMaterial color={pared} {...mate} />
		</RoundedBox>
		<RoundedBox args={[0.16, alto, fondo + 0.16]} radius={0.03} position={[-ancho / 2 - 0.08, alto / 2 - 0.15, 0]} receiveShadow castShadow>
			<meshStandardMaterial color={set.paredLateral} {...mate} />
		</RoundedBox>
		<mesh position={[0, 0.05, -fondo / 2 + 0.005]} receiveShadow>
			<boxGeometry args={[ancho, 0.1, 0.01]} />
			<meshStandardMaterial color={set.zoclo} {...mate} />
		</mesh>
		{children}
	</group>
);

/** Ventanal en la pared de fondo, con el cielo de la hora. */
export const Ventanal: React.FC<Pos & {ancho?: number; alto?: number; cielo: string; hojas?: number}> = ({
	ancho = 3,
	alto = 1.6,
	cielo,
	hojas = 3,
	...p
}) => (
	<G {...p}>
		<mesh>
			<planeGeometry args={[ancho, alto]} />
			<meshBasicMaterial color={cielo} toneMapped={false} />
		</mesh>
		{Array.from({length: hojas + 1}, (_, i) => (
			<mesh key={i} position={[-ancho / 2 + (ancho / hojas) * i, 0, 0.02]}>
				<boxGeometry args={[0.05, alto + 0.05, 0.04]} />
				<meshStandardMaterial color={set.grafito} {...mate} />
			</mesh>
		))}
		{[-alto / 2, alto / 2].map((y) => (
			<mesh key={y} position={[0, y, 0.02]}>
				<boxGeometry args={[ancho + 0.05, 0.05, 0.04]} />
				<meshStandardMaterial color={set.grafito} {...mate} />
			</mesh>
		))}
	</G>
);

/** Escritorio de trabajo: cubierta clara y patas negras. */
export const Escritorio: React.FC<Pos & {ancho?: number}> = ({ancho = 1.5, ...p}) => (
	<G {...p}>
		<RoundedBox args={[ancho, 0.04, 0.72]} radius={0.015} position={[0, 0.74, 0]} castShadow receiveShadow>
			<meshStandardMaterial color={set.madera} {...mate} />
		</RoundedBox>
		{[-1, 1].map((l) => (
			<group key={l} position={[(ancho / 2 - 0.06) * l, 0, 0]}>
				<mesh position={[0, 0.36, 0]} castShadow>
					<boxGeometry args={[0.04, 0.72, 0.62]} />
					<meshStandardMaterial color={set.negro} roughness={0.5} />
				</mesh>
			</group>
		))}
	</G>
);

/** Silla de oficina: asiento a 0.5 de alto. */
export const Silla: React.FC<Pos> = (p) => (
	<G {...p}>
		<RoundedBox args={[0.48, 0.07, 0.46]} radius={0.03} position={[0, 0.48, 0]} castShadow>
			<meshStandardMaterial color={set.grafito} {...mate} />
		</RoundedBox>
		<RoundedBox args={[0.46, 0.55, 0.06]} radius={0.03} position={[0, 0.82, -0.22]} rotation={[-0.08, 0, 0]} castShadow>
			<meshStandardMaterial color={set.grafito} {...mate} />
		</RoundedBox>
		<mesh position={[0, 0.25, 0]}>
			<cylinderGeometry args={[0.025, 0.025, 0.45, 12]} />
			<meshStandardMaterial color={set.gris} roughness={0.4} metalness={0.3} />
		</mesh>
		<mesh position={[0, 0.03, 0]}>
			<cylinderGeometry args={[0.28, 0.28, 0.03, 5]} />
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</mesh>
	</G>
);

/** Lo que se ve en una pantalla: se dibuja con la API de canvas (ver Proyeccion.tsx). */
export type Dibujo = {dibuja: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; clave: string};

const Pantalla: React.FC<{ancho: number; alto: number; dibujo?: Dibujo; brillo?: string}> = ({ancho, alto, dibujo, brillo = '#E9EEF1'}) =>
	dibujo ? (
		<PantallaDibujada ancho={ancho} alto={alto} dibuja={dibujo.dibuja} clave={dibujo.clave} />
	) : (
		<mesh>
			<planeGeometry args={[ancho, alto]} />
			<meshBasicMaterial color={brillo} toneMapped={false} />
		</mesh>
	);

/** Monitor sobre su pie; `dibujo` es lo que muestra. */
export const Monitor: React.FC<Pos & {dibujo?: Dibujo; apagado?: boolean}> = ({dibujo, apagado, ...p}) => (
	<G {...p}>
		<RoundedBox args={[0.62, 0.38, 0.03]} radius={0.01} position={[0, 0.34, 0]} castShadow>
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</RoundedBox>
		<group position={[0, 0.34, 0.016]}>
			{apagado ? (
				<mesh>
					<planeGeometry args={[0.58, 0.34]} />
					<meshStandardMaterial color={set.vidrio} roughness={0.3} />
				</mesh>
			) : (
				<Pantalla ancho={0.58} alto={0.34} dibujo={dibujo} />
			)}
		</group>
		<mesh position={[0, 0.1, -0.02]}>
			<boxGeometry args={[0.04, 0.2, 0.04]} />
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</mesh>
		<mesh position={[0, 0.005, 0]}>
			<boxGeometry args={[0.22, 0.01, 0.16]} />
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</mesh>
	</G>
);

/** Teclado plano. */
export const Teclado: React.FC<Pos> = (p) => (
	<G {...p}>
		<RoundedBox args={[0.42, 0.015, 0.14]} radius={0.005} castShadow>
			<meshStandardMaterial color={set.grafito} {...mate} />
		</RoundedBox>
	</G>
);

/** El teléfono en la mano: la pantalla mira a +z. `color` es lo que enseña. */
export const Telefono: React.FC<Pos & {color?: string; rot?: V3}> = ({color = '#E9EEF1', rot = [0, 0, 0], ...p}) => (
	<G {...p}>
		<group rotation={rot}>
			<RoundedBox args={[0.075, 0.155, 0.01]} radius={0.008} castShadow>
				<meshStandardMaterial color={set.negro} roughness={0.4} />
			</RoundedBox>
			<mesh position={[0, 0, 0.0055]}>
				<planeGeometry args={[0.066, 0.14]} />
				<meshBasicMaterial color={color} toneMapped={false} />
			</mesh>
		</group>
	</G>
);

/** El kiosco: tableta en un poste; `dibujo` es lo que enseña su pantalla. */
export const Kiosco: React.FC<Pos & {dibujo?: Dibujo}> = ({dibujo, ...p}) => (
	<G {...p}>
		<mesh position={[0, 0.01, 0]} receiveShadow>
			<cylinderGeometry args={[0.22, 0.22, 0.02, 32]} />
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</mesh>
		<mesh position={[0, 0.6, 0]} castShadow>
			<cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</mesh>
		<group position={[0, 1.28, 0.02]} rotation={[-0.35, 0, 0]}>
			<RoundedBox args={[0.34, 0.25, 0.025]} radius={0.012} castShadow>
				<meshStandardMaterial color={set.negro} roughness={0.4} />
			</RoundedBox>
			<group position={[0, 0, 0.013]}>
				<Pantalla ancho={0.3} alto={0.21} dibujo={dibujo} />
			</group>
		</group>
	</G>
);

/** Mostrador de recepción. */
export const Mostrador: React.FC<Pos> = (p) => (
	<G {...p}>
		<RoundedBox args={[2.4, 1.05, 0.6]} radius={0.03} position={[0, 0.525, 0]} castShadow receiveShadow>
			<meshStandardMaterial color={set.blanco} {...mate} />
		</RoundedBox>
		<RoundedBox args={[2.5, 0.05, 0.7]} radius={0.015} position={[0, 1.07, 0]} castShadow>
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</RoundedBox>
		<mesh position={[0, 0.5, 0.301]}>
			<planeGeometry args={[2.3, 0.08]} />
			<meshStandardMaterial color={set.madera} {...mate} />
		</mesh>
	</G>
);

/** Puerta de cristal en la pared de fondo. */
export const PuertaCristal: React.FC<Pos & {abre?: number}> = ({abre = 0, ...p}) => (
	<G {...p}>
		<mesh position={[0, 1.15, 0]}>
			<boxGeometry args={[1.5, 2.3, 0.04]} />
			<meshStandardMaterial color={set.grafito} {...mate} />
		</mesh>
		{[-1, 1].map((l) => (
			<mesh key={l} position={[0.37 * l + l * abre * 0.35, 1.12, 0.03]}>
				<planeGeometry args={[0.68, 2.18]} />
				<meshStandardMaterial color={set.manana} transparent opacity={0.85} roughness={0.2} />
			</mesh>
		))}
	</G>
);

/** Planta alta de interior. */
export const Planta: React.FC<Pos> = (p) => (
	<G {...p}>
		<mesh position={[0, 0.22, 0]} castShadow>
			<cylinderGeometry args={[0.2, 0.17, 0.44, 24]} />
			<meshStandardMaterial color={set.maceta} roughness={0.6} />
		</mesh>
		{(
			[
				[0, 0.8, 0, 0.32],
				[0.12, 1.1, 0.05, 0.24],
				[-0.12, 1.02, -0.04, 0.22],
			] as const
		).map(([x, y, z, r], i) => (
			<mesh key={i} position={[x, y, z]} castShadow>
				<icosahedronGeometry args={[r, 1]} />
				<meshStandardMaterial color={i ? set.plantaOscura : set.planta} {...mate} flatShading />
			</mesh>
		))}
	</G>
);

/** Reloj de pared en negro. `minutos` desde las 12:00. */
export const Reloj: React.FC<Pos & {minutos: number}> = ({minutos, ...p}) => {
	const aH = -(((minutos / 60) % 12) / 12) * Math.PI * 2;
	const aM = -((minutos % 60) / 60) * Math.PI * 2;
	return (
		<G {...p}>
			<mesh rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.24, 0.24, 0.04, 48]} />
				<meshStandardMaterial color={set.negro} roughness={0.5} />
			</mesh>
			<mesh position={[0, 0, 0.021]}>
				<circleGeometry args={[0.21, 48]} />
				<meshStandardMaterial color={set.blanco} {...mate} />
			</mesh>
			{Array.from({length: 12}, (_, i) => {
				const a = (i / 12) * Math.PI * 2;
				return (
					<mesh key={i} position={[Math.sin(a) * 0.18, Math.cos(a) * 0.18, 0.025]} rotation={[0, 0, -a]}>
						<planeGeometry args={[0.01, i % 3 ? 0.02 : 0.04]} />
						<meshBasicMaterial color={set.negro} />
					</mesh>
				);
			})}
			<group rotation={[0, 0, aH]} position={[0, 0, 0.03]}>
				<mesh position={[0, 0.05, 0]}>
					<planeGeometry args={[0.02, 0.11]} />
					<meshBasicMaterial color={set.negro} />
				</mesh>
			</group>
			<group rotation={[0, 0, aM]} position={[0, 0, 0.034]}>
				<mesh position={[0, 0.075, 0]}>
					<planeGeometry args={[0.012, 0.16]} />
					<meshBasicMaterial color={set.negro} />
				</mesh>
			</group>
		</G>
	);
};

/** Repisa con carpetas en grises. */
export const Repisa: React.FC<Pos> = (p) => (
	<G {...p}>
		<RoundedBox args={[1.2, 0.04, 0.26]} radius={0.01} castShadow>
			<meshStandardMaterial color={set.madera} {...mate} />
		</RoundedBox>
		{['#3A3A38', '#A7A39C', '#D6D1C9', '#2B2B2A', '#8C8579', '#FBFAF8'].map((c, i) => (
			<RoundedBox key={i} args={[0.08, 0.28, 0.22]} radius={0.01} position={[-0.45 + i * 0.1, 0.16, 0]} castShadow>
				<meshStandardMaterial color={c} {...mate} />
			</RoundedBox>
		))}
	</G>
);

/** Hoja de papel acostada. */
export const Hoja: React.FC<Pos & {rot?: number}> = ({rot = 0, ...p}) => (
	<G {...p}>
		<mesh rotation={[0, rot, 0]} castShadow receiveShadow>
			<boxGeometry args={[0.21, 0.003, 0.28]} />
			<meshStandardMaterial color={set.blanco} {...mate} />
		</mesh>
	</G>
);

/** Taza. */
export const Taza: React.FC<Pos> = (p) => (
	<G {...p}>
		<mesh position={[0, 0.05, 0]} castShadow>
			<cylinderGeometry args={[0.04, 0.035, 0.1, 20]} />
			<meshStandardMaterial color={set.blanco} {...mate} />
		</mesh>
	</G>
);

/** Mesa de juntas. */
export const MesaJuntas: React.FC<Pos & {largo?: number}> = ({largo = 2.4, ...p}) => (
	<G {...p}>
		<RoundedBox args={[largo, 0.05, 1.1]} radius={0.02} position={[0, 0.74, 0]} castShadow receiveShadow>
			<meshStandardMaterial color={set.blanco} {...mate} />
		</RoundedBox>
		{[-1, 1].map((l) => (
			<mesh key={l} position={[(largo / 2 - 0.3) * l, 0.36, 0]} castShadow>
				<boxGeometry args={[0.08, 0.72, 0.8]} />
				<meshStandardMaterial color={set.negro} roughness={0.5} />
			</mesh>
		))}
	</G>
);

/** Pizarrón blanco en la pared. */
export const Pizarron: React.FC<Pos> = (p) => (
	<G {...p}>
		<RoundedBox args={[1.8, 1.0, 0.04]} radius={0.01} castShadow>
			<meshStandardMaterial color={set.blanco} roughness={0.35} />
		</RoundedBox>
		{[0.25, 0.08, -0.09].map((y, i) => (
			<mesh key={y} position={[-0.3 + i * 0.05, y, 0.022]}>
				<planeGeometry args={[0.9 - i * 0.2, 0.025]} />
				<meshBasicMaterial color={set.gris} />
			</mesh>
		))}
	</G>
);

/** El estrado de una audiencia: mesa alta, emblema de balanza y dos mesas. */
export const Estrado: React.FC<Pos> = (p) => (
	<G {...p}>
		<RoundedBox args={[3.2, 1.1, 0.8]} radius={0.03} position={[0, 0.55, 0]} castShadow receiveShadow>
			<meshStandardMaterial color={set.maderaOscura} {...mate} />
		</RoundedBox>
		<RoundedBox args={[3.4, 0.06, 0.95]} radius={0.015} position={[0, 1.13, 0]} castShadow>
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</RoundedBox>
		<Balanza posicion={[0, 1.9, -0.32]} escala={0.7} />
	</G>
);

/** Balanza de la justicia, de primitivas. `inclina` en radianes. */
export const Balanza: React.FC<Pos & {inclina?: number}> = ({inclina = 0, ...p}) => (
	<G {...p}>
		<mesh position={[0, -0.55, 0]}>
			<cylinderGeometry args={[0.18, 0.22, 0.06, 32]} />
			<meshStandardMaterial color={set.negro} roughness={0.4} metalness={0.2} />
		</mesh>
		<mesh>
			<cylinderGeometry args={[0.025, 0.025, 1.1, 12]} />
			<meshStandardMaterial color={set.negro} roughness={0.4} metalness={0.2} />
		</mesh>
		<group position={[0, 0.5, 0]} rotation={[0, 0, inclina]}>
			<mesh>
				<boxGeometry args={[1.0, 0.035, 0.035]} />
				<meshStandardMaterial color={set.negro} roughness={0.4} metalness={0.2} />
			</mesh>
			{[-1, 1].map((l) => (
				<group key={l} position={[0.48 * l, 0, 0]} rotation={[0, 0, -inclina]}>
					<mesh position={[0, -0.2, 0]}>
						<cylinderGeometry args={[0.005, 0.005, 0.4, 6]} />
						<meshStandardMaterial color={set.gris} />
					</mesh>
					<mesh position={[0, -0.41, 0]}>
						<cylinderGeometry args={[0.16, 0.12, 0.03, 32]} />
						<meshStandardMaterial color={set.negro} roughness={0.4} metalness={0.2} />
					</mesh>
				</group>
			))}
		</group>
	</G>
);

/** Carpeta cerrada o abierta sobre una mesa. */
export const Carpeta: React.FC<Pos & {color?: string}> = ({color = set.grafito, ...p}) => (
	<G {...p}>
		<RoundedBox args={[0.24, 0.02, 0.32]} radius={0.005} castShadow>
			<meshStandardMaterial color={color} {...mate} />
		</RoundedBox>
	</G>
);

/** Edificio de oficinas para exteriores: ventanas que se encienden de noche (`luz` 0→1). */
export const Edificio: React.FC<Pos & {pisos?: number; luz?: number; ancho?: number}> = ({pisos = 6, luz = 0, ancho = 7, ...p}) => {
	const fondo = 6;
	const alto = pisos * 1.15 + 0.6;
	return (
		<G {...p}>
			<RoundedBox args={[ancho + 2.4, 0.15, fondo + 2.4]} radius={0.03} position={[0, 0.075, 0]} receiveShadow>
				<meshStandardMaterial color={set.pisoClaro} {...mate} />
			</RoundedBox>
			<RoundedBox args={[ancho, alto, fondo]} radius={0.06} position={[0, alto / 2 + 0.15, 0]} castShadow receiveShadow>
				<meshStandardMaterial color={set.blanco} {...mate} />
			</RoundedBox>
			{Array.from({length: pisos}, (_, k) => {
				const y = 0.15 + 1.0 + k * 1.15;
				const encendida = (i: number) => ((k * 7 + i * 3) % 5 !== 0 ? luz : luz * 0.15);
				return (
					<group key={k}>
						{Array.from({length: 6}, (_, i) => (
							<mesh key={`f${i}`} position={[-ancho / 2 + 0.7 + i * ((ancho - 1.4) / 5), y, fondo / 2 + 0.005]}>
								<planeGeometry args={[0.85, 0.65]} />
								<meshBasicMaterial color={encendida(i) > 0.5 ? '#F3DDB2' : set.vidrio} toneMapped={false} />
							</mesh>
						))}
						{Array.from({length: 5}, (_, i) => (
							<mesh key={`l${i}`} position={[ancho / 2 + 0.005, y, -fondo / 2 + 0.7 + i * ((fondo - 1.4) / 4)]} rotation={[0, Math.PI / 2, 0]}>
								<planeGeometry args={[0.85, 0.65]} />
								<meshBasicMaterial color={encendida(i + 2) > 0.5 ? '#E8CFA0' : set.vidrio} toneMapped={false} />
							</mesh>
						))}
					</group>
				);
			})}
			<RoundedBox args={[ancho + 0.1, 0.25, fondo + 0.1]} radius={0.03} position={[0, alto + 0.15, 0]} castShadow>
				<meshStandardMaterial color={set.negro} roughness={0.5} />
			</RoundedBox>
			{/* entrada */}
			<mesh position={[1.4, 0.15 + 1.1, fondo / 2 + 0.01]}>
				<planeGeometry args={[1.6, 2.2]} />
				<meshBasicMaterial color={luz > 0.5 ? '#F3DDB2' : '#D9E3E8'} toneMapped={false} />
			</mesh>
			<mesh position={[1.4, 0.15 + 2.35, fondo / 2 + 0.25]} castShadow>
				<boxGeometry args={[2.2, 0.08, 0.5]} />
				<meshStandardMaterial color={set.negro} roughness={0.5} />
			</mesh>
		</G>
	);
};

/** Farola para exteriores; `luz` la enciende. */
export const Farola: React.FC<Pos & {luz?: number}> = ({luz = 0, ...p}) => (
	<G {...p}>
		<mesh position={[0, 1.6, 0]} castShadow>
			<cylinderGeometry args={[0.04, 0.05, 3.2, 12]} />
			<meshStandardMaterial color={set.negro} roughness={0.5} />
		</mesh>
		<mesh position={[0, 3.2, 0]}>
			<sphereGeometry args={[0.14, 16, 12]} />
			<meshBasicMaterial color={luz > 0.5 ? '#F6E2B8' : set.gris} toneMapped={false} />
		</mesh>
		{luz > 0 && <pointLight position={[0, 3.0, 0]} intensity={4 * luz} distance={6} color="#F6E2B8" />}
	</G>
);

/** Árbol de calle. */
export const Arbol: React.FC<Pos> = (p) => (
	<G {...p}>
		<mesh position={[0, 0.7, 0]} castShadow>
			<cylinderGeometry args={[0.07, 0.09, 1.4, 10]} />
			<meshStandardMaterial color={set.maderaOscura} {...mate} />
		</mesh>
		<mesh position={[0, 1.9, 0]} castShadow>
			<icosahedronGeometry args={[0.8, 1]} />
			<meshStandardMaterial color={set.planta} {...mate} flatShading />
		</mesh>
	</G>
);

/** Piso de calle grande, para exteriores. */
export const Calle: React.FC<{color?: string}> = ({color = '#CFCAC2'}) => (
	<group>
		<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[120, 120]} />
			<meshStandardMaterial color={color} {...mate} />
		</mesh>
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 8]} receiveShadow>
			<planeGeometry args={[120, 5]} />
			<meshStandardMaterial color="#9E9993" {...mate} />
		</mesh>
		{Array.from({length: 24}, (_, i) => (
			<mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-60 + i * 5, 0.006, 8]}>
				<planeGeometry args={[2, 0.12]} />
				<meshBasicMaterial color="#E9E6E1" />
			</mesh>
		))}
	</group>
);

export const colorPantallaOk = estado.presente;

/**
 * Reloj checador de huella, colgado en la pared: lo que el kiosco reemplaza.
 * `escala` 0→1 lo hace aparecer o irse; `led` enciende la luz verde.
 */
export const RelojChecador: React.FC<Pos & {led?: number}> = ({led = 0, ...p}) => (
	<G {...p}>
		<RoundedBox args={[0.26, 0.34, 0.07]} radius={0.02} castShadow>
			<meshStandardMaterial color={set.grafito} roughness={0.5} />
		</RoundedBox>
		<mesh position={[0, 0.08, 0.036]}>
			<planeGeometry args={[0.18, 0.08]} />
			<meshBasicMaterial color="#7D8C96" toneMapped={false} />
		</mesh>
		<RoundedBox args={[0.09, 0.09, 0.02]} radius={0.015} position={[0, -0.06, 0.04]}>
			<meshStandardMaterial color="#1E1E1D" roughness={0.3} />
		</RoundedBox>
		<mesh position={[0.09, -0.13, 0.037]}>
			<circleGeometry args={[0.008, 12]} />
			<meshBasicMaterial color={led > 0.5 ? '#3FBF6A' : '#5C5C5A'} toneMapped={false} />
		</mesh>
	</G>
);
