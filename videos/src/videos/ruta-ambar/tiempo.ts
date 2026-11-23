import {arma, enPalabra, type Guion, type Palabras} from '../../kit/linea';
import duraciones from '../../../public/ruta-ambar/duraciones.json';
import guion from '../../../public/ruta-ambar/guion.json';
import palabras from '../../../public/ruta-ambar/palabras.json';

/**
 * La línea de tiempo de «La ruta de la transición · Logística Ámbar»
 * (2026-11-06). Aparte de Video.tsx porque el mundo isométrico y la línea del
 * tiempo de los seis pasos son capas de TODO el video y se anclan a palabras
 * de cualquier escena: `G('07-implementacion', 'implementación')` es el cuadro del video.
 */
export const VIDEO = 'ruta-ambar';

export const linea = arma(guion as Guion, duraciones, {
	'01-saludo': 14,
	'02-mapa': 20,
	'03-contratos': 26,
	'05-demo': 26,
	'06-politica': 24,
	'07-implementacion': 26,
	'08-reportes': 24,
	'09-entrega': 26,
	'10-inicio': 26,
	'11-reglamento': 26,
	'12-ley': 26,
	'16-espacio': 20,
	'18-arranque': 96,
});

const anclas = enPalabra(palabras as Palabras);

/** Cuadro, dentro de su escena, en que empieza una palabra. */
export const w = (id: string, palabra: string, n = 1, fin = false) => anclas(id, palabra, n, fin);

/** Cuadro del video en que empieza la escena. */
export const inicio = (id: string) => {
	const e = linea.escenas.find((x) => x.id === id);
	if (!e) throw new Error(`No hay escena ${id}`);
	return e.desde;
};

/** Cuadro del video en que empieza una palabra de una escena. */
export const G = (id: string, palabra: string, n = 1, fin = false) => inicio(id) + w(id, palabra, n, fin);
