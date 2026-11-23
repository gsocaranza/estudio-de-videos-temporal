import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {FAMILIA} from '../fuentes';
import {marca} from '../paleta';

/**
 * El texto de la serie de cortos: el de «La sal» (R1), que es la vara.
 *
 * Por qué está aquí y no en un corto (supervisor, 2026-10-21: «los textos no se
 * deben sentir tan estáticos… revisa cómo hiciste La sal y La carta y
 * documenta para que te salgan así todos los siguientes»): el texto es parte
 * del MARCO común de la serie, como el fondo liso y el isotipo; la dirección de
 * arte de cada corto va en sus imágenes y su transición, no en sus letras.
 *
 * Lo que lo hace vivo, y por eso no se cambia de un corto a otro:
 * - cada palabra sube desde detrás de su máscara con un resorte (amortiguación
 *   14, masa 0.6), una tras otra cada 3 cuadros;
 * - `golpe`: un pulso de escala (+7 %) en el cuadro de la palabra clave;
 * - `resalta`: un bloque negro barre detrás de UNA palabra y la deja en blanco;
 * - mediano: 84–96 px, una cifra sola hasta 140 (se ajusta solo si un renglón no
 *   cabe en 840 px). A 100–150 px una frase llena la pantalla y satura (R4 y R5 v3);
 * - nunca quieto: mientras está, crece muy despacio (deriva, hasta +3 %);
 * - sale rápido (8 cuadros) o se va con el plano.
 * Nada de cajas, placas, líneas de escáner ni aparecer de golpe.
 */
const resorte = (f: number, en: number, fps: number) => spring({frame: f - en, fps, config: {damping: 14, mass: 0.6, stiffness: 140}});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** La palabra sin puntuación, para compararla con la que se resalta: «3,569» = «3569», «−7.5» = «−7.5». */
const limpia = (p: string) => p.replace(/[.,:;¿?¡!…]/g, '');

export const Cinetico: React.FC<{
	/** « / » parte renglones */
	texto: string;
	en: number;
	top: number;
	tam?: number;
	peso?: number;
	color?: string;
	cada?: number;
	golpe?: number;
	resalta?: {palabra: string; en: number};
	sale?: number;
	alinear?: 'center' | 'left';
	/** centro horizontal y ancho útil, para textos que van a un lado */
	x?: number;
	ancho?: number;
	deriva?: boolean;
}> = ({texto, en, top, tam = 88, peso = 700, color = marca.tinta, cada = 3, golpe, resalta, sale, alinear = 'center', x = 540, ancho = 840, deriva = true}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (f < en - 1) return null;
	const q = sale === undefined ? 0 : interpolate(f, [sale, sale + 8], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	if (q >= 1) return null;
	const renglones = texto.split(' / ');
	const largo = Math.max(...renglones.map((r) => r.length));
	const t = largo * tam * 0.55 > ancho ? (tam * ancho) / (largo * 0.55 * tam) : tam;
	const pulso = golpe === undefined ? 1 : 1 + 0.07 * Math.max(0, 1 - Math.abs(f - golpe - 2) / 6);
	const crece = deriva ? 1 + 0.03 * Math.min(1, Math.max(0, f - en) / 120) : 1;
	let k = 0;
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: x - ancho / 2,
				width: ancho,
				textAlign: alinear,
				transform: `scale(${pulso * crece}) translateY(${-q * 20}px)`,
				transformOrigin: 'center top',
				opacity: 1 - q,
			}}
		>
			{renglones.map((r, i) => (
				<div key={i} style={{display: 'flex', flexWrap: 'wrap', justifyContent: alinear === 'center' ? 'center' : 'flex-start', gap: `0 ${t * 0.24}px`}}>
					{r.split(' ').map((palabra, j) => {
						const idx = k++;
						const p = resorte(f, en + idx * cada, fps);
						const esRes = resalta && limpia(palabra) === limpia(resalta.palabra);
						const r2 = esRes ? interpolate(f, [resalta!.en, resalta!.en + 9], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}) : 0;
						return (
							// el bloque del resaltado sobresale de la palabra con margen negativo: así no
							// ocupa sitio y no deja un espacio doble antes de que aparezca («mejor  jefe?»,
							// control de calidad de R4 v4)
							<span
								key={j}
								style={{
									display: 'inline-block',
									overflow: 'hidden',
									lineHeight: 1.08,
									paddingBottom: t * 0.06,
									...(esRes && {
										padding: `0 ${t * 0.12}px ${t * 0.06}px`,
										margin: `0 ${-t * 0.12}px`,
										backgroundImage: `linear-gradient(${marca.oscuro}, ${marca.oscuro})`,
										backgroundRepeat: 'no-repeat',
										backgroundSize: `${r2 * 100}% ${p * 100}%`,
										backgroundPosition: 'left bottom',
									}),
								}}
							>
								<span
									style={{
										display: 'inline-block',
										transform: `translateY(${(1 - p) * 110}%)`,
										fontFamily: FAMILIA,
										fontWeight: peso,
										fontSize: t,
										letterSpacing: -t * 0.025,
										color: r2 > 0.5 ? marca.blanco : color,
									}}
								>
									{palabra}
								</span>
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};
