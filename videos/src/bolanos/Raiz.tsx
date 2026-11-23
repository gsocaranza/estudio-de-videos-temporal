import React from 'react';
import {Composition} from 'remotion';
import {FPS} from '../kit/linea';
import {linea, RegistroBolanos} from '../videos/registro-bolanos/Video';
import {linea as lineaAmbar, RutaAmbar} from '../videos/ruta-ambar/Video';

/** Los videos con la marca de Bolaños Abogados. */
export const RaizBolanos: React.FC = () => (
	<>
		<Composition
			id="registro-bolanos"
			component={RegistroBolanos}
			durationInFrames={linea.total}
			fps={FPS}
			width={1920}
			height={1080}
			defaultProps={{subtitulos: false}}
		/>
		<Composition id="ruta-ambar" component={RutaAmbar} durationInFrames={lineaAmbar.total} fps={FPS} width={1920} height={1080} />
	</>
);
