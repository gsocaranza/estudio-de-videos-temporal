import React from 'react';
import {Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';

/**
 * El audio: voz, efectos y música. Las tres capas a niveles fijos para que
 * todos los videos suenen igual: la voz manda, los efectos subrayan y la
 * música queda muy atrás (en el video de referencia, ~18 dB por debajo).
 */
export const NIVEL = {voz: 1, efecto: 0.32, musica: 0.13};

export type Efecto =
	// estilo maqueta
	| 'pop' | 'desliza' | 'toque' | 'exito' | 'error' | 'sello' | 'papel' | 'rebobinar' | 'reloj'
	// estilo corporativo
	| 'clic' | 'barrido' | 'aviso' | 'golpe' | 'tic'
	// cortos verticales
	| 'trazo' | 'subida'
	// motion graphics (R1 de la serie de RH)
	| 'whoosh' | 'zas' | 'impacto' | 'brillo' | 'tecla' | 'moneda'
	// transiciones con variantes (R4 y R5): se alternan para no repetir
	| 'escaner-1' | 'escaner-2' | 'escaner-3' | 'orbita-1' | 'orbita-2' | 'orbita-3'
	| 'toc-1' | 'toc-2' | 'toc-3' | 'regla-1' | 'regla-2' | 'regla-3'
	// R11, R6 y R9
	| 'riel-1' | 'riel-2' | 'riel-3' | 'ficha-1' | 'ficha-2' | 'ficha-3'
	| 'hoja-1' | 'hoja-2' | 'hoja-3' | 'goma-1' | 'goma-2' | 'goma-3'
	| 'soplo-1' | 'soplo-2' | 'soplo-3'
	// R12 y R13
	| 'zum-1' | 'zum-2' | 'zum-3' | 'tendedero-1' | 'tendedero-2' | 'tendedero-3' | 'pinza-1' | 'pinza-2' | 'pinza-3'
	// R14 y R15
	| 'pasos-1' | 'pasos-2' | 'pasos-3' | 'huella-1' | 'huella-2' | 'huella-3' | 'arranque-1' | 'arranque-2' | 'arranque-3'
	// R16
	| 'cobro-1' | 'cobro-2' | 'cobro-3' | 'calle-1' | 'calle-2' | 'calle-3'
	// R17
	| 'mesa-1' | 'mesa-2' | 'mesa-3'
	// R18
	| 'pulso-1' | 'pulso-2' | 'pulso-3'
	// noviembre (docs/cortos-noviembre.md)
	| 'buzon-1' | 'buzon-2' | 'buzon-3'
	| `${'charola' | 'puerta' | 'arena' | 'platillo' | 'domino' | 'tijera' | 'caja' | 'fichero' | 'rollo' | 'etiqueta' | 'agua' | 'carril' | 'casa' | 'gente' | 'formulario' | 'picaporte' | 'via' | 'hielo' | 'pieza' | 'vibra' | 'cuchilla'}-${1 | 2 | 3}`;

/** Un efecto en el cuadro `en` de la escena. */
export const Fx: React.FC<{nombre: Efecto; en: number; volumen?: number}> = ({nombre, en, volumen = 1}) => (
	<Sequence from={en} layout="none" name={`fx ${nombre}`}>
		<Audio src={staticFile(`sonidos/${nombre}.wav`)} volume={NIVEL.efecto * volumen} />
	</Sequence>
);

/** La voz de una escena. `en`: cuadros de respiro antes de que hable. */
export const Voz: React.FC<{video: string; id: string; en: number}> = ({video, id, en}) => (
	<Sequence from={en} layout="none" name={`voz ${id}`}>
		<Audio src={staticFile(`${video}/voz/${id}.wav`)} volume={NIVEL.voz} />
	</Sequence>
);

/** La música de fondo de todo el video, con entrada y salida suaves. */
export const Musica: React.FC<{pista?: 'musica' | 'musica-corporativa'}> = ({pista = 'musica'}) => {
	const {durationInFrames, fps} = useVideoConfig();
	return (
		<Audio
			src={staticFile(`sonidos/${pista}.wav`)}
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
