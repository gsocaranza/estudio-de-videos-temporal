import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Confirmacion, Cortina, Icono, Rotulo, Tarjeta, Titular} from '../../kit/corporativo/Interfaz';
import {FAMILIA, FAMILIA_TITULOS} from '../../kit/fuentes';
import type {PropsEscena} from '../../kit/Montaje';
import {curvas, tramo} from '../../kit/movimiento';
import {marca} from '../../kit/paleta';
import {Fx} from '../../kit/Sonido';
import {E11Bolanos} from '../registro-bolanos/Video';
import {DORADO} from './LineaDeTiempo';
import {Deriva} from './Reloj';
import {w} from './tiempo';

/**
 * Las escenas de «La ruta de la transición · Logística Ámbar» (v2, con la hoja
 * de ruta del 9 de noviembre: Ámbar ya adoptó Puntualiza). Cada paso abre
 * una tarjeta a la izquierda (el mundo se corre a la derecha) y sus fechas
 * entran cuando la voz las dice; la ley y la lista de lo que
 * necesitamos van sobre una cortina carbón. Todo se ancla a palabras.
 */

// ---------------------------------------------------------------- piezas

const RUTAS_PROPIAS: Record<string, string[]> = {
	correo: ['M3.5 5.5h17v13h-17z', 'M3.5 6.5l8.5 6.5 8.5-6.5'],
	video: ['M3.5 6.5h11.5v11H3.5z', 'M15 10.5l5.5-3.2v9.4L15 13.5'],
};

const Ico: React.FC<{nombre: string; tam?: number; color?: string}> = ({nombre, tam = 30, color = marca.tinta}) =>
	RUTAS_PROPIAS[nombre] ? (
		<svg
			width={tam}
			height={tam}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={1.7}
			strokeLinecap="round"
			strokeLinejoin="round"
			style={{flexShrink: 0}}
		>
			{RUTAS_PROPIAS[nombre].map((d, i) => (
				<path key={i} d={d} />
			))}
		</svg>
	) : (
		<Icono nombre={nombre as 'documento'} tam={tam} color={color} />
	);

type Fila = {
	en: number;
	titulo: string;
	fecha?: string;
	detalle?: string;
	icono?: string;
	ok?: boolean;
};

/** Un renglón de una tarjeta: icono o fecha, lo que pasa y su detalle. */
const Renglon: React.FC<Fila & {primero?: boolean}> = ({en, titulo, fecha, detalle, icono, ok, primero}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 10, curvas.sale);
	if (p <= 0) return null;
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				padding: '16px 0',
				borderTop: primero ? 'none' : `1px solid ${marca.linea}`,
				opacity: p,
				transform: `translateY(${(1 - p) * 12}px)`,
			}}
		>
			{icono && <Ico nombre={icono} tam={32} color={marca.secundario} />}
			<div style={{flex: 1}}>
				<div
					style={{
						fontSize: 28,
						fontWeight: 700,
						color: marca.tinta,
						lineHeight: 1.2,
					}}
				>
					{titulo}
				</div>
				{detalle && (
					<div
						style={{
							fontSize: 21,
							color: marca.secundario,
							marginTop: 4,
							lineHeight: 1.3,
						}}
					>
						{detalle}
					</div>
				)}
			</div>
			{fecha && (
				<div
					style={{
						fontSize: 20,
						fontWeight: 700,
						letterSpacing: '0.06em',
						textTransform: 'uppercase',
						color: marca.tinta,
						background: '#F6EEE1',
						border: `1px solid ${DORADO}`,
						borderRadius: 999,
						padding: '6px 14px',
						whiteSpace: 'nowrap',
					}}
				>
					{fecha}
				</div>
			)}
			{ok && <Confirmacion en={en + 6} tam={34} />}
		</div>
	);
};

/** La tarjeta de un paso, a la izquierda: rótulo, título y renglones. */
const TarjetaDePaso: React.FC<{
	en: number;
	sale?: number;
	rotulo: string;
	titulo: string;
	filas: Fila[];
	ancho?: number;
}> = ({en, sale, rotulo, titulo, filas, ancho = 720}) => (
	<>
		<Tarjeta en={en} sale={sale} x={5} y={43} ancla="izq" ancho={ancho} relleno="30px 36px 18px">
			<Rotulo color={marca.tenue}>{rotulo}</Rotulo>
			<div
				style={{
					fontFamily: FAMILIA_TITULOS,
					fontSize: 50,
					fontWeight: 700,
					color: marca.tinta,
					margin: '8px 0 10px',
					lineHeight: 1.1,
				}}
			>
				{titulo}
			</div>
			{filas.map((r, i) => (
				<Renglon key={i} {...r} primero={i === 0} />
			))}
		</Tarjeta>
		{en > 0 && <Fx nombre="clic" en={en} volumen={0.7} />}
		{filas
			.filter((r) => r.en > en + 4)
			.map((r, i) => (
				<Fx key={i} nombre="tic" en={r.en} volumen={0.5} />
			))}
	</>
);

/** Ya estaba en pantalla desde la escena anterior. */
const YA = -40;

// ---------------------------------------------------------------- 1 y 2

export const E01Saludo: React.FC<PropsEscena> = ({d}) => {
	const f = useCurrentFrame();
	const nombres = tramo(f, w('01-saludo', 'jan') - 2, 10, curvas.sale);
	const logo = tramo(f, 22, 14, curvas.sale);
	return (
		<>
			<Cortina en={-20} sale={d - 16}>
				<Deriva>
					<AbsoluteFill
						style={{
							padding: '0 170px',
							justifyContent: 'center',
							fontFamily: FAMILIA,
						}}
					>
						<div
							style={{
								opacity: tramo(f, 2, 10),
								marginBottom: 26,
							}}
						>
							<Rotulo color={DORADO} tam={24}>
								Logística Ámbar · Transición de Recursos Humanos
							</Rotulo>
						</div>
						<Titular
							en={6}
							renglones={[
								{
									texto: 'La ruta de trabajo',
									tam: 128,
									color: marca.claro,
								},
								{
									texto: '10 de noviembre de 2026 al 1 de enero de 2027',
									tam: 44,
									peso: 500,
									color: DORADO,
								},
							]}
							escalon={6}
						/>
						<div
							style={{
								marginTop: 44,
								fontSize: 30,
								color: '#C9C4C0',
								opacity: nombres,
								transform: `translateY(${(1 - nombres) * 10}px)`,
							}}
						>
							Para Mariana, Daniel y Andrés
						</div>
					</AbsoluteFill>
					<Img
						src={staticFile('marcas/bolanos/logotipo-claro.png')}
						style={{
							position: 'absolute',
							left: 170,
							bottom: 90,
							height: 62,
							opacity: logo,
						}}
					/>
				</Deriva>
			</Cortina>
			<Fx nombre="barrido" en={d - 16} volumen={0.6} />
		</>
	);
};

export const E02Mapa: React.FC<PropsEscena> = ({d}) => {
	const f = useCurrentFrame();
	const nos = tramo(f, w('02-mapa', 'hacemos'), 10, curvas.sale) * (1 - tramo(f, d - 10, 8));
	const ust = tramo(f, w('02-mapa', 'necesitamos'), 10, curvas.sale) * (1 - tramo(f, d - 10, 8));
	const leyenda = (color: string, texto: string, v: number) => (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 14,
				padding: '12px 24px',
				background: marca.blanco,
				border: `1px solid ${marca.linea}`,
				borderRadius: 999,
				boxShadow: '0 12px 28px -16px rgba(20,20,20,.3)',
				opacity: v,
				transform: `translateY(${(1 - v) * 10}px)`,
			}}
		>
			<span
				style={{
					width: 18,
					height: 18,
					borderRadius: '50%',
					background: color,
				}}
			/>
			{texto}
		</div>
	);
	// un velo sobre el mundo para que la línea del tiempo se lea sola
	const velo = 0.72 * Math.min(tramo(f, 0, 12), 1 - tramo(f, d - 14, 14));
	return (
		<>
			<AbsoluteFill style={{background: marca.fondo, opacity: velo}} />
			<div
				style={{
					position: 'absolute',
					top: 150,
					width: '100%',
					opacity: 1 - tramo(f, d - 10, 8),
				}}
			>
				<Titular en={w('02-mapa', 'seis') - 2} alinear="center" renglones={[{texto: 'Seis pasos', tam: 84, color: marca.tinta}]} />
			</div>
			<div
				style={{
					position: 'absolute',
					top: 760,
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					gap: 70,
					fontFamily: FAMILIA,
					fontSize: 30,
					fontWeight: 600,
					color: marca.tinta,
				}}
			>
				{leyenda(DORADO, 'Lo que hacemos nosotros', nos)}
				{leyenda(marca.tinta, 'Lo que necesitamos de ustedes', ust)}
			</div>
			<Fx nombre="barrido" en={w('02-mapa', '10')} volumen={0.5} />
		</>
	);
};

// ---------------------------------------------------------------- 1 · formalización

export const E03Contratos: React.FC<PropsEscena> = ({d}) => (
	<TarjetaDePaso
		en={w('03-contratos', 'primero') + 2}
		sale={d - 8}
		rotulo="Paso 1"
		titulo="Formalización"
		filas={[
			{
				en: w('03-contratos', 'servicios'),
				icono: 'documento',
				titulo: 'Servicios jurídicos',
				detalle: 'Con Bolaños Abogados',
				fecha: 'Mar 10 nov',
			},
			{
				en: w('03-contratos', 'plataforma'),
				icono: 'documento',
				titulo: 'Plataforma Puntualiza',
				detalle: 'Con sus anexos',
				fecha: 'Mar 10 nov',
			},
			{
				en: w('03-contratos', 'firmamos'),
				icono: 'escudo',
				titulo: 'Firma de los dos contratos',
				detalle: 'A más tardar',
				fecha: 'Vie 13 nov',
				ok: true,
			},
		]}
	/>
);

// ---------------------------------------------------------------- 2 · puesta en marcha

const ROTULO_2 = 'Paso 2 · Puesta en marcha';

const alfa = (en: (p: string) => number): Fila[] => [
	{
		en: en('acceso'),
		icono: 'escudo',
		titulo: 'Acceso de Mariana a Alfa',
		fecha: 'Mié 11 nov',
	},
	{
		en: en('información'),
		icono: 'documento',
		titulo: 'La plantilla pasa a Puntualiza',
		detalle: 'Sin cargarles trabajo',
		fecha: 'Jue 12 nov',
	},
];

export const E04Alfa: React.FC<PropsEscena> = () => (
	<TarjetaDePaso en={w('04-alfa', 'segundo') + 2} rotulo={ROTULO_2} titulo="Puntualiza, configurada" filas={alfa((p) => w('04-alfa', p))} />
);

export const E05Demo: React.FC<PropsEscena> = ({d}) => (
	<TarjetaDePaso
		en={YA}
		sale={d - 8}
		rotulo={ROTULO_2}
		titulo="Puntualiza, configurada"
		filas={[
			...alfa(() => YA),
			{
				en: w('05-demo', 'demostración'),
				icono: 'video',
				titulo: 'Demostración de la plataforma',
				detalle: 'Dirección, Mariana y encargados',
				fecha: 'Vie 13 nov',
			},
		]}
	/>
);

export const E06Politica: React.FC<PropsEscena> = ({d}) => (
	<TarjetaDePaso
		en={w('06-politica', 'antes')}
		sale={d - 8}
		rotulo="Antes de su primera marca · 13 o 17 nov"
		titulo="Cada trabajador firma"
		filas={[
			{
				en: w('06-politica', 'política'),
				icono: 'documento',
				titulo: 'Política de registro electrónico de jornada',
				detalle: 'En su centro, con su encargado',
			},
			{
				en: w('06-politica', 'adenda'),
				icono: 'documento',
				titulo: 'Adenda a su contrato',
				detalle: 'Sólo quien la requiera',
			},
		]}
	/>
);

// ---------------------------------------------------------------- 3 · implementación

export const E07Implementacion: React.FC<PropsEscena> = ({d}) => (
	<TarjetaDePaso
		en={w('07-implementacion', 'tercero') + 2}
		sale={d - 8}
		rotulo="Paso 3 · Periodo de implementación"
		titulo="17 nov – 16 dic"
		ancho={640}
		filas={[
			{
				en: w('07-implementacion', 'cuatro'),
				icono: 'kiosco',
				titulo: 'En los cuatro centros',
			},
			{
				en: w('07-implementacion', 'mensualidad'),
				icono: 'escudo',
				titulo: 'Sin mensualidad',
				ok: true,
			},
		]}
	/>
);

export const E08Reportes: React.FC<PropsEscena> = ({d}) => {
	const f = useCurrentFrame();
	const viernes = w('08-reportes', 'viernes');
	const fechas = ['Vie 20 nov', 'Vie 27 nov', 'Vie 4 dic', 'Vie 11 dic'];
	const detalle = tramo(f, w('08-reportes', 'marcas'), 10, curvas.sale);
	return (
		<>
			<Tarjeta en={viernes - 4} sale={d - 8} x={5} y={43} ancla="izq" ancho={720} relleno="30px 36px 32px">
				<Rotulo color={marca.tenue}>Cada viernes de la implementación</Rotulo>
				<div
					style={{
						fontFamily: FAMILIA_TITULOS,
						fontSize: 50,
						fontWeight: 700,
						color: marca.tinta,
						margin: '8px 0 18px',
						lineHeight: 1.1,
					}}
				>
					Reporte semanal a Mariana
				</div>
				<div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
					{fechas.map((t, k) => {
						const p = tramo(f, viernes + 6 + k * 6, 9, curvas.sale);
						return (
							<div
								key={t}
								style={{
									opacity: p,
									transform: `translateY(${(1 - p) * 10}px)`,
									fontSize: 22,
									fontWeight: 700,
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									padding: '8px 16px',
									borderRadius: 999,
									background: '#F6EEE1',
									border: `1px solid ${DORADO}`,
									color: marca.tinta,
								}}
							>
								{t}
							</div>
						);
					})}
				</div>
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: '6px 18px',
						marginTop: 24,
						paddingTop: 18,
						borderTop: `1px solid ${marca.linea}`,
						fontSize: 25,
						fontWeight: 600,
						color: marca.secundario,
						opacity: detalle,
					}}
				>
					<span>Marcas</span>
					<span style={{color: DORADO}}>·</span>
					<span>Incidencias</span>
					<span style={{color: DORADO}}>·</span>
					<span>Firmas pendientes</span>
					<span style={{color: DORADO}}>·</span>
					<span>Ajustes</span>
				</div>
			</Tarjeta>
			<Fx nombre="clic" en={viernes - 4} volumen={0.7} />
			{fechas.map((t, k) => (
				<Fx key={t} nombre="tic" en={viernes + 6 + k * 6} volumen={0.4} />
			))}
		</>
	);
};

// ---------------------------------------------------------------- 4 · entrega-recepción

export const E09Entrega: React.FC<PropsEscena> = ({d}) => (
	<TarjetaDePaso
		en={w('09-entrega', 'cuarto') + 2}
		sale={d - 8}
		rotulo="Paso 4 · Entrega-recepción"
		titulo="Con Mariana"
		filas={[
			{
				en: w('09-entrega', '24'),
				icono: 'video',
				titulo: 'Sesión 1 por videollamada',
				detalle: 'Expedientes, contratos y vencimientos',
				fecha: 'Mar 24 nov',
			},
			{
				en: w('09-entrega', '26'),
				icono: 'video',
				titulo: 'Sesión 2 por videollamada',
				detalle: 'Asuntos en curso y procedimientos',
				fecha: 'Jue 26 nov',
			},
			{
				en: w('09-entrega', 'acta'),
				icono: 'documento',
				titulo: 'Acta de entrega-recepción',
				detalle: 'Lo recibido y lo pendiente',
				fecha: 'Lun 30 nov',
				ok: true,
			},
		]}
	/>
);

// ---------------------------------------------------------------- 5 · inicio formal

export const E10Inicio: React.FC<PropsEscena> = ({d}) => {
	const f = useCurrentFrame();
	const martes = w('10-inicio', 'martes');
	const servicio = tramo(f, w('10-inicio', 'administración'), 10, curvas.sale);
	return (
		<>
			<Tarjeta en={w('10-inicio', 'quinto')} sale={d - 8} x={50} y={38} ancho={1120} relleno="40px 56px 44px">
				<div style={{textAlign: 'center'}}>
					<Rotulo color={marca.tenue}>Paso 5 · Inicio formal del servicio</Rotulo>
					<div style={{marginTop: 14}}>
						<Titular
							en={w('10-inicio', 'inicio') - 2}
							alinear="center"
							renglones={[
								{
									texto: 'Martes 1 de diciembre de 2026',
									tam: 66,
									color: marca.tinta,
								},
							]}
						/>
					</div>
					<div
						style={{
							marginTop: 18,
							fontSize: 26,
							color: marca.secundario,
							opacity: servicio,
						}}
					>
						Administración externa de personal y relaciones laborales
					</div>
				</div>
			</Tarjeta>
			<Fx nombre="clic" en={w('10-inicio', 'quinto')} volumen={0.7} />
			<Fx nombre="golpe" en={martes} volumen={0.5} />
		</>
	);
};

export const E11Reglamento: React.FC<PropsEscena> = ({d}) => (
	<TarjetaDePaso
		en={w('11-reglamento', 'mes')}
		sale={d - 8}
		rotulo="Paso 5 · En diciembre"
		titulo="Reglamento Interno de Trabajo"
		filas={[
			{
				en: w('11-reglamento', 'comisión'),
				icono: 'escudo',
				titulo: 'Lo aprueba la Comisión Mixta',
				fecha: 'Jue 3 dic',
				ok: true,
			},
			{
				en: w('11-reglamento', 'depositado'),
				icono: 'documento',
				titulo: 'Depositado y fijado en cada centro',
				fecha: 'Vie 11 dic',
			},
		]}
	/>
);

// ---------------------------------------------------------------- 6 · registro exigible

export const E12Ley: React.FC<PropsEscena> = ({d}) => {
	const f = useCurrentFrame();
	const entra = w('12-ley', 'sexto') + 8;
	const datos = w('12-ley', 'jornada', 2);
	const firmado = w('12-ley', 'firmado');
	const pf = tramo(f, firmado - 2, 10, curvas.sale);
	const jornada = [
		['2026', '48 h'],
		['2027', '46 h'],
		['2030', '40 h'],
	];
	return (
		<>
			<Cortina en={entra} sale={d - 14}>
				<Deriva>
					<AbsoluteFill
						style={{
							padding: '130px 170px 0',
							fontFamily: FAMILIA,
						}}
					>
						<div
							style={{
								opacity: tramo(f, entra + 6, 10),
								marginBottom: 22,
							}}
						>
							<Rotulo color={DORADO} tam={24}>
								Paso 6 · Registro electrónico exigible
							</Rotulo>
						</div>
						<Titular
							en={w('12-ley', 'registro') - 2}
							renglones={[
								{
									texto: 'Registro electrónico de jornada',
									tam: 92,
									color: marca.claro,
								},
								{
									texto: 'obligatorio desde el 1 de enero de 2027',
									tam: 46,
									peso: 500,
									color: DORADO,
								},
							]}
						/>
						<div style={{display: 'flex', gap: 70, marginTop: 52}}>
							{jornada.map(([anio, horas], k) => {
								const p = tramo(f, datos + k * 7, 10, curvas.sale);
								return (
									<div
										key={anio}
										style={{
											opacity: p,
											transform: `translateY(${(1 - p) * 12}px)`,
											borderTop: `2px solid ${DORADO}`,
											paddingTop: 14,
											minWidth: 190,
										}}
									>
										<div
											style={{
												fontSize: 22,
												fontWeight: 700,
												letterSpacing: '0.12em',
												color: '#C9C4C0',
											}}
										>
											{anio}
										</div>
										<div
											style={{
												fontFamily: FAMILIA_TITULOS,
												fontSize: 72,
												fontWeight: 700,
												color: marca.claro,
											}}
										>
											{horas}
										</div>
									</div>
								);
							})}
							<div
								style={{
									alignSelf: 'flex-end',
									fontSize: 24,
									color: '#C9C4C0',
									paddingBottom: 18,
									opacity: tramo(f, datos + 22, 10),
								}}
							>
								Jornada máxima por semana
							</div>
						</div>
						<div
							style={{
								marginTop: 40,
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								fontSize: 32,
								fontWeight: 600,
								color: marca.claro,
								opacity: pf,
								transform: `translateY(${(1 - pf) * 10}px)`,
							}}
						>
							<Confirmacion en={firmado + 4} tam={38} />
							Para entonces, todo <span style={{color: DORADO}}>firmado y configurado</span>
						</div>
					</AbsoluteFill>
					<div
						style={{
							position: 'absolute',
							right: 170,
							top: 140,
							fontSize: 21,
							color: '#9EA3A9',
							opacity: tramo(f, w('12-ley', 'registro') + 10, 12),
						}}
					>
						Ley Federal del Trabajo, art. 132, fr. XXXIV
					</div>
				</Deriva>
			</Cortina>
			<Fx nombre="barrido" en={entra} volumen={0.6} />
			{jornada.map((_, k) => (
				<Fx key={k} nombre="tic" en={datos + k * 7} volumen={0.4} />
			))}
		</>
	);
};

// ---------------------------------------------------------------- lo que necesitamos

type Necesidad = {fecha: string; titulo: string; detalle?: string};

const NECESIDADES: Necesidad[] = [
	{
		fecha: '11 nov',
		titulo: 'El acceso a Alfa y la información de configuración',
		detalle: 'Jornadas, turnos, horario de comida, descansos, vacaciones y centros de trabajo',
	},
	{
		fecha: '11 nov',
		titulo: 'Los responsables',
		detalle: 'Administrador de la plataforma, encargado de Querétaro y la confirmación del de Ciudad de México',
	},
	{
		fecha: '12 nov',
		titulo: 'Su visto bueno a la política y a la adenda',
	},
	{
		fecha: '13 nov',
		titulo: 'Los procedimientos de Recursos Humanos de su sistema ISO',
	},
	{
		fecha: '20 nov',
		titulo: 'Los expedientes, contratos vigentes y saldos de vacaciones',
		detalle: 'Y el directorio de supervisores',
	},
	{
		fecha: '23 nov',
		titulo: 'Los asuntos en curso',
		detalle: 'Incidencias abiertas, procedimientos disciplinarios, quejas y terminaciones',
	},
	{
		fecha: '30 nov',
		titulo: 'Un espacio privado para videollamada en cada centro',
		detalle: 'Con cámara y audio, buena conexión y puerta que cierre',
	},
];

/** La cortina carbón con el título y los renglones que ya entraron. */
const Necesitamos: React.FC<{
	entra: number;
	tituloEn: number;
	filas: number[];
	sale?: number;
}> = ({entra, tituloEn, filas, sale}) => {
	const f = useCurrentFrame();
	const fuera = sale === undefined ? 0 : tramo(f, sale, 8, curvas.entra);
	return (
		<Cortina en={entra}>
			<Deriva>
				<AbsoluteFill
					style={{
						padding: '130px 170px 0',
						fontFamily: FAMILIA,
						opacity: 1 - fuera,
					}}
				>
					<Titular
						en={tituloEn}
						renglones={[
							{
								texto: 'Lo que necesitamos de ustedes',
								tam: 64,
								color: marca.claro,
							},
						]}
					/>
					<div style={{marginTop: 26}}>
						{NECESIDADES.map((n, i) => {
							const en = filas[i];
							const p = en === undefined ? 0 : tramo(f, en, 10, curvas.sale);
							return (
								<div
									key={i}
									style={{
										display: 'flex',
										alignItems: 'baseline',
										gap: 34,
										padding: '13px 0',
										borderTop: '1px solid rgba(240,236,235,.14)',
										opacity: p,
										transform: `translateX(${(1 - p) * -18}px)`,
									}}
								>
									<div
										style={{
											width: 160,
											flexShrink: 0,
											fontFamily: FAMILIA_TITULOS,
											fontSize: 34,
											fontWeight: 700,
											color: DORADO,
										}}
									>
										{n.fecha}
									</div>
									<div>
										<div
											style={{
												fontSize: 29,
												fontWeight: 600,
												color: marca.claro,
											}}
										>
											{n.titulo}
										</div>
										{n.detalle && (
											<div
												style={{
													fontSize: 20,
													color: '#AEB3B9',
													marginTop: 4,
												}}
											>
												{n.detalle}
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</AbsoluteFill>
			</Deriva>
		</Cortina>
	);
};

export const E13Necesitamos: React.FC<PropsEscena> = () => (
	<>
		<Necesitamos entra={0} tituloEn={w('13-necesitamos', 'necesitamos') - 4} filas={[]} />
		<Fx nombre="barrido" en={0} volumen={0.6} />
	</>
);

export const E14Noviembre: React.FC<PropsEscena> = () => {
	const filas = [w('14-noviembre', 'acceso'), w('14-noviembre', 'nombres'), w('14-noviembre', 'visto')];
	return (
		<>
			<Necesitamos entra={YA} tituloEn={YA} filas={filas} />
			{filas.map((t) => (
				<Fx key={t} nombre="tic" en={t} volumen={0.5} />
			))}
		</>
	);
};

export const E15Expedientes: React.FC<PropsEscena> = () => {
	const filas = [w('15-expedientes', 'procedimientos'), w('15-expedientes', 'expedientes'), w('15-expedientes', 'asuntos')];
	return (
		<>
			<Necesitamos entra={YA} tituloEn={YA} filas={[YA, YA, YA, ...filas]} />
			{filas.map((t) => (
				<Fx key={t} nombre="tic" en={t} volumen={0.5} />
			))}
		</>
	);
};

export const E16Espacio: React.FC<PropsEscena> = () => {
	const t = w('16-espacio', 'espacio');
	return (
		<>
			<Necesitamos entra={YA} tituloEn={YA} filas={[YA, YA, YA, YA, YA, YA, t]} />
			<Fx nombre="tic" en={t} volumen={0.5} />
		</>
	);
};

// ---------------------------------------------------------------- canal y arranque

const Contacto: React.FC<{
	en: number;
	icono: string;
	rotulo: string;
	texto: string;
}> = ({en, icono, rotulo, texto}) => {
	const f = useCurrentFrame();
	const p = tramo(f, en, 10, curvas.sale);
	return (
		<div
			style={{
				flex: 1,
				display: 'flex',
				alignItems: 'center',
				gap: 26,
				padding: '34px 38px',
				background: marca.blanco,
				borderRadius: 16,
				opacity: p,
				transform: `translateY(${(1 - p) * 16}px)`,
			}}
		>
			<Ico nombre={icono} tam={54} color={DORADO} />
			<div>
				<Rotulo color={marca.tenue}>{rotulo}</Rotulo>
				<div
					style={{
						fontSize: 38,
						fontWeight: 700,
						color: marca.tinta,
						marginTop: 4,
						whiteSpace: 'nowrap',
					}}
				>
					{texto}
				</div>
			</div>
		</div>
	);
};

export const E17Canal: React.FC<PropsEscena> = ({d}) => {
	const f = useCurrentFrame();
	const registrada = tramo(f, w('17-canal', 'registrada'), 10, curvas.sale);
	const fuera = tramo(f, d - 8, 8, curvas.entra);
	return (
		<>
			<Necesitamos entra={YA} tituloEn={YA} filas={[YA, YA, YA, YA, YA, YA, YA]} sale={0} />
			<AbsoluteFill
				style={{
					zIndex: 2,
					padding: '0 170px',
					justifyContent: 'center',
					fontFamily: FAMILIA,
					opacity: 1 - fuera,
				}}
			>
				<div style={{opacity: tramo(f, 8, 10), marginBottom: 18}}>
					<Rotulo color={DORADO} tam={24}>
						Desde hoy
					</Rotulo>
				</div>
				<Titular
					en={10}
					renglones={[
						{
							texto: 'Un solo canal para toda solicitud',
							tam: 76,
							color: marca.claro,
						},
					]}
				/>
				<div style={{display: 'flex', gap: 34, marginTop: 56}}>
					<Contacto en={w('17-canal', 'correo')} icono="correo" rotulo="Correo" texto="contacto@ejemplo.mx" />
					<Contacto en={w('17-canal', 'whatsapp')} icono="telefono" rotulo="WhatsApp" texto="33 0000 0000" />
				</div>
				<div
					style={{
						marginTop: 44,
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						fontSize: 30,
						color: '#C9C4C0',
						opacity: registrada,
					}}
				>
					<Confirmacion en={w('17-canal', 'registrada') + 4} tam={36} />
					Para que cada una quede registrada
				</div>
			</AbsoluteFill>
			<Fx nombre="tic" en={w('17-canal', 'correo')} volumen={0.5} />
			<Fx nombre="tic" en={w('17-canal', 'whatsapp')} volumen={0.5} />
		</>
	);
};

export const E18Arranque: React.FC<PropsEscena> = ({f, d}) => {
	const respaldo = w('18-arranque', 'respaldo') - 10;
	const p = tramo(f, 4, 12, curvas.sale);
	return (
		<>
			<Cortina en={YA}>
				<Deriva>
					<AbsoluteFill
						style={{
							alignItems: 'center',
							justifyContent: 'center',
							fontFamily: FAMILIA,
							textAlign: 'center',
						}}
					>
						<div
							style={{
								opacity: p,
								transform: `translateY(${(1 - p) * 14}px)`,
							}}
						>
							<Rotulo color={DORADO} tam={24}>
								Reunión de arranque · por videollamada
							</Rotulo>
							<div
								style={{
									fontFamily: FAMILIA_TITULOS,
									fontSize: 84,
									fontWeight: 700,
									color: marca.claro,
									marginTop: 22,
								}}
							>
								Miércoles 11 o jueves 12
							</div>
							<div
								style={{
									fontFamily: FAMILIA_TITULOS,
									fontSize: 52,
									fontWeight: 500,
									color: DORADO,
									marginTop: 6,
								}}
							>
								de noviembre · 11:00 o 16:00 h
							</div>
						</div>
					</AbsoluteFill>
				</Deriva>
			</Cortina>
			<Fx nombre="clic" en={4} volumen={0.6} />
			<Sequence from={respaldo} durationInFrames={d - respaldo} layout="none">
				{/* una deriva lenta: el logotipo no se queda congelado los últimos segundos */}
				<AbsoluteFill
					style={{
						zIndex: 3,
						transform: `scale(${1 + 0.035 * tramo(f, respaldo + 30, d - respaldo - 30, curvas.lineal)})`,
					}}
				>
					<E11Bolanos f={f - respaldo} d={d - respaldo} />
				</AbsoluteFill>
			</Sequence>
		</>
	);
};
