import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {FAMILIA} from '../../kit/fuentes';
import {Montaje, type PropsEscena} from '../../kit/Montaje';
import {curvas, tramo} from '../../kit/movimiento';
import {Fx} from '../../kit/Sonido';
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
} from '../registro-de-jornada/Escenas';
import {Mundo} from '../registro-de-jornada/Mundo';
import {linea} from '../registro-de-jornada/tiempo';

/**
 * «El registro de jornada» con la marca de Bolaños Abogados (2026-10-16), para
 * que Oscar lo distribuya. Las escenas son las mismas del video original; lo
 * que cambia es el tema (src/bolanos/tema.ts: colores y fuentes) y el final,
 * que agrega su logotipo con la voz «Con el respaldo de Bolaños Abogados».
 *
 * Se renderiza con su propia entrada: ENTRADA=src/bolanos/index.ts.
 */
// la línea de tiempo es la del original con la voz de esta versión (src/bolanos/voz.ts)
export {linea};

/** El logotipo de Bolaños Abogados, armándose: la raya dorada, el monograma y el nombre. */
export const E11Bolanos: React.FC<PropsEscena> = ({f}) => {
	const fondo = tramo(f, 0, 14, curvas.sale);
	const raya = tramo(f, 8, 16, curvas.sale);
	const mono = tramo(f, 18, 18, curvas.sale);
	const nombre = tramo(f, 24, 18, curvas.sale);
	const leyenda = tramo(f, 4, 14, curvas.sale);
	const ALTO = 300;
	const esc = ALTO / 295;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: '#41474F', opacity: fondo}} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FAMILIA}}>
				<div style={{opacity: leyenda, transform: `translateY(${(1 - leyenda) * 12}px)`, fontSize: 24, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D7A55A', marginBottom: 56}}>
					Con el respaldo de
				</div>
				<div style={{display: 'flex', alignItems: 'center', height: ALTO}}>
					<div style={{width: 320 * esc, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end'}}>
						<Img
							src={staticFile('marcas/bolanos/monograma.png')}
							style={{height: ALTO, opacity: mono, transform: `translateX(${(1 - mono) * 120}px)`}}
						/>
					</div>
					<div style={{width: 8 * esc, height: ALTO, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
						<Img src={staticFile('marcas/bolanos/raya.png')} style={{height: ALTO * raya, width: 5 * esc}} />
					</div>
					<div style={{width: 685 * esc, overflow: 'hidden'}}>
						<Img
							src={staticFile('marcas/bolanos/nombre.png')}
							style={{height: ALTO, opacity: nombre, transform: `translateX(${(1 - nombre) * -140}px)`}}
						/>
					</div>
				</div>
			</AbsoluteFill>
			<Fx nombre="barrido" en={6} volumen={0.6} />
			<Fx nombre="golpe" en={30} volumen={0.6} />
		</AbsoluteFill>
	);
};

export const RegistroBolanos: React.FC<{subtitulos: boolean}> = ({subtitulos}) => (
	<Montaje
		video="registro-bolanos"
		escenas={linea.escenas}
		subtitulos={subtitulos}
		fondo={<Mundo />}
		componentes={{
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
			'11-bolanos': E11Bolanos,
		}}
	/>
);

