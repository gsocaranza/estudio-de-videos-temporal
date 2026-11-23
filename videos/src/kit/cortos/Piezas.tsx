import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FAMILIA, FAMILIA_MONO} from '../fuentes';
import {curvas, mezcla, tramo} from '../movimiento';
import {marca} from '../paleta';

/**
 * Las piezas de los cortos verticales. Todas reciben el cuadro de la escena en
 * que entran (`en`), anclado a una palabra con `w()`; ninguna escribe un color
 * a mano: lo reciben de `tinta()` o de la paleta.
 */

/** La sacudida del golpe: unos píxeles que se apagan en seis cuadros. Se suma al `translate` del contenedor. */
export const sacudida = (f: number, en: number, fuerza = 12) => {
	const k = f - en;
	if (k < 0 || k > 6) return {x: 0, y: 0};
	const caida = 1 - k / 6;
	return {x: Math.sin(k * 2.7) * fuerza * caida, y: Math.cos(k * 3.3) * fuerza * 0.6 * caida};
};

/** Entra subiendo 28 px con la curva de interfaz; sale bajando la opacidad. */
export const Entra: React.FC<{en: number; sale?: number; dura?: number; desde?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
	en,
	sale,
	dura = 9,
	desde = 28,
	style,
	children,
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, dura, curvas.sale);
	const q = sale === undefined ? 0 : tramo(f, sale, 7, curvas.entra);
	if (p <= 0) return null;
	return <div style={{...style, opacity: p * (1 - q), transform: `${style?.transform ?? ''} translateY(${(1 - p) * desde}px)`}}>{children}</div>;
};

/**
 * El sello del veredicto: MITO, LEY, VERDAD. Cae de 1.7 a su tamaño en cinco
 * cuadros —la única pieza que golpea— y acompaña al efecto `golpe`.
 */
export const Sello: React.FC<{en: number; texto: string; color: string; giro?: number; tam?: number; style?: React.CSSProperties}> = ({
	en,
	texto,
	color,
	giro = -8,
	tam = 96,
	style,
}) => {
	const f = useCurrentFrame();
	if (f < en) return null;
	const p = tramo(f, en, 5, curvas.entra);
	const escala = mezcla(1.7, 1, p);
	return (
		<div
			style={{
				...style,
				transform: `translate(-50%, -50%) rotate(${giro}deg) scale(${escala})`,
				opacity: Math.min(1, p * 1.6) * 0.95,
				border: `${Math.round(tam / 11)}px solid ${color}`,
				borderRadius: tam / 6,
				padding: `${tam * 0.06}px ${tam * 0.32}px`,
				color,
				fontFamily: FAMILIA,
				fontWeight: 700,
				fontSize: tam,
				letterSpacing: tam * 0.08,
				lineHeight: 1.1,
				whiteSpace: 'nowrap',
			}}
		>
			{texto}
		</div>
	);
};

/**
 * La fuente, el lugar o la fecha en monoespaciada, escribiéndose a ~25
 * caracteres por segundo con su cursor. Da el dato sin que la voz lo lea.
 */
export const Metadato: React.FC<{en: number; texto: string; color: string; tam?: number; cursor?: boolean; style?: React.CSSProperties}> = ({
	en,
	texto,
	color,
	tam = 30,
	cursor = true,
	style,
}) => {
	const f = useCurrentFrame();
	if (f < en) return null;
	const n = Math.min(texto.length, Math.floor((f - en) / 1.2) + 1);
	const parpadea = n >= texto.length && Math.floor((f - en) / 15) % 2 === 1;
	return (
		<div style={{fontFamily: FAMILIA_MONO, fontWeight: 500, fontSize: tam, letterSpacing: tam * 0.08, color, whiteSpace: 'nowrap', ...style}}>
			{texto.slice(0, n)}
			{cursor && <span style={{opacity: parpadea ? 0 : 1}}>█</span>}
		</div>
	);
};

/** Una cifra que corre de `de` a `a`. Monoespaciada para que no baile mientras cuenta. */
export const Cifra: React.FC<{
	en: number;
	de: number;
	a: number;
	dura?: number;
	color: string;
	tam?: number;
	miles?: boolean;
	sufijo?: string;
	style?: React.CSSProperties;
}> = ({en, de, a, dura = 18, color, tam = 160, miles = true, sufijo = '', style}) => {
	const f = useCurrentFrame();
	if (f < en) return null;
	const v = Math.round(mezcla(de, a, tramo(f, en, dura, curvas.sale)));
	const texto = miles ? v.toLocaleString('en-US') : String(v);
	return (
		<div style={{fontFamily: FAMILIA_MONO, fontWeight: 700, fontSize: tam, letterSpacing: -tam * 0.03, lineHeight: 1, color, ...style}}>
			{texto}
			{sufijo}
		</div>
	);
};

/** El subrayado que se dibuja bajo una palabra (con el efecto `trazo`). */
export const Subraya: React.FC<{en: number; color: string; ancho: number; grueso?: number; style?: React.CSSProperties}> = ({
	en,
	color,
	ancho,
	grueso = 10,
	style,
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 8, curvas.sale);
	return <div style={{...style, width: ancho * p, height: grueso, borderRadius: grueso, background: color}} />;
};

/** Un renglón de texto grande, centrado en la columna segura. */
export const Grande: React.FC<{color: string; tam?: number; peso?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
	color,
	tam = 120,
	peso = 700,
	style,
	children,
}) => (
	<div
		style={{
			fontFamily: FAMILIA,
			fontWeight: peso,
			fontSize: tam,
			lineHeight: 1,
			letterSpacing: -tam * 0.02,
			color,
			textAlign: 'center',
			...style,
		}}
	>
		{children}
	</div>
);

export {marca};
