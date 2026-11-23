import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {useFuentes} from '../../kit/fuentes';
import {Subtitulo} from '../../kit/Graficos';
import {RESPIRO} from '../../kit/linea';
import {marca} from '../../kit/paleta';
import {Musica, Voz} from '../../kit/Sonido';
import {
	E10Cierre,
	E1Hoy,
	E2Dispersa,
	E3Ley,
	E4Jornada,
	E5Prueba,
	E6Marca,
	E7Evidencia,
	E8Control,
	E9Cumplimiento,
} from './Escenas';
import {Mundo} from './Mundo';
import {linea, VIDEO} from './tiempo';

/**
 * «El registro de jornada» (2026-10-16): el primer video del estilo
 * corporativo. Para empresas: el problema de hoy, la ley que viene y lo que
 * Puntualiza resuelve. Debajo corre el mundo 3D sin cortes; encima, cada
 * escena pone su interfaz y sus efectos.
 */
export {linea};

const ESCENAS: Record<string, React.FC<{d: number}>> = {
	'01-hoy': E1Hoy,
	'02-dispersa': E2Dispersa,
	'03-ley': E3Ley,
	'04-jornada': E4Jornada,
	'05-prueba': E5Prueba,
	'06-marca': E6Marca,
	'07-evidencia': E7Evidencia,
	'08-control': E8Control,
	'09-cumplimiento': E9Cumplimiento,
	'10-cierre': E10Cierre,
};

export const RegistroDeJornada: React.FC<{subtitulos: boolean}> = ({subtitulos}) => {
	useFuentes();
	return (
		<AbsoluteFill style={{background: marca.fondo}}>
			<Mundo />
			{linea.escenas.map((e) => {
				const Escena = ESCENAS[e.id];
				return (
					<Sequence key={e.id} from={e.desde} durationInFrames={e.duracion} name={e.id}>
						{/* encima de las etiquetas del mundo (Html de drei, zIndex ≤ 20) */}
						<AbsoluteFill style={{zIndex: 30}}>
							<Escena d={e.duracion} />
						</AbsoluteFill>
						<Voz video={VIDEO} id={e.id} en={RESPIRO} />
						{subtitulos && (
							<Sequence from={RESPIRO} layout="none">
								<Subtitulo texto={e.texto} />
							</Sequence>
						)}
					</Sequence>
				);
			})}
			<Musica pista="musica-corporativa" />
		</AbsoluteFill>
	);
};
