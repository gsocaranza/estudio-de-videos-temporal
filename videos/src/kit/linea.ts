/**
 * La línea de tiempo de un video sale de su voz: cada escena dura lo que su
 * narración más un respiro antes y una cola después. Nada se escribe en
 * segundos a mano: lo que tiene que coincidir con una frase se ancla a la
 * palabra (`palabra()`), con las marcas que Whisper sacó en palabras.json.
 */
export const FPS = 30;
/** cuadros de silencio antes de que la voz empiece en cada escena */
export const RESPIRO = 12;
/** cuadros después de que la voz termina, por omisión */
export const COLA = 16;

export type Guion = {titulo: string; escenas: {id: string; texto: string; subtitulo?: string}[]};
export type Palabras = Record<string, {palabras: {p: string; ini: number; fin: number}[]}>;

/** `subtitulo` es lo que se lee en pantalla cuando no es igual a lo que se dice («2027» y no «dos mil veintisiete»). */
export type Escena = {id: string; texto: string; subtitulo?: string; voz: number; duracion: number; desde: number; respiro: number};

/**
 * `ritmo` cambia el respiro y la cola por omisión de todo el video: los cortos
 * verticales van casi pegados (`{respiro: 3, cola: 4}`) porque en redes una
 * pausa de un segundo entre frases es por donde se desliza al siguiente.
 * herramientas/contactos.py lee esos dos números de la llamada.
 */
export const arma = (
	guion: Guion,
	duraciones: Record<string, number>,
	colas: Record<string, number> = {},
	ritmo: {respiro?: number; cola?: number} = {},
): {escenas: Escena[]; total: number} => {
	const respiro = ritmo.respiro ?? RESPIRO;
	let desde = 0;
	const escenas = guion.escenas.map((e) => {
		const voz = duraciones[e.id];
		if (voz === undefined) throw new Error(`Falta la voz de ${e.id}: corre herramientas/narra.py`);
		const duracion = respiro + Math.ceil(voz * FPS) + (colas[e.id] ?? ritmo.cola ?? COLA);
		const escena = {...e, voz, duracion, desde, respiro};
		desde += duracion;
		return escena;
	});
	return {escenas, total: desde};
};

const normal = (t: string) =>
	t
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9ñ]/g, '');

/**
 * El cuadro (dentro de la escena) en que empieza la palabra `buscada`; la
 * `n`-ésima si se repite. Si no está, truena: un guion cambiado tiene que
 * romper el render, no desincronizarlo en silencio.
 */
export const enPalabra = (palabras: Palabras, respiro = RESPIRO) => (id: string, buscada: string, n = 1, fin = false) => {
	const lista = palabras[id]?.palabras ?? [];
	const objetivo = normal(buscada);
	let vistas = 0;
	for (const w of lista) {
		if (normal(w.p).startsWith(objetivo)) {
			vistas++;
			if (vistas === n) return respiro + Math.round((fin ? w.fin : w.ini) * FPS);
		}
	}
	throw new Error(`«${buscada}» (${n}) no está en la voz de ${id}: ${lista.map((w) => w.p).join(' ')}`);
};
