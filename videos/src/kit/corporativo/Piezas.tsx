import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {FAMILIA} from '../fuentes';
import {Isotipo} from '../Graficos';
import {curvas, tramo} from '../movimiento';
import {estado, marca} from '../paleta';
import {Chip, Icono, Indicador, Rotulo, Tarjeta, useEntrada} from './Interfaz';
import {fuente} from './Proyeccion';
import type {Dibujo} from './Sets';

/**
 * Piezas 2D que se repiten entre videos de los dos estilos: el gafete de un
 * personaje, el chip de un canal de marca, la acción bloqueada, la cadena de
 * marcas selladas, el tablero de asistencia y el cierre con llamada a la
 * acción. Nacieron en los videos de venta del 2026-10-16.
 */

export const Gafete: React.FC<{nombre: string; puesto: string}> = ({nombre, puesto}) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'baseline',
			gap: 10,
			padding: '10px 18px',
			background: marca.blanco,
			border: `1px solid ${marca.linea}`,
			borderRadius: 12,
			boxShadow: '0 12px 28px -16px rgba(20,20,20,.35)',
			fontFamily: FAMILIA,
		}}
	>
		<span style={{fontSize: 30, fontWeight: 700, color: marca.tinta}}>{nombre}</span>
		<span style={{fontSize: 22, fontWeight: 500, color: marca.secundario}}>{puesto}</span>
	</div>
);

export type IconoCanal = 'telefono' | 'kiosco' | 'llamada';

/** Un canal de marca que aparece (aplicación, kiosco, llamada). */
export const CanalChip: React.FC<{en: number; icono: IconoCanal; texto: string; activo?: boolean}> = ({en, icono, texto, activo}) => {
	const v = useEntrada(en);
	if (v <= 0) return null;
	return (
		<div
			style={{
				opacity: v,
				transform: `translateY(${(1 - v) * 16}px)`,
				display: 'flex',
				alignItems: 'center',
				gap: 14,
				padding: '16px 24px',
				background: activo ? marca.oscuro : marca.blanco,
				color: activo ? marca.claro : marca.tinta,
				border: `1px solid ${activo ? marca.oscuro : marca.linea}`,
				borderRadius: 16,
				boxShadow: '0 18px 40px -20px rgba(20,20,20,.3)',
				fontFamily: FAMILIA,
				fontSize: 28,
				fontWeight: 600,
			}}
		>
			<Icono nombre={icono} tam={34} color={activo ? marca.claro : marca.tinta} />
			{texto}
		</div>
	);
};

/** Fila de canales al pie; `activo` resalta el que se está viendo. */
export const FilaDeCanales: React.FC<{canales: {en: number; icono: IconoCanal; texto: string}[]; activo?: number; arriba?: boolean}> = ({canales, activo, arriba}) => (
	<div style={{position: 'absolute', left: 0, right: 0, ...(arriba ? {top: 56} : {bottom: 64}), display: 'flex', justifyContent: 'center', gap: 18}}>
		{canales.map((c, i) => (
			<CanalChip key={c.texto} {...c} activo={activo === i} />
		))}
	</div>
);

/** Una acción que no se puede hacer: se tacha. */
export const Bloqueado: React.FC<{en: number; texto: string}> = ({en, texto}) => {
	const f = useCurrentFrame();
	const v = useEntrada(en);
	const t = tramo(f, en + 6, 8, curvas.sale);
	if (v <= 0) return null;
	return (
		<div
			style={{
				opacity: v,
				position: 'relative',
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				padding: '12px 30px',
				borderRadius: 12,
				border: `1px solid ${marca.linea}`,
				background: marca.blanco,
				color: marca.tenue,
				fontSize: 30,
				fontWeight: 600,
				fontFamily: FAMILIA,
			}}
		>
			<Icono nombre="candado" tam={24} color={marca.tenue} />
			{texto}
			<div style={{position: 'absolute', left: 18, top: '50%', height: 3, width: `calc(${t * 100}% - 36px)`, background: estado.falta}} />
		</div>
	);
};

const MARCAS: [string, string, string][] = [
	['Entrada', '8:58 a. m.', '4f1a·c90e'],
	['Inicio de descanso', '2:00 p. m.', '9b27·03dd'],
	['Salida', '6:04 p. m.', 'e6c4·7a51'],
];

/** Tres marcas encadenadas que se sellan una tras otra. `y` es el centro vertical en px. */
export const CadenaDeMarcas: React.FC<{en: number; sella: number; y?: number; ancho?: number}> = ({en, sella, y = 470, ancho = 440}) => {
	const f = useCurrentFrame();
	const hueco = 110;
	const total = ancho * 3 + hueco * 2;
	const x0 = (1920 - total) / 2;
	return (
		<>
			<svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} viewBox="0 0 1920 1080">
				{[0, 1].map((i) => {
					const p = tramo(f, en + 6 + i * 6, 10, curvas.sale);
					const xa = x0 + ancho * (i + 1) + hueco * i;
					return p > 0 ? <line key={i} x1={xa} y1={y} x2={xa + hueco * p} y2={y} stroke={marca.tinta} strokeWidth={2} strokeDasharray="7 6" /> : null;
				})}
			</svg>
			{MARCAS.map(([tipo, hora, huella], i) => {
				const s = tramo(f, sella + i * 4, 8, curvas.sale);
				return (
					<Tarjeta key={tipo} en={en + i * 6} x={((x0 + i * (ancho + hueco)) / 1920) * 100} y={(y / 1080) * 100} ancla="izq" ancho={ancho} relleno="26px 30px">
						<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
							<Rotulo tam={17}>{tipo}</Rotulo>
							<span style={{opacity: s, transform: `scale(${1.15 - 0.15 * s})`, display: 'inline-flex'}}>
								<Icono nombre="candado" tam={26} color={estado.presente} />
							</span>
						</div>
						<div style={{fontSize: 64, fontWeight: 700, marginTop: 6}}>{hora}</div>
						<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10}}>
							<span style={{fontFamily: 'Consolas, monospace', fontSize: 20, color: marca.tenue}}>huella {huella}</span>
							<span style={{opacity: s}}>
								<Chip estado="presente" tam={17}>
									Sellada
								</Chip>
							</span>
						</div>
					</Tarjeta>
				);
			})}
		</>
	);
};

/** El tablero de asistencia de hoy: cifras que cuentan, una por palabra de la voz. */
export const TableroAsistencia: React.FC<{
	en: number;
	presentes: number;
	retardos: number;
	faltas: number;
	horas: number;
	valores?: [number, number, number, number];
	x?: number;
	y?: number;
	ancla?: 'izq' | 'der';
}> = ({en, presentes, retardos, faltas, horas, valores = [118, 6, 3, 14], x = 3.6, y = 50, ancla = 'izq'}) => (
	<Tarjeta en={en} x={x} y={y} ancla={ancla} ancho={430}>
		<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
			<Rotulo>Asistencia de hoy</Rotulo>
			<Chip estado="presente" tam={16}>
				En vivo
			</Chip>
		</div>
		<Indicador en={presentes} rotulo="Presentes" valor={valores[0]} estado="presente" />
		<Indicador en={retardos} rotulo="Retardos" valor={valores[1]} estado="retardo" />
		<Indicador en={faltas} rotulo="Faltas" valor={valores[2]} estado="falta" />
		<Indicador en={horas} rotulo="Horas extra de la semana" valor={valores[3]} sufijo=" h" />
	</Tarjeta>
);

/** El cierre: fondo negro que sube, la marca y la llamada a la acción. */
export const CierreConMarca: React.FC<{en: number; lema?: string; accion?: string}> = ({
	en,
	lema = 'Control de asistencia con evidencia.',
	accion = 'Agenda tu demostración',
}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 18, curvas.sale);
	const q = tramo(f, en + 10, 16, curvas.sale);
	const b = tramo(f, en + 24, 14, curvas.sale);
	if (p <= 0) return null;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: marca.oscuro, clipPath: `inset(${(1 - p) * 100}% 0 0 0)`}} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FAMILIA}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 40, opacity: q, transform: `translateY(${(1 - q) * 20}px)`}}>
					<Isotipo tam={130} tinta={marca.claro} giro={(1 - q) * -60} />
					<div>
						<div style={{fontSize: 120, fontWeight: 700, color: marca.claro, lineHeight: 1}}>Puntualiza</div>
						<div style={{fontSize: 38, fontWeight: 500, color: marca.tenue, marginTop: 12}}>{lema}</div>
					</div>
				</div>
				<div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 70, opacity: b, transform: `translateY(${(1 - b) * 16}px)`}}>
					<div style={{padding: '18px 36px', borderRadius: 14, background: marca.claro, color: marca.oscuro, fontSize: 34, fontWeight: 700}}>{accion}</div>
					<div style={{fontSize: 34, fontWeight: 600, color: marca.claro}}>puntualiza.com</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** El panel en el monitor: tres centros con su barra de presentes. `p` 0→1 los llena. */
export const pantallaTablero = (p: number): Dibujo => ({
	clave: `tablero${p.toFixed(2)}`,
	dibuja: (ctx, W, H) => {
		ctx.fillStyle = marca.blanco;
		ctx.fillRect(0, 0, W, H);
		const m = W * 0.06;
		ctx.fillStyle = marca.tenue;
		ctx.font = fuente(600, H * 0.065);
		ctx.textAlign = 'left';
		ctx.fillText('ASISTENCIA DE HOY · EN VIVO', m, H * 0.15);
		const centros: [string, number][] = [
			['Oficinas', 0.96],
			['Centro Norte', 0.88],
			['Centro Sur', 0.92],
		];
		centros.forEach(([n, v], i) => {
			const y = H * 0.3 + i * H * 0.22;
			ctx.fillStyle = marca.tinta;
			ctx.font = fuente(600, H * 0.075);
			ctx.fillText(n, m, y);
			ctx.fillStyle = '#EEECE9';
			ctx.fillRect(m, y + H * 0.04, W - 2 * m, H * 0.06);
			ctx.fillStyle = estado.presente;
			ctx.fillRect(m, y + H * 0.04, (W - 2 * m) * v * p, H * 0.06);
		});
	},
});

/** La pantalla del kiosco o del teléfono: «Marca tu entrada» y, al marcar, verde con la hora. */
export const pantallaMarca = (tipo: string, h: string, ok: number): Dibujo => ({
	clave: `${tipo}${ok.toFixed(2)}`,
	dibuja: (ctx, W, H) => {
		ctx.fillStyle = interpolateColors(ok, [0, 1], ['#F4F2EE', estado.presente]);
		ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = ok > 0.5 ? marca.blanco : marca.tinta;
		ctx.textAlign = 'center';
		ctx.font = fuente(600, H * 0.09);
		ctx.fillText((ok > 0.5 ? `${tipo} registrada` : `Marca tu ${tipo.toLowerCase()}`).toUpperCase(), W / 2, H * 0.38);
		ctx.font = fuente(700, H * 0.22);
		ctx.fillText(h, W / 2, H * 0.66);
	},
});

/**
 * La pantalla del kiosco comparando un rostro: el óvalo de la cara con sus
 * esquinas, una línea que recorre (`barrido` 0→1) y, al confirmar (`ok`), verde.
 */
export const pantallaRostro = (barrido: number, ok: number): Dibujo => ({
	clave: `rostro${barrido.toFixed(2)}${ok.toFixed(2)}`,
	dibuja: (ctx, W, H) => {
		const verde = ok > 0.5;
		ctx.fillStyle = verde ? estado.presente : '#20262B';
		ctx.fillRect(0, 0, W, H);
		const cx = W / 2;
		const cy = H * 0.44;
		const rx = H * 0.2;
		const ry = H * 0.27;
		ctx.strokeStyle = verde ? marca.blanco : '#9FB3BF';
		ctx.lineWidth = H * 0.015;
		ctx.beginPath();
		ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
		ctx.stroke();
		// las cuatro esquinas del encuadre
		const e = H * 0.08;
		const x0 = cx - rx * 1.45;
		const x1 = cx + rx * 1.45;
		const y0 = cy - ry * 1.2;
		const y1 = cy + ry * 1.2;
		ctx.lineWidth = H * 0.02;
		for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]] as const) {
			ctx.beginPath();
			ctx.moveTo(x, y + dy * e);
			ctx.lineTo(x, y);
			ctx.lineTo(x + dx * e, y);
			ctx.stroke();
		}
		if (!verde) {
			const y = y0 + (y1 - y0) * barrido;
			ctx.fillStyle = 'rgba(159,179,191,.9)';
			ctx.fillRect(x0, y - H * 0.006, x1 - x0, H * 0.012);
		}
		ctx.fillStyle = verde ? marca.blanco : '#C9D3D9';
		ctx.textAlign = 'center';
		ctx.font = fuente(600, H * 0.075);
		ctx.fillText(verde ? 'ROSTRO VERIFICADO' : 'MIRA A LA CÁMARA', cx, H * 0.92);
	},
});
