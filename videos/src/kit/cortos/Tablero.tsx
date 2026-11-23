import React from 'react';
import {Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fx} from '../Sonido';

/**
 * El año en tablero mecánico: un clip de HyperFrames (`anio-flap`, derivado
 * del bloque `split-flap-board`) renderizado con alfa por
 * herramientas/hyperframes.sh. Antes de `en` se ve su primer cuadro, durante
 * 48 cuadros gira, y después se queda en el último: así una escena puede
 * empezar con el año anterior y la siguiente heredar el que quedó.
 */
export const LARGO_TABLERO = 48;

export const Tablero: React.FC<{clip: string; en: number; top: number; escala?: number; sonido?: boolean}> = ({
	clip,
	en,
	top,
	escala = 1,
	sonido = true,
}) => {
	const f = useCurrentFrame();
	const video = <OffthreadVideo src={staticFile(`clips/${clip}.webm`)} transparent muted style={{width: 720, height: 260}} />;
	return (
		<div style={{position: 'absolute', top, left: 540 - 360, width: 720, height: 260, transform: `scale(${escala})`, transformOrigin: '50% 0%'}}>
			{f < en ? (
				<Freeze frame={0}>{video}</Freeze>
			) : f < en + LARGO_TABLERO ? (
				<Sequence from={en} durationInFrames={LARGO_TABLERO} layout="none">
					{video}
				</Sequence>
			) : (
				<Freeze frame={LARGO_TABLERO - 1}>{video}</Freeze>
			)}
			{/* el traqueteo de las hojas: tics que se espacian al asentarse */}
			{sonido && [0, 2, 4, 6, 8, 11, 14, 18, 23].map((k) => <Fx key={k} nombre="tic" en={en + k} volumen={0.9} />)}
		</div>
	);
};
