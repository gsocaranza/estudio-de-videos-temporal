import {arma, enPalabra, type Guion, type Palabras} from '../../kit/linea';
import duraciones from '../../../public/registro-de-jornada/duraciones.json';
import guion from '../../../public/registro-de-jornada/guion.json';
import palabras from '../../../public/registro-de-jornada/palabras.json';

/**
 * La línea de tiempo de «El registro de jornada». Aparte de Video.tsx porque
 * el mundo 3D es UNA capa continua de todo el video (como en la referencia, la
 * cámara viaja sin cortes) y necesita anclarse a palabras de cualquier escena:
 * `G('06-marca', 'puntualiza')` es el cuadro del video, no de la escena.
 *
 * `linea` y `w` son enlaces vivos: una versión del video con otra voz (la de
 * Bolaños Abogados, más ágil) llama a `usaVoz()` desde su punto de entrada,
 * antes de montar nada, y las mismas escenas se anclan a SU voz.
 */
export const VIDEO = 'registro-de-jornada';

export let linea = arma(guion as Guion, duraciones, {
	'03-ley': 22,
	'04-jornada': 22,
	'07-evidencia': 20,
	'10-cierre': 84,
});

let anclas = enPalabra(palabras as Palabras);

/** Cuadro, dentro de su escena, en que empieza una palabra. */
export const w = (id: string, palabra: string, n = 1, fin = false) => anclas(id, palabra, n, fin);

/** Cambia la voz que dimensiona el video (otra pista, otro ritmo, otras colas). */
export const usaVoz = (g: Guion, d: Record<string, number>, p: Palabras, colas: Record<string, number>) => {
	linea = arma(g, d, colas);
	anclas = enPalabra(p);
};

/** Cuadro del video en que empieza la escena. */
export const inicio = (id: string) => {
	const e = linea.escenas.find((x) => x.id === id);
	if (!e) throw new Error(`No hay escena ${id}`);
	return e.desde;
};

/** Cuadro del video en que empieza una palabra de una escena. */
export const G = (id: string, palabra: string, n = 1, fin = false) => inicio(id) + w(id, palabra, n, fin);
