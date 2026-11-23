import React from 'react';
import {AbsoluteFill, interpolate, staticFile, Img, useCurrentFrame} from 'remotion';
import {FAMILIA} from './fuentes';
import {curvas, tramo} from './movimiento';
import {estado, marca} from './paleta';

/**
 * Los gráficos 2D que van encima del 3D. En el estilo de referencia son
 * pocos y planos —una hoja, una palomita, un sello, un círculo de rotulador—,
 * y cada uno subraya una acción que el narrador acaba de decir. Ninguno se
 * queda en pantalla si ya no se habla de él.
 *
 * Todos reciben `en`: el cuadro (de la escena) en que aparecen. Y `x`, `y` en
 * porcentaje del cuadro, medidos al centro del gráfico.
 */
type Lugar = {en: number; x?: number; y?: number; sale?: number};

const centrado = (x: number, y: number): React.CSSProperties => ({
	position: 'absolute',
	left: `${x}%`,
	top: `${y}%`,
	transform: 'translate(-50%, -50%)',
});

/** Aparece cayendo con rebote; se va encogiendo si se le da `sale`. */
const usePop = (en: number, sale?: number) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 11, curvas.rebote);
	const q = sale === undefined ? 0 : tramo(f, sale, 8, curvas.entra);
	return {
		opacity: Math.min(1, p * 2) * (1 - q),
		escala: (0.6 + 0.4 * p) * (1 - 0.3 * q),
		y: (1 - p) * 30,
	};
};

/** Tarjeta blanca con sombra: lo que la pantalla del sistema diría. */
export const Tarjeta: React.FC<Lugar & {ancho?: number; children: React.ReactNode; fondo?: string}> = ({
	en,
	sale,
	x = 50,
	y = 50,
	ancho = 520,
	fondo = marca.blanco,
	children,
}) => {
	const {opacity, escala, y: dy} = usePop(en, sale);
	if (opacity <= 0) return null;
	return (
		<div
			style={{
				...centrado(x, y),
				transform: `translate(-50%, calc(-50% + ${dy}px)) scale(${escala})`,
				opacity,
				width: ancho,
				background: fondo,
				borderRadius: 28,
				padding: '30px 36px',
				boxShadow: '0 24px 60px -18px rgba(20,20,20,.35), 0 2px 6px rgba(20,20,20,.08)',
				fontFamily: FAMILIA,
				color: marca.tinta,
			}}
		>
			{children}
		</div>
	);
};

/** Etiqueta en versalitas, como los rótulos del panel. */
export const Rotulo: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = marca.tenue}) => (
	<div style={{fontSize: 22, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color}}>
		{children}
	</div>
);

/** Píldora con nombre: presenta a un personaje. */
export const Nombre: React.FC<Lugar & {children: React.ReactNode}> = ({en, sale, x = 50, y = 50, children}) => {
	const {opacity, escala, y: dy} = usePop(en, sale);
	if (opacity <= 0) return null;
	return (
		<div
			style={{
				...centrado(x, y),
				transform: `translate(-50%, calc(-50% + ${dy}px)) scale(${escala})`,
				opacity,
				background: marca.oscuro,
				color: marca.claro,
				fontFamily: FAMILIA,
				fontWeight: 600,
				fontSize: 40,
				padding: '12px 30px',
				borderRadius: 999,
				boxShadow: '0 14px 30px -12px rgba(20,20,20,.5)',
			}}
		>
			{children}
		</div>
	);
};

/** Un trazo SVG que se dibuja: palomita, cruz o círculo de rotulador. */
const Trazo: React.FC<{d: string[]; en: number; color: string; grosor: number; dura?: number; vista: string}> = ({
	d,
	en,
	color,
	grosor,
	dura = 13,
	vista,
}) => {
	const f = useCurrentFrame();
	return (
		<svg viewBox={vista} style={{width: '100%', height: '100%', overflow: 'visible'}}>
			{d.map((camino, i) => {
				const p = tramo(f, en + i * Math.round(dura * 0.6), dura, curvas.suave);
				return (
					<path
						key={i}
						d={camino}
						pathLength={1}
						fill="none"
						stroke={color}
						strokeWidth={grosor}
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeDasharray="1 1"
						strokeDashoffset={1 - p}
						opacity={p > 0 ? 1 : 0}
					/>
				);
			})}
		</svg>
	);
};

/** Círculo verde con palomita: «quedó». */
export const Palomita: React.FC<Lugar & {tam?: number}> = ({en, sale, x = 50, y = 50, tam = 96}) => {
	const {opacity, escala} = usePop(en, sale);
	if (opacity <= 0) return null;
	return (
		<div style={{...centrado(x, y), width: tam, height: tam, opacity, transform: `translate(-50%,-50%) scale(${escala})`}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: estado.presente}} />
			<div style={{position: 'absolute', inset: '24%'}}>
				<Trazo vista="0 0 24 24" d={['M4 12.5 L9.5 18 L20 6.5']} en={en + 4} color={marca.blanco} grosor={3.4} />
			</div>
		</div>
	);
};

/** Círculo rojo con cruz: «no se pudo». */
export const Cruz: React.FC<Lugar & {tam?: number}> = ({en, sale, x = 50, y = 50, tam = 96}) => {
	const {opacity, escala} = usePop(en, sale);
	if (opacity <= 0) return null;
	return (
		<div style={{...centrado(x, y), width: tam, height: tam, opacity, transform: `translate(-50%,-50%) scale(${escala})`}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: estado.falta}} />
			<div style={{position: 'absolute', inset: '27%'}}>
				<Trazo vista="0 0 24 24" d={['M5 5 L19 19', 'M19 5 L5 19']} en={en + 4} color={marca.blanco} grosor={3.6} dura={8} />
			</div>
		</div>
	);
};

/** El círculo de rotulador que encierra algo, como en la hoja de SOP del video de referencia. */
export const Rotulador: React.FC<Lugar & {ancho: number; alto: number; color?: string}> = ({
	en,
	x = 50,
	y = 50,
	ancho,
	alto,
	color = estado.falta,
}) => (
	<div style={{...centrado(x, y), width: ancho, height: alto, pointerEvents: 'none'}}>
		<Trazo
			vista="0 0 100 60"
			// óvalo a mano alzada: no cierra exacto y se pasa un poco
			d={['M58 4 C 88 4, 99 20, 96 33 C 93 50, 66 58, 44 57 C 18 56, 2 46, 3 30 C 4 13, 27 3, 60 6']}
			en={en}
			color={color}
			grosor={2.2}
			dura={16}
		/>
	</div>
);

/** El sello que cae: entra grande y girado, golpea y se queda. */
export const Sello: React.FC<Lugar & {texto: string; color?: string; giro?: number}> = ({
	en,
	x = 50,
	y = 50,
	texto,
	color = estado.presente,
	giro = -12,
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 8, curvas.entra);
	if (f < en) return null;
	const escala = interpolate(p, [0, 1], [2.4, 1]);
	const tinta = interpolate(f - en, [8, 14], [1, 0.92], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div
			style={{
				...centrado(x, y),
				transform: `translate(-50%,-50%) rotate(${giro + (1 - p) * -10}deg) scale(${escala})`,
				opacity: Math.min(1, p * 1.6) * tinta,
				border: `7px solid ${color}`,
				borderRadius: 18,
				padding: '10px 30px',
				color,
				fontFamily: FAMILIA,
				fontWeight: 700,
				fontSize: 64,
				letterSpacing: '0.1em',
				textTransform: 'uppercase',
				mixBlendMode: 'multiply',
			}}
		>
			{texto}
		</div>
	);
};

/** Signo que brota, como un globo de pensamiento (¿?, !, ✓). */
export const Burbuja: React.FC<Lugar & {texto: string; color?: string; fondo?: string}> = ({
	en,
	sale,
	x = 50,
	y = 50,
	texto,
	color = marca.tinta,
	fondo = marca.blanco,
}) => {
	const {opacity, escala, y: dy} = usePop(en, sale);
	if (opacity <= 0) return null;
	return (
		<div
			style={{
				...centrado(x, y),
				transform: `translate(-50%, calc(-50% + ${dy}px)) scale(${escala})`,
				opacity,
				width: 92,
				height: 92,
				borderRadius: '50%',
				background: fondo,
				color,
				display: 'grid',
				placeItems: 'center',
				fontFamily: FAMILIA,
				fontWeight: 700,
				fontSize: 56,
				boxShadow: '0 14px 30px -12px rgba(20,20,20,.35)',
			}}
		>
			{texto}
		</div>
	);
};

/** Fundido a un color (negro por omisión): 0 nada, 1 todo. */
export const Velo: React.FC<{opacidad: number; color?: string}> = ({opacidad, color = marca.oscuro}) =>
	opacidad <= 0 ? null : <AbsoluteFill style={{background: color, opacity: opacidad}} />;

/** El isotipo de Puntualiza. `tinta` lo pinta del color dado. */
export const Isotipo: React.FC<{tam: number; giro?: number; tinta?: string}> = ({tam, giro = 0, tinta = marca.oscuro}) => (
	<div style={{width: tam, height: tam, transform: `rotate(${giro}deg)`}}>
		<div
			style={{
				width: '100%',
				height: '100%',
				background: tinta,
				WebkitMaskImage: `url(${staticFile('marca/isotipo.svg')})`,
				maskImage: `url(${staticFile('marca/isotipo.svg')})`,
				WebkitMaskSize: 'contain',
				maskSize: 'contain',
				WebkitMaskRepeat: 'no-repeat',
				maskRepeat: 'no-repeat',
			}}
		/>
		{/* precarga del svg para que el render espere a la máscara */}
		<Img src={staticFile('marca/isotipo.svg')} style={{display: 'none'}} />
	</div>
);

/** Subtítulo opcional (apagado por omisión, como en el video de referencia). */
export const Subtitulo: React.FC<{texto: string}> = ({texto}) => (
	<div
		style={{
			position: 'absolute',
			left: '50%',
			bottom: 64,
			transform: 'translateX(-50%)',
			maxWidth: 1400,
			background: 'rgba(20,20,20,.78)',
			color: marca.claro,
			fontFamily: FAMILIA,
			fontWeight: 500,
			fontSize: 40,
			lineHeight: 1.3,
			padding: '12px 28px',
			borderRadius: 14,
			textAlign: 'center',
		}}
	>
		{texto}
	</div>
);
