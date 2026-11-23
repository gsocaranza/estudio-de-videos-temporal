import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
	Aviso,
	Barras,
	Chip,
	Confirmacion,
	Cortina,
	Icono,
	Indicador,
	Rotulo,
	Tarjeta,
	Titular,
	Trazo,
	useEntrada,
} from '../../kit/corporativo/Interfaz';
import {FAMILIA} from '../../kit/fuentes';
import {Isotipo} from '../../kit/Graficos';
import {curvas, tramo} from '../../kit/movimiento';
import {estado, marca} from '../../kit/paleta';
import {Fx} from '../../kit/Sonido';
import {conteo, SITIOS} from './Mundo';
import {w} from './tiempo';

/**
 * Lo que va encima del mundo en cada escena. El mundo 3D (Mundo.tsx) corre
 * por debajo todo el video; aquí sólo hay interfaz, texto y sonido, anclados
 * a palabras de la voz con `w()`.
 */
type P = {d: number};

const PAPEL: React.CSSProperties = {
	background: marca.fondo,
	backgroundImage: `radial-gradient(${marca.linea} 1.6px, transparent 1.6px)`,
	backgroundSize: '32px 32px',
};

// ------------------------------------------------------------------ 1

export const E1Hoy: React.FC<P> = () => {
	const preguntas: [string, string][] = [
		['quien', '¿Quién llegó?'],
		['hora', '¿A qué hora?'],
		['cuantas', '¿Cuántas horas trabajó?'],
	];
	return (
		<AbsoluteFill>
			<Tarjeta en={w('01-hoy', 'empresas')} x={3.6} y={50} ancla="izq" ancho={470}>
				<Rotulo>La asistencia, hoy</Rotulo>
				<div style={{marginTop: 14}}>
					{preguntas.map(([palabra, texto]) => (
						<Pregunta key={palabra} en={w('01-hoy', palabra)} texto={texto} />
					))}
				</div>
			</Tarjeta>
			<Fx nombre="clic" en={w('01-hoy', 'empresas')} />
			{preguntas.map(([palabra]) => (
				<Fx key={palabra} nombre="tic" en={w('01-hoy', palabra)} />
			))}
		</AbsoluteFill>
	);
};

const Pregunta: React.FC<{en: number; texto: string}> = ({en, texto}) => {
	const v = useEntrada(en);
	return (
		<div
			style={{
				opacity: v,
				transform: `translateY(${(1 - v) * 10}px)`,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: '14px 0',
				borderTop: `1px solid ${marca.linea}`,
				fontSize: 31,
				fontWeight: 600,
			}}
		>
			{texto}
			<span style={{color: marca.tenue, fontWeight: 500}}>—</span>
		</div>
	);
};

// ------------------------------------------------------------------ 2

export const E2Dispersa: React.FC<P> = () => (
	<AbsoluteFill>
		<Fx nombre="barrido" en={2} />
		{(['listas', 'hojas', 'memoria'] as const).map((p) => (
			<Fx key={p} nombre="clic" en={w('02-dispersa', p)} />
		))}
		<Fx nombre="barrido" en={w('02-dispersa', 'centro') - 6} />
		{SITIOS.map((_, i) => (
			<Fx key={i} nombre="tic" en={w('02-dispersa', 'centro') + 24 + i * 6} />
		))}
	</AbsoluteFill>
);

// ------------------------------------------------------------------ 3

export const E3Ley: React.FC<P> = () => {
	const f = useCurrentFrame();
	const cortina = 4;
	const ley = w('03-ley', 'reforma');
	const registro = w('03-ley', 'registro');
	const obligatorio = w('03-ley', 'obligatorio');
	const anio = w('03-ley', 'partir');
	const pAnio = tramo(f, anio, 14, curvas.sale);
	return (
		<AbsoluteFill>
			<Cortina en={cortina}>
				<AbsoluteFill style={{padding: '0 180px', justifyContent: 'center', fontFamily: FAMILIA, color: marca.claro}}>
					<div style={{opacity: tramo(f, ley, 10, curvas.sale), marginBottom: 28}}>
						<Rotulo color={marca.tenue} tam={26}>
							Reforma a la Ley Federal del Trabajo
						</Rotulo>
					</div>
					<Titular
						en={registro}
						renglones={[
							{texto: 'Registro electrónico', tam: 120},
							{texto: 'de la jornada', tam: 120, color: marca.tenue},
						]}
					/>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 36, marginTop: 56}}>
						<div style={{opacity: tramo(f, obligatorio, 10, curvas.sale), fontSize: 44, fontWeight: 500, color: marca.claro}}>
							Obligatorio a partir de
						</div>
						<div style={{overflow: 'hidden', height: 150}}>
							<div style={{fontSize: 150, fontWeight: 700, lineHeight: 1, transform: `translateY(${(1 - pAnio) * 100}%)`}}>2027</div>
						</div>
					</div>
					<div style={{position: 'absolute', left: 180, bottom: 90, fontSize: 24, color: marca.tenue, opacity: tramo(f, anio + 10, 10)}}>
						LFT, art. 132, fracción XXXIV
					</div>
				</AbsoluteFill>
			</Cortina>
			<Fx nombre="barrido" en={cortina} />
			<Fx nombre="clic" en={registro} />
			<Fx nombre="golpe" en={anio + 2} volumen={0.8} />
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ 4

export const E4Jornada: React.FC<P> = () => {
	const f = useCurrentFrame();
	const empieza = w('04-jornada', 'jornada');
	const ultimo = w('04-jornada', '40');
	return (
		<AbsoluteFill style={{background: marca.oscuro, fontFamily: FAMILIA, color: marca.claro, padding: '110px 180px'}}>
			<div style={{opacity: tramo(f, 0, 10, curvas.sale)}}>
				<Rotulo color={marca.tenue} tam={26}>
					Jornada máxima por semana
				</Rotulo>
			</div>
			<div style={{position: 'absolute', left: 180, bottom: 110}}>
				<Barras
					en={empieza}
					oscura
					maximo={48}
					base={30}
					alto={460}
					escalon={7}
					resalta={f >= ultimo ? 4 : undefined}
					datos={[
						{etiqueta: '2026', valor: 48},
						{etiqueta: '2027', valor: 46},
						{etiqueta: '2028', valor: 44},
						{etiqueta: '2029', valor: 42},
						{etiqueta: '2030', valor: 40},
					]}
				/>
			</div>
			<div style={{position: 'absolute', right: 180, top: 300, width: 520, opacity: tramo(f, ultimo, 12, curvas.sale)}}>
				<div style={{fontSize: 40, fontWeight: 500, color: marca.tenue}}>De 48 a 40 horas</div>
				<div style={{fontSize: 140, fontWeight: 700, lineHeight: 1.05, marginTop: 10}}>−8 h</div>
				<div style={{fontSize: 30, fontWeight: 500, color: marca.tenue, marginTop: 6}}>por semana, en cinco años</div>
			</div>
			{[0, 1, 2, 3, 4].map((i) => (
				<Fx key={i} nombre="tic" en={empieza + i * 7} volumen={0.8} />
			))}
			<Fx nombre="clic" en={ultimo} />
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ 5

export const E5Prueba: React.FC<P> = () => {
	const f = useCurrentFrame();
	const juicio = w('05-prueba', 'juicio');
	const sin = w('05-prueba', 'sin');
	const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
	return (
		<AbsoluteFill style={{...PAPEL, fontFamily: FAMILIA}}>
			<AbsoluteFill style={{background: marca.oscuro, clipPath: `inset(0 0 ${tramo(f, 0, 14, curvas.suave) * 100}% 0)`}} />
			<div style={{position: 'absolute', left: 150, top: 280, width: 760}}>
				<div style={{opacity: tramo(f, juicio - 4, 10, curvas.sale), display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26}}>
					<Icono nombre="balanza" tam={44} />
					<Rotulo tam={24}>En un juicio laboral</Rotulo>
				</div>
				<Titular
					en={w('05-prueba', 'empresa')}
					renglones={[
						{texto: 'La empresa debe', tam: 84, color: marca.tinta},
						{texto: 'probar la jornada.', tam: 84, color: marca.tinta},
					]}
				/>
				<div style={{marginTop: 30, fontSize: 24, color: marca.tenue, opacity: tramo(f, w('05-prueba', 'jornada') + 10, 10)}}>
					LFT, art. 784, fracción VIII
				</div>
			</div>
			<Tarjeta en={w('05-prueba', 'colaborador')} x={64} y={52} ancla="izq" ancho={560}>
				<Rotulo>Jornada de un colaborador</Rotulo>
				<div style={{marginTop: 12}}>
					{dias.map((d, i) => (
						<div
							key={d}
							style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${marca.linea}`, fontSize: 28}}
						>
							<span style={{fontWeight: 600}}>{d}</span>
							{f >= sin + i * 5 ? (
								<span style={{opacity: tramo(f, sin + i * 5, 6, curvas.sale)}}>
									<Chip estado="falta" tam={20}>
										Sin registro
									</Chip>
								</span>
							) : (
								<span style={{color: marca.tenue}}>—</span>
							)}
						</div>
					))}
				</div>
			</Tarjeta>
			<Fx nombre="clic" en={w('05-prueba', 'colaborador')} />
			{dias.map((_, i) => (
				<Fx key={i} nombre="tic" en={sin + i * 5} />
			))}
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ 6

export const E6Marca: React.FC<P> = () => {
	const f = useCurrentFrame();
	const canales: [string, 'telefono' | 'kiosco' | 'llamada', string][] = [
		['aplicacion', 'telefono', 'Aplicación'],
		['kiosco', 'kiosco', 'Kiosco'],
		['llamada', 'llamada', 'Llamada telefónica'],
	];
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{...PAPEL, clipPath: `inset(0 0 ${tramo(f, 0, 16, curvas.suave) * 100}% 0)`}} />
			<div style={{position: 'absolute', right: 70, bottom: 70, display: 'flex', gap: 18}}>
				{canales.map(([palabra, icono, texto]) => (
					<Canal key={palabra} en={w('06-marca', palabra)} icono={icono} texto={texto} />
				))}
			</div>
			<Fx nombre="barrido" en={0} />
			<Fx nombre="golpe" en={w('06-marca', 'puntualiza') + 6} volumen={0.6} />
			{SITIOS.map((_, i) => (
				<Fx key={i} nombre="clic" en={w('06-marca', 'registra') + i * 7 + 4} volumen={0.7} />
			))}
			{canales.map(([palabra]) => (
				<Fx key={palabra} nombre="tic" en={w('06-marca', palabra)} />
			))}
		</AbsoluteFill>
	);
};

const Canal: React.FC<{en: number; icono: 'telefono' | 'kiosco' | 'llamada'; texto: string}> = ({en, icono, texto}) => {
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
				padding: '18px 26px',
				background: marca.blanco,
				border: `1px solid ${marca.linea}`,
				borderRadius: 16,
				boxShadow: '0 18px 40px -20px rgba(20,20,20,.3)',
				fontFamily: FAMILIA,
				fontSize: 28,
				fontWeight: 600,
				color: marca.tinta,
			}}
		>
			<Icono nombre={icono} tam={36} />
			{texto}
		</div>
	);
};

// ------------------------------------------------------------------ 7

const MARCAS: [string, string, string][] = [
	['Entrada', '8:58 a. m.', '4f1a·c90e'],
	['Inicio de descanso', '2:00 p. m.', '9b27·03dd'],
	['Salida', '6:04 p. m.', 'e6c4·7a51'],
];

export const E7Evidencia: React.FC<P> = () => {
	const f = useCurrentFrame();
	const sellada = w('07-evidencia', 'sellada');
	const editar = w('07-evidencia', 'editar');
	const borrar = w('07-evidencia', 'borrar');
	const evidencia = w('07-evidencia', 'evidencia');
	const X = [190, 740, 1290];
	return (
		<AbsoluteFill style={{fontFamily: FAMILIA}}>
			<Cortina en={0} color={marca.fondo}>
				<AbsoluteFill style={PAPEL} />
			</Cortina>
			{MARCAS.slice(0, 2).map((_, i) => (
				<Trazo key={i} en={12 + i * 6} x1={X[i] + 440} y1={470} x2={X[i + 1]} y2={470} />
			))}
			{MARCAS.map(([tipo, hora, huella], i) => {
				const sello = tramo(f, sellada + i * 4, 8, curvas.sale);
				return (
					<Tarjeta key={tipo} en={8 + i * 6} x={(X[i] / 1920) * 100} y={43.5} ancla="izq" ancho={440} relleno="26px 30px">
						<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
							<Rotulo tam={17}>{tipo}</Rotulo>
							<span style={{opacity: sello, transform: `scale(${1.15 - 0.15 * sello})`, display: 'inline-flex'}}>
								<Icono nombre="candado" tam={26} color={estado.presente} />
							</span>
						</div>
						<div style={{fontSize: 64, fontWeight: 700, marginTop: 6}}>{hora}</div>
						<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10}}>
							<span style={{fontFamily: 'Consolas, monospace', fontSize: 20, color: marca.tenue}}>huella {huella}</span>
							<span style={{opacity: sello}}>
								<Chip estado="presente" tam={17}>
									Sellada
								</Chip>
							</span>
						</div>
					</Tarjeta>
				);
			})}
			<div style={{position: 'absolute', left: 0, right: 0, top: 650, display: 'flex', justifyContent: 'center', gap: 22}}>
				<Bloqueado en={editar} texto="Editar" />
				<Bloqueado en={borrar} texto="Borrar" />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 790,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 16,
					opacity: tramo(f, evidencia, 10, curvas.sale),
					transform: `translateY(${(1 - tramo(f, evidencia, 10, curvas.sale)) * 12}px)`,
				}}
			>
				<Icono nombre="escudo" tam={44} color={marca.tinta} />
				<span style={{fontSize: 46, fontWeight: 700, color: marca.tinta}}>Evidencia</span>
			</div>
			<Fx nombre="barrido" en={0} />
			{MARCAS.map((_, i) => (
				<Fx key={i} nombre="golpe" en={sellada + i * 4} volumen={0.55} />
			))}
			<Fx nombre="tic" en={editar} />
			<Fx nombre="tic" en={borrar} />
			<Fx nombre="clic" en={evidencia} />
		</AbsoluteFill>
	);
};

const Bloqueado: React.FC<{en: number; texto: string}> = ({en, texto}) => {
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

// ------------------------------------------------------------------ 8

export const E8Control: React.FC<P> = () => {
	const f = useCurrentFrame();
	const presentes = SITIOS.reduce((n, _, i) => n + conteo(i), 0);
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{...PAPEL, clipPath: `inset(0 0 ${tramo(f, 0, 16, curvas.suave) * 100}% 0)`}} />
			<Tarjeta en={w('08-control', 'real')} x={3.6} y={50} ancla="izq" ancho={430}>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
					<Rotulo>Asistencia de hoy</Rotulo>
					<Chip estado="presente" tam={16}>
						En vivo
					</Chip>
				</div>
				<Indicador en={w('08-control', 'llego')} rotulo="Presentes" valor={presentes} estado="presente" />
				<Indicador en={w('08-control', 'retardos')} rotulo="Retardos" valor={2} estado="retardo" />
				<Indicador en={w('08-control', 'faltas')} rotulo="Faltas" valor={2} estado="falta" />
				<Indicador en={w('08-control', 'horas')} rotulo="Horas extra de la semana" valor={9} sufijo=" h" />
			</Tarjeta>
			<Fx nombre="barrido" en={0} />
			<Fx nombre="clic" en={w('08-control', 'real')} />
			{(['llego', 'retardos', 'faltas', 'horas'] as const).map((p) => (
				<Fx key={p} nombre="tic" en={w('08-control', p)} />
			))}
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ 9

export const E9Cumplimiento: React.FC<P> = () => {
	const reglas = w('09-cumplimiento', 'reglas');
	const alertas = w('09-cumplimiento', 'alertas');
	const informe = w('09-cumplimiento', 'informe');
	const items: [number, string, string][] = [
		[reglas, 'Reglas de jornada 2027', 'Topes y descansos de la ley vigente'],
		[alertas, 'Alertas al momento', 'Retardos, faltas y salidas sin registrar'],
		[informe, 'Informe de inspección', 'Listo para descargar'],
	];
	return (
		<AbsoluteFill>
			<Tarjeta en={reglas - 4} x={3.6} y={44} ancla="izq" ancho={470}>
				<Rotulo>Cumplimiento</Rotulo>
				<div style={{marginTop: 10}}>
					{items.map(([en, titulo, detalle]) => (
						<Item key={titulo} en={en} titulo={titulo} detalle={detalle} />
					))}
				</div>
			</Tarjeta>
			<Aviso en={alertas + 2} titulo="Retardo · Centro Sur" detalle="Entró a las 9:14 a. m." estado="retardo" y={12} />
			<Aviso en={alertas + 12} titulo="Falta · Centro Norte" detalle="Sin marcas en su turno" estado="falta" y={27} />
			<Tarjeta en={informe + 4} x={3.6} y={84} ancla="izq" ancho={470} relleno="22px 26px">
				<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
					<Icono nombre="documento" tam={46} />
					<div style={{flex: 1}}>
						<div style={{fontSize: 24, fontWeight: 700, whiteSpace: 'nowrap'}}>Informe de inspección</div>
						<div style={{fontSize: 19, color: marca.secundario, marginTop: 2}}>PDF · las marcas del periodo</div>
					</div>
					<Chip estado="presente" tam={17}>
						Listo
					</Chip>
				</div>
			</Tarjeta>
			<Fx nombre="clic" en={reglas - 4} />
			<Fx nombre="aviso" en={alertas + 2} volumen={0.8} />
			<Fx nombre="aviso" en={alertas + 12} volumen={0.6} />
			<Fx nombre="clic" en={informe + 4} />
		</AbsoluteFill>
	);
};

const Item: React.FC<{en: number; titulo: string; detalle: string}> = ({en, titulo, detalle}) => {
	const v = useEntrada(en);
	return (
		<div
			style={{
				opacity: Math.max(0.25, v),
				display: 'flex',
				gap: 18,
				alignItems: 'center',
				padding: '16px 0',
				borderTop: `1px solid ${marca.linea}`,
			}}
		>
			<div style={{width: 40, height: 40}}>
				<Confirmacion en={en} />
			</div>
			<div>
				<div style={{fontSize: 27, fontWeight: 700}}>{titulo}</div>
				<div style={{fontSize: 20, color: marca.secundario, marginTop: 2}}>{detalle}</div>
			</div>
		</div>
	);
};

// ------------------------------------------------------------------ 10

export const E10Cierre: React.FC<P> = () => {
	const f = useCurrentFrame();
	const fin = w('10-cierre', 'cumplir', 1, true) + 22;
	const p = tramo(f, fin, 18, curvas.sale);
	const q = tramo(f, fin + 10, 16, curvas.sale);
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: marca.oscuro, clipPath: `inset(${(1 - p) * 100}% 0 0 0)`}} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FAMILIA, opacity: q}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 40, transform: `translateY(${(1 - q) * 20}px)`}}>
					<Isotipo tam={130} tinta={marca.claro} giro={(1 - q) * -60} />
					<div>
						<div style={{fontSize: 120, fontWeight: 700, color: marca.claro, lineHeight: 1}}>Puntualiza</div>
						<div style={{fontSize: 38, fontWeight: 500, color: marca.tenue, marginTop: 12}}>Control de asistencia con evidencia.</div>
					</div>
				</div>
			</AbsoluteFill>
			<Fx nombre="barrido" en={fin} />
			<Fx nombre="golpe" en={fin + 12} volumen={0.5} />
		</AbsoluteFill>
	);
};
