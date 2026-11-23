import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FAMILIA, FAMILIA_MONO} from '../fuentes';
import {curvas, mezcla, tramo} from '../movimiento';
import {marca} from '../paleta';
import {significado, tinta} from './Corto';
import {Metadato} from './Piezas';

/**
 * Las piezas que comparten los cortos de la serie de Recursos Humanos
 * (docs/archivo/cortos-rh-plan-v4.md §12.2; la versión 5 pide un kit propio por corto). Salen del piloto (`las-ocho-horas`), donde
 * vivían sueltas, generalizadas: la palabra grande con renglones y tamaño que
 * se ajusta sola a la zona segura, el glifo tenue de la portada, el tachón,
 * las siluetas y una biblioteca de objetos planos en tinta (trazo grueso, sin
 * detalle fino: con grano, cámara y desenfoque de transición, el detalle fino
 * parpadea).
 *
 * Los textos van como se escriben, con mayúscula inicial; sólo la
 * monoespaciada (metadatos) va en mayúsculas.
 */
const P = tinta('papel');

/** Ancho máximo de un texto grande: la cámara, los golpes y la entrada lo agrandan hasta ~1.15. */
const ANCHO_TEXTO = 580;

/**
 * Una palabra (o una frase) que entra de golpe: de 0.85 a 1.06 y se asienta en 1.
 * Los renglones se separan con « / » en `children`; el tamaño baja solo si un
 * renglón no cabe en 580 px.
 */
export const Palabra: React.FC<{
	en: number;
	children: string;
	tam?: number;
	color?: string;
	fondo?: string;
	top: number;
	peso?: number;
	mono?: boolean;
	sale?: number;
}> = ({en, children, tam: pedido = 150, color = P.texto, fondo, top, peso = 700, mono, sale}) => {
	const f = useCurrentFrame();
	if (f < en || (sale !== undefined && f >= sale)) return null;
	const renglones = children.split(' / ');
	const largo = Math.max(...renglones.map((r) => r.length));
	const ancho = largo * pedido * (mono ? 0.6 : 0.52) + (fondo ? pedido * 0.4 : 0);
	const tam = ancho > ANCHO_TEXTO ? (pedido * ANCHO_TEXTO) / ancho : pedido;
	const k = f - en;
	const escala = k < 3 ? mezcla(0.85, 1.06, k / 3) : mezcla(1.06, 1, tramo(k, 3, 4, curvas.sale));
	return (
		<div style={{position: 'absolute', top, left: 140, right: 140, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					transform: `scale(${escala})`,
					opacity: Math.min(1, (k + 1) / 2),
					background: fondo,
					padding: fondo ? `${tam * 0.06}px ${tam * 0.2}px ${tam * 0.04}px` : undefined,
					borderRadius: fondo ? tam * 0.1 : undefined,
					color,
					fontFamily: mono ? FAMILIA_MONO : FAMILIA,
					fontWeight: peso,
					fontSize: tam,
					lineHeight: 1.02,
					letterSpacing: mono ? -tam * 0.03 : -tam * 0.02,
					textAlign: 'center',
					whiteSpace: 'nowrap',
				}}
			>
				{renglones.map((r, i) => (
					<div key={i}>{r}</div>
				))}
			</div>
		</div>
	);
};

/** El metadato centrado, en monoespaciada (fuente, fecha, lugar chico). */
export const Meta: React.FC<{en: number; texto: string; top: number; color?: string; tam?: number}> = ({en, texto, top, color = P.tenue, tam = 30}) => (
	<div style={{position: 'absolute', top, left: 140, right: 140, display: 'flex', justifyContent: 'center'}}>
		<Metadato en={en} texto={texto} color={color} tam={tam} />
	</div>
);

/** Una línea que tacha, de izquierda a derecha. Rojo sólo para lo falso; tinta para lo que no se dijo. */
export const Tacha: React.FC<{en: number; top: number; left: number; ancho: number; color?: string; grueso?: number; giro?: number}> = ({
	en,
	top,
	left,
	ancho,
	color = significado.falso,
	grueso = 18,
	giro = -4,
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 7, curvas.sale);
	if (p <= 0) return null;
	return (
		<div style={{position: 'absolute', top, left, width: ancho * p, height: grueso, borderRadius: grueso, background: color, transform: `rotate(${giro}deg)`, transformOrigin: '0 50%'}} />
	);
};

/** Un glifo (una palabra, un número) gigante y tenue detrás de todo: la portada y el bucle. */
export const GlifoFondo: React.FC<{texto: string; top?: number; tam?: number; color?: string}> = ({texto, top = 360, tam = 760, color = P.linea}) => (
	<div style={{position: 'absolute', top, left: -200, right: -200, textAlign: 'center', fontFamily: FAMILIA, fontWeight: 700, fontSize: tam, lineHeight: 1, letterSpacing: -tam * 0.04, color}}>
		{texto}
	</div>
);

/** Persona en silueta. */
export const Silueta: React.FC<{x: number; y: number; tam: number; color: string}> = ({x, y, tam, color}) => (
	<div style={{position: 'absolute', left: x, top: y, width: tam, height: tam * 1.9}}>
		<div style={{position: 'absolute', left: tam * 0.28, top: 0, width: tam * 0.44, height: tam * 0.44, borderRadius: tam, background: color}} />
		<div style={{position: 'absolute', left: 0, top: tam * 0.5, width: tam, height: tam * 1.4, borderRadius: `${tam * 0.5}px ${tam * 0.5}px 0 0`, background: color}} />
	</div>
);

/** Monedas que caen y se apilan; `cara` es lo que llevan grabado (vacío = disco liso). */
export const Monedas: React.FC<{en: number; cara?: string; fondo?: string; tinta?: string; abajo?: number}> = ({en, cara = '', fondo = marca.claro, tinta: color = marca.oscuro, abajo = 1100}) => {
	const f = useCurrentFrame();
	const lugares = [
		[420, abajo],
		[540, abajo],
		[660, abajo],
		[480, abajo - 100],
		[600, abajo - 100],
	];
	return (
		<>
			{lugares.map(([x, y], i) => {
				const p = tramo(f, en + i * 3, 9, curvas.entra);
				if (p <= 0) return null;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - 60,
							top: mezcla(-200, y, p),
							width: 120,
							height: 120,
							borderRadius: 120,
							background: fondo,
							border: `8px solid #B9B5AF`,
							boxShadow: `inset 0 0 0 10px ${fondo}, inset 0 0 0 14px #B9B5AF`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontFamily: FAMILIA,
							fontWeight: 700,
							fontSize: 56,
							color,
							transform: `rotate(${(i % 2 ? 1 : -1) * 12 * (1 - p)}deg)`,
						}}
					>
						{cara}
					</div>
				);
			})}
		</>
	);
};

/** Un libro grueso, cerrado (de canto, con su lomo) o abierto (dos páginas con renglones). */
export const Libro: React.FC<{abierto?: number; top?: number; titulo?: string; color?: string; tintaTitulo?: string; escala?: number; pagina?: React.ReactNode}> = ({
	abierto = 0,
	top = 640,
	titulo,
	color = P.texto,
	tintaTitulo = marca.claro,
	escala = 1,
	pagina,
}) => {
	// abierto: 0 = cerrado, 1 = abierto (se interpola el ancho de las tapas)
	const ancho = mezcla(360, 760, abierto);
	return (
		<div style={{position: 'absolute', top, left: 540 - ancho / 2, width: ancho, height: 480, transform: `scale(${escala})`, transformOrigin: '50% 50%'}}>
			{abierto < 0.5 ? (
				<div style={{position: 'absolute', inset: 0, borderRadius: 18, background: color, boxShadow: '0 30px 60px rgba(20,20,20,.25)'}}>
					<div style={{position: 'absolute', left: 36, top: 0, bottom: 0, width: 14, background: marca.oscuro, opacity: 0.35}} />
					{titulo && (
						<div style={{position: 'absolute', top: 150, left: 70, right: 30, textAlign: 'center', fontFamily: FAMILIA, fontWeight: 700, fontSize: 52, lineHeight: 1.05, color: tintaTitulo}}>
							{titulo}
						</div>
					)}
				</div>
			) : (
				<div style={{position: 'absolute', inset: 0, borderRadius: 14, background: color, padding: 16, boxShadow: '0 30px 60px rgba(20,20,20,.25)'}}>
					<div style={{position: 'absolute', top: 16, bottom: 16, left: 16, right: '50%', background: marca.blanco, borderRadius: '8px 0 0 8px'}} />
					<div style={{position: 'absolute', top: 16, bottom: 16, left: '50%', right: 16, background: marca.blanco, borderRadius: '0 8px 8px 0'}} />
					<div style={{position: 'absolute', top: 16, bottom: 16, left: '50%', width: 3, background: P.linea}} />
					{[0, 1].map((lado) =>
						Array.from({length: 9}, (_, r) => (
							<div
								key={`${lado}-${r}`}
								style={{position: 'absolute', top: 60 + r * 42, left: lado ? '54%' : 46, width: lado ? '38%' : '38%', height: 8, borderRadius: 8, background: P.linea}}
							/>
						)),
					)}
					{pagina}
				</div>
			)}
		</div>
	);
};

/** Un cuaderno escolar abierto, con renglones y una frase escrita a mano. */
export const Cuaderno: React.FC<{frase: string; escribe: number; top?: number}> = ({frase, escribe, top = 640}) => {
	const f = useCurrentFrame();
	const n = Math.max(0, Math.min(frase.length, Math.floor((f - escribe) / 1.2)));
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 150,
				width: 780,
				height: 520,
				background: marca.blanco,
				borderRadius: 10,
				boxShadow: '0 24px 60px rgba(20,20,20,.18)',
				transform: 'rotate(-2deg)',
				overflow: 'hidden',
			}}
		>
			{Array.from({length: 10}, (_, r) => (
				<div key={r} style={{position: 'absolute', top: 70 + r * 48, left: 0, right: 0, height: 3, background: '#DDE3EA'}} />
			))}
			<div style={{position: 'absolute', top: 0, bottom: 0, left: 90, width: 4, background: '#E7B9B9'}} />
			<div style={{position: 'absolute', top: 130, left: 120, right: 40, fontFamily: FAMILIA, fontWeight: 500, fontStyle: 'italic', fontSize: 62, lineHeight: 1.25, color: P.texto}}>
				{frase.slice(0, n)}
			</div>
		</div>
	);
};

/** Una cartela: tarjeta blanca con un texto de varios renglones y, debajo, su fuente en monoespaciada. */
export const Cartela: React.FC<{en: number; texto: string; fuente?: string; top?: number; tam?: number; resalta?: {palabra: string; en: number}}> = ({
	en,
	texto,
	fuente,
	top = 640,
	tam = 60,
	resalta,
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 8, curvas.sale);
	if (p <= 0) return null;
	const partes = resalta ? texto.split(resalta.palabra) : [texto];
	const r = resalta ? tramo(f, resalta.en, 10, curvas.sale) : 0;
	return (
		<div style={{position: 'absolute', top, left: 160, right: 160, opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
			<div style={{background: marca.blanco, borderRadius: 24, padding: '44px 46px', boxShadow: '0 26px 60px rgba(20,20,20,.18)', fontFamily: FAMILIA, fontWeight: 600, fontSize: tam, lineHeight: 1.22, color: P.texto, textAlign: 'center'}}>
				{partes[0]}
				{resalta && (
					<span
						style={{
							backgroundImage: `linear-gradient(${marca.oscuro}, ${marca.oscuro})`,
							backgroundRepeat: 'no-repeat',
							backgroundSize: `${r * 100}% 100%`,
							color: r > 0.5 ? marca.claro : P.texto,
							fontWeight: 700,
						}}
					>
						{resalta.palabra}
					</span>
				)}
				{partes[1]}
			</div>
			{fuente && (
				<div style={{marginTop: 22, display: 'flex', justifyContent: 'center'}}>
					<Metadato en={en + 6} texto={fuente} color={P.tenue} tam={28} />
				</div>
			)}
		</div>
	);
};

/** Un globo de diálogo sobre una silueta. */
export const Globo: React.FC<{en: number; texto: string; x: number; y: number; ancho?: number}> = ({en, texto, x, y, ancho = 520}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 7, curvas.sale);
	if (p <= 0) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: ancho, transform: `scale(${0.8 + 0.2 * p})`, opacity: p, transformOrigin: '20% 100%'}}>
			<div style={{background: marca.blanco, borderRadius: 34, padding: '26px 34px', fontFamily: FAMILIA, fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: P.texto, boxShadow: '0 18px 44px rgba(20,20,20,.16)'}}>{texto}</div>
			<div style={{width: 0, height: 0, marginLeft: 60, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderTop: `30px solid ${marca.blanco}`}} />
		</div>
	);
};
