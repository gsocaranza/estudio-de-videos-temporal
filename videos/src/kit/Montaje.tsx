import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {useFuentes} from './fuentes';
import {Subtitulo} from './Graficos';
import {RESPIRO, type Escena} from './linea';
import {marca} from './paleta';
import {Musica, Voz} from './Sonido';

/**
 * El montaje de un video de escenas: cada escena en su Sequence, con su voz,
 * su cuadro local (`f`) y su duración (`d`) por props, la música debajo de
 * todo y los subtítulos si se piden. Lo que cambia entre videos son las
 * escenas; esto es igual en todos.
 *
 * `fondo` es una capa que corre por debajo de todo el video sin cortes (el
 * mundo isométrico del estilo corporativo); las escenas van encima, en una
 * capa con zIndex 30 para quedar sobre sus etiquetas.
 */
export type PropsEscena = {f: number; d: number};

const ConCuadro: React.FC<{Escena: React.FC<PropsEscena>; d: number}> = ({Escena, d}) => {
	const f = useCurrentFrame();
	return <Escena f={f} d={d} />;
};

export const Montaje: React.FC<{
	video: string;
	escenas: Escena[];
	componentes: Record<string, React.FC<PropsEscena>>;
	subtitulos: boolean;
	pista?: 'musica' | 'musica-corporativa';
	fondo?: React.ReactNode;
}> = ({video, escenas, componentes, subtitulos, pista = 'musica-corporativa', fondo}) => {
	useFuentes();
	return (
		<AbsoluteFill style={{background: marca.fondo}}>
			{fondo}
			{escenas.map((e) => {
				const C = componentes[e.id];
				if (!C) throw new Error(`Falta el componente de la escena ${e.id}`);
				return (
					<Sequence key={e.id} from={e.desde} durationInFrames={e.duracion} name={e.id}>
						<AbsoluteFill style={{zIndex: 30}}>
							<ConCuadro Escena={C} d={e.duracion} />
						</AbsoluteFill>
						<Voz video={video} id={e.id} en={RESPIRO} />
						{subtitulos && (
							<Sequence from={RESPIRO} layout="none">
								<AbsoluteFill style={{zIndex: 40}}>
									<Subtitulo texto={e.subtitulo ?? e.texto} />
								</AbsoluteFill>
							</Sequence>
						)}
					</Sequence>
				);
			})}
			<Musica pista={pista} />
		</AbsoluteFill>
	);
};
