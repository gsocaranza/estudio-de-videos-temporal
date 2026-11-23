import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FAMILIA, FAMILIA_TITULOS} from '../fuentes';
import {curvas, tramo} from '../movimiento';
import {estado, marca} from '../paleta';

/**
 * La interfaz del estilo corporativo: lo que flota sobre el mundo o llena la
 * pantalla. Es el diseño del panel —blanco, filete de 1 px, esquinas de 16,
 * rótulos en versalitas, TASA Orbiter— y se mueve como una interfaz, no como
 * un dibujo animado: aparece subiendo 16 px en 0.3 s, sin pasarse ni rebotar
 * (`curvas.sale`), y se va igual de rápido.
 *
 * Todo recibe `en` (cuadro de la escena en que aparece) y, si se va, `sale`.
 */
export type Estado = 'presente' | 'retardo' | 'falta' | 'neutro';

const tinte: Record<Estado, [string, string]> = {
	presente: [estado.presente, estado.presenteSuave],
	retardo: [estado.retardo, estado.retardoSuave],
	falta: [estado.falta, estado.faltaSuave],
	neutro: [marca.secundario, '#EEECE9'],
};

/** 0→1 al entrar y 1→0 al salir, con la curva de interfaz. */
export const useEntrada = (en: number, sale?: number, dura = 9) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, dura, curvas.sale);
	const q = sale === undefined ? 0 : tramo(f, sale, 7, curvas.entra);
	return Math.min(p, 1 - q);
};

type Lugar = {en: number; sale?: number; x: number; y: number; ancla?: 'centro' | 'izq' | 'der'};

const posiciona = (x: number, y: number, ancla: Lugar['ancla'] = 'centro'): React.CSSProperties => ({
	position: 'absolute',
	left: `${x}%`,
	top: `${y}%`,
	['--tx' as string]: ancla === 'centro' ? '-50%' : ancla === 'der' ? '-100%' : '0%',
});

/** Tarjeta del panel. */
export const Tarjeta: React.FC<Lugar & {ancho?: number; oscura?: boolean; children: React.ReactNode; relleno?: string}> = ({
	en,
	sale,
	x,
	y,
	ancla,
	ancho = 520,
	oscura,
	relleno = '28px 32px',
	children,
}) => {
	const v = useEntrada(en, sale);
	if (v <= 0) return null;
	return (
		<div
			style={{
				...posiciona(x, y, ancla),
				transform: `translate(var(--tx), calc(-50% + ${(1 - v) * 16}px))`,
				opacity: v,
				width: ancho,
				padding: relleno,
				background: oscura ? marca.oscuro : marca.blanco,
				color: oscura ? marca.claro : marca.tinta,
				border: `1px solid ${oscura ? '#2C2C2A' : marca.linea}`,
				borderRadius: 16,
				boxShadow: '0 18px 40px -20px rgba(20,20,20,.28), 0 1px 2px rgba(20,20,20,.06)',
				fontFamily: FAMILIA,
			}}
		>
			{children}
		</div>
	);
};

export const Rotulo: React.FC<{children: React.ReactNode; color?: string; tam?: number}> = ({children, color = marca.tenue, tam = 20}) => (
	<div style={{fontSize: tam, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color}}>{children}</div>
);

/** Píldora de estado, como las del panel. */
export const Chip: React.FC<{estado?: Estado; children: React.ReactNode; tam?: number}> = ({estado: e = 'neutro', children, tam = 22}) => (
	<span
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 8,
			padding: '5px 14px 5px 12px',
			borderRadius: 999,
			background: tinte[e][1],
			color: tinte[e][0],
			fontSize: tam,
			fontWeight: 600,
			fontFamily: FAMILIA,
			whiteSpace: 'nowrap',
		}}
	>
		<span style={{width: 9, height: 9, borderRadius: '50%', background: tinte[e][0]}} />
		{children}
	</span>
);

/** Titular tipográfico: cada renglón sube desde una ranura, escalonado. */
export const Titular: React.FC<{
	en: number;
	renglones: {texto: string; tam: number; peso?: number; color?: string}[];
	escalon?: number;
	alinear?: 'left' | 'center';
}> = ({en, renglones, escalon = 4, alinear = 'left'}) => {
	const f = useCurrentFrame();
	return (
		<div style={{fontFamily: FAMILIA_TITULOS, textAlign: alinear}}>
			{renglones.map((r, i) => {
				const p = tramo(f, en + i * escalon, 12, curvas.sale);
				return (
					<div key={i} style={{overflow: 'hidden', paddingBottom: '0.08em'}}>
						<div
							style={{
								fontSize: r.tam,
								fontWeight: r.peso ?? 700,
								color: r.color,
								lineHeight: 1.08,
								letterSpacing: r.tam > 60 ? '-0.015em' : 0,
								transform: `translateY(${(1 - p) * 105}%)`,
							}}
						>
							{r.texto}
						</div>
					</div>
				);
			})}
		</div>
	);
};

/** Número que cuenta hasta su valor. */
export const Contador: React.FC<{en: number; valor: number; dura?: number; sufijo?: string; decimales?: number}> = ({
	en,
	valor,
	dura = 22,
	sufijo = '',
	decimales = 0,
}) => {
	const f = useCurrentFrame();
	const v = valor * tramo(f, en, dura, curvas.sale);
	return (
		<span style={{fontVariantNumeric: 'tabular-nums'}}>
			{v.toLocaleString('es-MX', {minimumFractionDigits: decimales, maximumFractionDigits: decimales})}
			{sufijo}
		</span>
	);
};

/** Indicador: rótulo, cifra que cuenta y una barra fina de su color. */
export const Indicador: React.FC<{en: number; rotulo: string; valor: number; sufijo?: string; estado?: Estado}> = ({
	en,
	rotulo,
	valor,
	sufijo,
	estado: e = 'neutro',
}) => {
	const f = useCurrentFrame();
	const v = tramo(f, en, 9, curvas.sale);
	return (
		<div style={{opacity: v, transform: `translateY(${(1 - v) * 10}px)`, padding: '16px 0', borderTop: `1px solid ${marca.linea}`}}>
			<Rotulo tam={17}>{rotulo}</Rotulo>
			<div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4}}>
				<div style={{fontSize: 52, fontWeight: 700, color: e === 'neutro' ? marca.tinta : tinte[e][0]}}>
					<Contador en={en} valor={valor} sufijo={sufijo} />
				</div>
				<div style={{width: 120, height: 6, borderRadius: 3, background: '#EEECE9', overflow: 'hidden'}}>
					<div style={{height: '100%', width: `${tramo(f, en + 4, 18, curvas.sale) * 100}%`, background: tinte[e][0]}} />
				</div>
			</div>
		</div>
	);
};

/** Gráfica de barras verticales que se acomoda escalonada. */
export const Barras: React.FC<{
	en: number;
	datos: {etiqueta: string; valor: number; nota?: string}[];
	maximo: number;
	/** dónde empieza el eje; si no es 0, se rotula al pie para no engañar */
	base?: number;
	alto?: number;
	escalon?: number;
	resalta?: number;
	oscura?: boolean;
}> = ({en, datos, maximo, base = 0, alto = 380, escalon = 6, resalta, oscura}) => {
	const f = useCurrentFrame();
	const tintaTexto = oscura ? marca.claro : marca.tinta;
	return (
		<div style={{display: 'flex', alignItems: 'flex-end', gap: 36, height: alto + 90, fontFamily: FAMILIA}}>
			{datos.map((d, i) => {
				const p = tramo(f, en + i * escalon, 16, curvas.sale);
				const destacada = resalta === i;
				return (
					<div key={d.etiqueta} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 150, opacity: Math.min(1, p * 3)}}>
						<div style={{fontSize: 44, fontWeight: 700, color: tintaTexto, marginBottom: 10, fontVariantNumeric: 'tabular-nums'}}>
							{Math.round(d.valor * p)}
							<span style={{fontSize: 26, fontWeight: 500, color: marca.tenue}}> h</span>
						</div>
						<div
							style={{
								width: '100%',
								height: ((d.valor - base) / (maximo - base)) * alto * p,
								background: destacada ? marca.claro : oscura ? '#3A3A38' : marca.tinta,
								borderRadius: '8px 8px 0 0',
							}}
						/>
						<div style={{fontSize: 28, fontWeight: 600, color: destacada ? tintaTexto : marca.tenue, marginTop: 14}}>{d.etiqueta}</div>
					</div>
				);
			})}
			{base > 0 && (
				<div style={{alignSelf: 'flex-end', marginBottom: 56, fontSize: 20, color: marca.tenue, opacity: tramo(f, en, 10)}}>
					eje desde {base} h
				</div>
			)}
		</div>
	);
};

/** Círculo con palomita que se dibuja, sin rebote. */
export const Confirmacion: React.FC<{en: number; tam?: number; estado?: Estado}> = ({en, tam = 40, estado: e = 'presente'}) => {
	const f = useCurrentFrame();
	const c = tramo(f, en, 10, curvas.sale);
	const p = tramo(f, en + 6, 9, curvas.sale);
	if (c <= 0) return null;
	return (
		<svg width={tam} height={tam} viewBox="0 0 24 24" style={{flexShrink: 0}}>
			<circle cx="12" cy="12" r="11" fill={tinte[e][0]} opacity={c} />
			<path d="M7 12.5 L10.5 16 L17.5 8.5" fill="none" stroke={marca.blanco} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
		</svg>
	);
};

/** Aviso que entra desde la derecha, como una notificación del panel. */
export const Aviso: React.FC<{en: number; sale?: number; titulo: string; detalle: string; estado?: Estado; y: number}> = ({
	en,
	sale,
	titulo,
	detalle,
	estado: e = 'retardo',
	y,
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 11, curvas.sale);
	const q = sale === undefined ? 0 : tramo(f, sale, 8, curvas.entra);
	if (p <= 0 || q >= 1) return null;
	return (
		<div
			style={{
				position: 'absolute',
				right: 64,
				top: `${y}%`,
				width: 560,
				transform: `translateX(${(1 - p) * 80 + q * 80}px)`,
				opacity: Math.min(p, 1 - q),
				display: 'flex',
				gap: 18,
				alignItems: 'flex-start',
				padding: '20px 24px',
				background: marca.blanco,
				border: `1px solid ${marca.linea}`,
				borderLeft: `5px solid ${tinte[e][0]}`,
				borderRadius: 14,
				boxShadow: '0 18px 40px -20px rgba(20,20,20,.3)',
				fontFamily: FAMILIA,
			}}
		>
			<Icono nombre="alerta" tam={34} color={tinte[e][0]} />
			<div>
				<div style={{fontSize: 28, fontWeight: 700, color: marca.tinta}}>{titulo}</div>
				<div style={{fontSize: 22, color: marca.secundario, marginTop: 4}}>{detalle}</div>
			</div>
		</div>
	);
};

/** Cortina a pantalla completa: sube desde abajo (`en`) y se retira hacia arriba (`sale`). */
export const Cortina: React.FC<{en: number; sale?: number; color?: string; children?: React.ReactNode}> = ({
	en,
	sale,
	color = marca.oscuro,
	children,
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 14, curvas.sale);
	const q = sale === undefined ? 0 : tramo(f, sale, 14, curvas.suave);
	if (p <= 0 || q >= 1) return null;
	return (
		<AbsoluteFill style={{background: color, clipPath: `inset(${q * 100}% 0 ${(1 - p) * 100}% 0)`}}>{children}</AbsoluteFill>
	);
};

/** Línea fina que se traza (para unir tarjetas). */
export const Trazo: React.FC<{en: number; x1: number; y1: number; x2: number; y2: number; color?: string; dura?: number}> = ({
	en,
	x1,
	y1,
	x2,
	y2,
	color = marca.tinta,
	dura = 10,
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, dura, curvas.sale);
	if (p <= 0) return null;
	return (
		<svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}} viewBox="0 0 1920 1080">
			<line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={color} strokeWidth={2} strokeDasharray="7 6" />
		</svg>
	);
};

const RUTAS: Record<string, string[]> = {
	telefono: ['M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5z', 'M11 18.5h2'],
	kiosco: ['M4 4.5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z', 'M12 16.5v4', 'M8.5 20.5h7'],
	llamada: ['M5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 7.7 7.7l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z'],
	papel: ['M6 2.5h8.5l3.5 3.5v15.5H6z', 'M14.5 2.5V6h3.5', 'M9 10.5h6', 'M9 13.5h6', 'M9 16.5h4'],
	hoja: ['M3.5 4.5h17v15h-17z', 'M3.5 9.5h17', 'M3.5 14.5h17', 'M9.5 4.5v15', 'M15 4.5v15'],
	memoria: ['M12 3.5a6.5 6.5 0 0 0-6.5 6.5c0 2.3 1.1 3.6 2.2 4.8.7.8.8 1.4.8 2.2v1.5h7v-1.5c0-.8.1-1.4.8-2.2 1.1-1.2 2.2-2.5 2.2-4.8A6.5 6.5 0 0 0 12 3.5z', 'M9.5 21h5'],
	candado: ['M6.5 10.5h11v10h-11z', 'M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3'],
	documento: ['M6 2.5h8.5l3.5 3.5v15.5H6z', 'M14.5 2.5V6h3.5', 'M9 12.5h6', 'M9 15.5h6'],
	alerta: ['M12 3.5 2.5 20h19z', 'M12 9.5v5', 'M12 17.2v.3'],
	balanza: ['M12 3.5v17', 'M7 20.5h10', 'M4.5 7.5h15', 'M4.5 7.5 2 13.5a3 3 0 0 0 5 0z', 'M19.5 7.5 17 13.5a3 3 0 0 0 5 0z'],
	reloj: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7.5V12l3 2'],
	escudo: ['M12 2.5 4.5 5.5v6c0 4.5 3.2 8.2 7.5 10 4.3-1.8 7.5-5.5 7.5-10v-6z', 'M8.8 12.2 11 14.4l4.2-4.4'],
	cadena: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
};

/** Íconos de trazo (24 × 24), del mismo grosor que los del panel. */
export const Icono: React.FC<{nombre: keyof typeof RUTAS; tam?: number; color?: string; grosor?: number}> = ({
	nombre,
	tam = 32,
	color = marca.tinta,
	grosor = 1.7,
}) => (
	<svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}>
		{RUTAS[nombre].map((d, i) => (
			<path key={i} d={d} />
		))}
	</svg>
);

export const opacidadEntre = (f: number, a: number, b: number) =>
	interpolate(f, [a, a + 8, b - 8, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
