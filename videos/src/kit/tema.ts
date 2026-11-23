import {iso} from './corporativo/Iso';
import {usaFuentes, type ArchivoDeFuente} from './fuentes';
import {estado, marca} from './paleta';

/**
 * Un tema: los colores y las fuentes de otra marca sobre el mismo video.
 *
 * Nació el 2026-10-16 para que Bolaños Abogados distribuya «El registro de
 * jornada» con su identidad. No se duplica ninguna escena: un video con tema
 * tiene su propio punto de entrada (p. ej. `src/bolanos/index.ts`) que
 * importa su tema ANTES que nada; así los objetos de la paleta ya traen los
 * colores del tema cuando el resto de los módulos los lee. Cada entrada es un
 * empaquetado aparte, de modo que el tema no se cuela en los demás videos.
 */
export type Tema = {
	nombre: string;
	marca: Partial<Record<keyof typeof marca, string>>;
	iso?: Partial<Record<keyof typeof iso, string>>;
	estado?: Partial<Record<keyof typeof estado, string>>;
	fuentes?: {archivos: ArchivoDeFuente[]; familia: string; titulos?: string};
};

export const aplicaTema = (t: Tema) => {
	Object.assign(marca as Record<string, string>, t.marca);
	if (t.iso) Object.assign(iso as Record<string, string>, t.iso);
	if (t.estado) Object.assign(estado as Record<string, string>, t.estado);
	if (t.fuentes) usaFuentes(t.fuentes.archivos, t.fuentes.familia, t.fuentes.titulos);
};
