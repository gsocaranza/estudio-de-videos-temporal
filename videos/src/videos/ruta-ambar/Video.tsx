import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFuentes} from '../../kit/fuentes';
import {RESPIRO} from '../../kit/linea';
import type {PropsEscena} from '../../kit/Montaje';
import {marca} from '../../kit/paleta';
import {NIVEL, Voz} from '../../kit/Sonido';
import {
	E01Saludo,
	E02Mapa,
	E03Contratos,
	E04Alfa,
	E05Demo,
	E06Politica,
	E07Implementacion,
	E08Reportes,
	E09Entrega,
	E10Inicio,
	E11Reglamento,
	E12Ley,
	E13Necesitamos,
	E14Noviembre,
	E15Expedientes,
	E16Espacio,
	E17Canal,
	E18Arranque,
} from './Escenas';
import {LineaDeTiempo} from './LineaDeTiempo';
import {Mundo} from './Mundo';
import {Reloj} from './Reloj';
import {linea, VIDEO} from './tiempo';

/**
 * «La ruta de la transición · Logística Ámbar» (2026-11-06), con la marca de
 * Bolaños Abogados: la hoja de ruta de la transición de Recursos Humanos y el
 * puesta en marcha de Puntualiza, para que Oscar se la mande a Ámbar con su
 * correo. La v2 (2026-11-09) sale de la hoja de ruta del 9 de noviembre: Ámbar
 * ya adoptó Puntualiza, el piloto pasa a periodo de implementación y el inicio
 * formal se adelanta al 1 de diciembre.
 * Debajo corre el mundo isométrico sin cortes; en medio, cada escena; encima,
 * la línea del tiempo de los seis pasos.
 *
 * Se renderiza con la entrada de Bolaños: ENTRADA=src/bolanos/index.ts.
 */
export {linea};

const ESCENAS: Record<string, React.FC<PropsEscena>> = {
	'01-saludo': E01Saludo,
	'02-mapa': E02Mapa,
	'03-contratos': E03Contratos,
	'04-alfa': E04Alfa,
	'05-demo': E05Demo,
	'06-politica': E06Politica,
	'07-implementacion': E07Implementacion,
	'08-reportes': E08Reportes,
	'09-entrega': E09Entrega,
	'10-inicio': E10Inicio,
	'11-reglamento': E11Reglamento,
	'12-ley': E12Ley,
	'13-necesitamos': E13Necesitamos,
	'14-noviembre': E14Noviembre,
	'15-expedientes': E15Expedientes,
	'16-espacio': E16Espacio,
	'17-canal': E17Canal,
	'18-arranque': E18Arranque,
};

const ConCuadro: React.FC<{Escena: React.FC<PropsEscena>; d: number}> = ({Escena, d}) => {
	const f = useCurrentFrame();
	return <Escena f={f} d={d} />;
};

/** La corporativa a la medida (168 s): `python herramientas/sonidos.py musica-corporativa musica-ruta-ambar 168`. */
const Musica: React.FC = () => {
	const {durationInFrames, fps} = useVideoConfig();
	return (
		<Audio
			src={staticFile('sonidos/musica-ruta-ambar.wav')}
			volume={(f) =>
				NIVEL.musica *
				interpolate(f, [0, fps, durationInFrames - fps * 2.5, durationInFrames - 2], [0, 1, 1, 0], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
			}
		/>
	);
};

export const RutaAmbar: React.FC = () => {
	useFuentes();
	const F = useCurrentFrame();
	return (
		<Reloj.Provider value={F}>
			<AbsoluteFill style={{background: marca.fondo}}>
				<Mundo />
				{linea.escenas.map((e) => {
					const Escena = ESCENAS[e.id];
					if (!Escena) throw new Error(`Falta el componente de la escena ${e.id}`);
					return (
						<Sequence key={e.id} from={e.desde} durationInFrames={e.duracion} name={e.id}>
							<AbsoluteFill style={{zIndex: 30}}>
								<ConCuadro Escena={Escena} d={e.duracion} />
							</AbsoluteFill>
							<Voz video={VIDEO} id={e.id} en={RESPIRO} />
						</Sequence>
					);
				})}
				<LineaDeTiempo />
				<Musica />
			</AbsoluteFill>
		</Reloj.Provider>
	);
};
