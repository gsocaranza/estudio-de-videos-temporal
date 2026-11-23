import type {Guion, Palabras} from '../kit/linea';
import {usaVoz} from '../videos/registro-de-jornada/tiempo';
import duraciones from '../../public/registro-bolanos/duraciones.json';
import guion from '../../public/registro-bolanos/guion.json';
import palabras from '../../public/registro-bolanos/palabras.json';

/**
 * La voz de la versión de Bolaños: más ágil que la del video original (Oscar,
 * 2026-10-16: «¿no se puede acelerar un poquitín? lo siento muy lento»), con
 * `velocidad_voz` 1.28 en vez de 1.15 y las pausas entre escenas más cortas.
 * Las escenas son las del original y se anclan a esta voz por `usaVoz()`.
 */
usaVoz(guion as Guion, duraciones, palabras as Palabras, {
	'03-ley': 12,
	'04-jornada': 12,
	'07-evidencia': 10,
	'10-cierre': 60,
	'11-bolanos': 84,
});
