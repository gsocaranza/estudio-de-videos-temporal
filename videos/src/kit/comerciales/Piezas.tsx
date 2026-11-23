import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Icono} from '../corporativo/Interfaz';
import {FAMILIA, FAMILIA_MONO} from '../fuentes';
import {estado, estadoOscuro, marca} from '../paleta';
import {arco, ASIENTO, entra, FRENA, hundido, mezcla, sale, tramo, type Punto} from './mov';

export const ANCHO = 1920;
export const ALTO = 1080;

/**
 * Las piezas compartidas de los comerciales (docs/videos-explicativos/comerciales.md).
 * Lo que sólo sirve a un comercial vive en la carpeta de ese comercial. Diseño del panel —blanco, filete
 * de 1 px, esquinas redondeadas, TASA Orbiter y JetBrains Mono para horas y
 * huellas— y colores sólo de la paleta.
 */
export const C = {
	...marca,
	sombra: 'rgba(20,20,20,.14)',
	sombraFuerte: 'rgba(0,0,0,.35)',
};

// ---------------------------------------------------------------- cámara

export type Pose = {f: number; x: number; y: number; s: number};

/**
 * Una cámara por escena. `poses` dice a qué punto del mundo mira y con qué
 * escala; entre una y otra va con arranque y parada suaves. Encima, siempre, un
 * empuje mínimo: nada se detiene del todo.
 */
export const Camara: React.FC<{poses: Pose[]; empuje?: number; children: React.ReactNode}> = ({poses, empuje = 0.03, children}) => {
	const f = useCurrentFrame();
	let v = poses[0];
	for (let i = 0; i < poses.length - 1; i++) {
		if (f < poses[i].f) break;
		const p = tramo(f, poses[i].f, poses[i + 1].f - poses[i].f);
		const a = poses[i];
		const b = poses[i + 1];
		v = {f, x: mezcla(a.x, b.x, p), y: mezcla(a.y, b.y, p), s: mezcla(a.s, b.s, p)};
	}
	const s = v.s * (1 + (empuje * f) / 1000);
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					width: ANCHO,
					height: ALTO,
					transformOrigin: '0 0',
					transform: `translate(${ANCHO / 2}px, ${ALTO / 2}px) scale(${s}) translate(${-v.x}px, ${-v.y}px)`,
				}}
			>
				{children}
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- texto

/**
 * Titular cinético: cada palabra sube desde su máscara, desfasada `paso`
 * cuadros. `x` es el centro (o la orilla izquierda con `izquierda`), `y` la
 * parte de arriba de la primera línea.
 */
export const Titular: React.FC<{
	lineas: string[];
	x: number;
	y: number;
	tam: number;
	en: number;
	fuera?: number;
	paso?: number;
	color?: string;
	colores?: string[];
	peso?: number;
	izquierda?: boolean;
	ancho?: number;
}> = ({lineas, x, y, tam, en, fuera, paso = 5, color = marca.tinta, colores, peso = 700, izquierda, ancho = 1600}) => {
	const f = useCurrentFrame();
	const q = sale(f, fuera);
	if (f < en) return null;
	let k = 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: izquierda ? x : x - ancho / 2,
				top: y,
				width: ancho,
				textAlign: izquierda ? 'left' : 'center',
				fontFamily: FAMILIA,
				fontWeight: peso,
				fontSize: tam,
				lineHeight: 1.12,
				letterSpacing: -tam * 0.02,
				opacity: 1 - q,
				transform: `translateY(${-q * 24}px)`,
			}}
		>
			{lineas.map((linea, i) => (
				<div key={i} style={{color: colores?.[i] ?? color, whiteSpace: 'nowrap'}}>
					{linea.split(' ').map((w, j) => {
						const e = entra(f, en + k++ * paso);
						return (
							<span key={j} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: tam * 0.12, marginBottom: -tam * 0.12}}>
								<span style={{display: 'inline-block', transform: `translateY(${(1 - Math.min(e, 1.05)) * 110}%)`, opacity: Math.min(1, e * 1.6)}}>
									{w}
									{j < linea.split(' ').length - 1 ? ' ' : ''}
								</span>
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};

/** Un número que sube en ~1 s frenando al final; nunca salta. */
export const Contador: React.FC<{valor: number; en: number; dura?: number}> = ({valor, en, dura = 60}) => {
	const f = useCurrentFrame();
	const v = Math.round(valor * tramo(f, en, dura, FRENA));
	return <span style={{fontVariantNumeric: 'tabular-nums'}}>{v}</span>;
};

/** Rótulo en versalitas, como en el panel. */
export const Rotulo: React.FC<{children: React.ReactNode; tam?: number; color?: string}> = ({children, tam = 16, color = marca.tenue}) => (
	<div style={{fontFamily: FAMILIA, fontWeight: 600, fontSize: tam, letterSpacing: tam * 0.12, textTransform: 'uppercase', color}}>{children}</div>
);

// ---------------------------------------------------------------- cursor

/**
 * El cursor: viaja en arco entre sus puntos, se asienta al llegar y cada clic
 * lo hunde y deja un anillo. `pasos[i]` = [cuadro en que llega, punto].
 */
export const Cursor: React.FC<{pasos: [number, Punto][]; clics?: number[]; en?: number; fuera?: number; tam?: number}> = ({
	pasos,
	clics = [],
	en = 0,
	fuera,
	tam = 40,
}) => {
	const f = useCurrentFrame();
	if (f < en) return null;
	let pos = pasos[0][1];
	for (let i = 0; i < pasos.length - 1; i++) {
		const [fa, a] = pasos[i];
		const [fb, b] = pasos[i + 1];
		if (f < fa) break;
		const dura = Math.max(30, Math.min(56, Math.hypot(b[0] - a[0], b[1] - a[1]) / 9));
		const desde = fb - dura;
		pos = f < desde ? a : arco(tramo(f, desde, dura, ASIENTO), a, b, i % 2 ? -1 : 1);
	}
	const s = clics.reduce((acc, c) => acc * hundido(f, c), 1);
	const ultimo = clics.filter((c) => c <= f).pop();
	const anillo = ultimo === undefined ? 1 : tramo(f, ultimo, 20, FRENA);
	const op = Math.min(1, (f - en) / 8) * (1 - sale(f, fuera));
	return (
		<div style={{position: 'absolute', left: pos[0], top: pos[1], opacity: op, zIndex: 50}}>
			{anillo < 1 && (
				<div
					style={{
						position: 'absolute',
						left: -28 * (0.4 + anillo),
						top: -28 * (0.4 + anillo),
						width: 56 * (0.4 + anillo),
						height: 56 * (0.4 + anillo),
						borderRadius: '50%',
						border: `3px solid ${marca.tenue}`,
						opacity: 1 - anillo,
					}}
				/>
			)}
			<svg width={tam} height={tam} viewBox="0 0 24 24" style={{transform: `scale(${s * 1.12})`, transformOrigin: '4px 3px', filter: `drop-shadow(0 4px 6px ${C.sombra})`}}>
				<path d="M4 3l14 7.2-6.2 1.6L9 18z" fill={marca.oscuro} stroke={marca.blanco} strokeWidth={1.4} strokeLinejoin="round" />
			</svg>
		</div>
	);
};

// ---------------------------------------------------------------- ventanas

/** Una ventana de aplicación genérica, con su barra. */
export const Ventana: React.FC<{x: number; y: number; w: number; h: number; titulo: string; en: number; giro?: number; apagada?: number; children: React.ReactNode}> = ({
	x,
	y,
	w,
	h,
	titulo,
	en,
	giro = 0,
	apagada = 0,
	children,
}) => {
	const f = useCurrentFrame();
	const e = entra(f, en);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				background: marca.blanco,
				borderRadius: 18,
				overflow: 'hidden',
				boxShadow: `0 30px 70px ${C.sombraFuerte}`,
				transform: `translateY(${(1 - e) * 60}px) rotate(${giro}deg) scale(${0.94 + 0.06 * e})`,
				opacity: Math.min(1, e * 1.4) * (1 - apagada * 0.55),
				filter: apagada ? `saturate(${1 - apagada}) blur(${apagada * 1.5}px)` : undefined,
			}}
		>
			<div style={{height: 46, background: '#EEECE9', borderBottom: `1px solid ${marca.linea}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 8}}>
				{[0, 1, 2].map((i) => (
					<div key={i} style={{width: 12, height: 12, borderRadius: 6, background: marca.linea, border: `1px solid ${marca.tenue}55`}} />
				))}
				<div style={{marginLeft: 14, fontFamily: FAMILIA, fontWeight: 600, fontSize: 18, color: marca.secundario}}>{titulo}</div>
			</div>
			<div style={{position: 'absolute', top: 46, left: 0, right: 0, bottom: 0}}>{children}</div>
		</div>
	);
};

// ---------------------------------------------------------------- el panel

export const Chip: React.FC<{estado: 'presente' | 'retardo' | 'falta'; children: React.ReactNode; tam?: number}> = ({estado: e, children, tam = 20}) => {
	const [fuerte, suave] = e === 'presente' ? [estado.presente, estado.presenteSuave] : e === 'retardo' ? [estado.retardo, estado.retardoSuave] : [estado.falta, estado.faltaSuave];
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 8,
				padding: `${tam * 0.3}px ${tam * 0.7}px`,
				borderRadius: 999,
				background: suave,
				color: fuerte,
				fontFamily: FAMILIA,
				fontWeight: 600,
				fontSize: tam,
			}}
		>
			<span style={{width: tam * 0.4, height: tam * 0.4, borderRadius: '50%', background: fuerte}} />
			{children}
		</span>
	);
};

/** El punto de «En vivo», que late. */
export const EnVivo: React.FC = () => {
	const f = useCurrentFrame();
	const p = (f % 60) / 60;
	return (
		<span style={{display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: FAMILIA, fontWeight: 600, fontSize: 20, color: estado.presente}}>
			<span style={{position: 'relative', width: 12, height: 12}}>
				<span style={{position: 'absolute', inset: 0, borderRadius: '50%', background: estado.presente}} />
				<span style={{position: 'absolute', inset: -10 * p, borderRadius: '50%', border: `2px solid ${estado.presente}`, opacity: 1 - p}} />
			</span>
			En vivo
		</span>
	);
};

export {Icono, estadoOscuro, FAMILIA, FAMILIA_MONO};
