import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * Las fuentes de los videos. Por omisión, TASA Orbiter, la de la marca (los
 * mismos TTF que usan los PDF), para el texto y para los titulares.
 *
 * Un tema de otra marca (ver tema.ts) las cambia con `usaFuentes()` ANTES de
 * que se monte nada: `FAMILIA` y `FAMILIA_TITULOS` son enlaces vivos (`export
 * let`), así que los componentes leen el valor del tema al pintar.
 *
 * Se espera a que carguen antes de pintar el primer cuadro: sin el
 * delayRender los primeros cuadros saldrían con la fuente de respaldo.
 */
export type ArchivoDeFuente = {familia: string; archivo: string; peso: string; estilo?: string};

let ARCHIVOS: ArchivoDeFuente[] = [
	...[400, 500, 600, 700].map((peso) => ({
		familia: 'TASA Orbiter',
		archivo: `fuentes/tasa-orbiter-${peso}.ttf`,
		peso: String(peso),
	})),
	// la monoespaciada de la marca: metadatos, años y fuentes en los cortos
	{familia: 'JetBrains Mono', archivo: 'fuentes/jetbrains-mono-Medium.ttf', peso: '500'},
	{familia: 'JetBrains Mono', archivo: 'fuentes/jetbrains-mono-Bold.ttf', peso: '700'},
];

export let FAMILIA = '"TASA Orbiter", system-ui, sans-serif';
/** La de los titulares grandes; por omisión, la misma. */
export let FAMILIA_TITULOS = FAMILIA;
/** La monoespaciada (JetBrains Mono, OFL): datos, años, citas de fuente. */
export const FAMILIA_MONO = '"JetBrains Mono", ui-monospace, monospace';

export const usaFuentes = (archivos: ArchivoDeFuente[], familia: string, titulos = familia) => {
	ARCHIVOS = archivos;
	FAMILIA = familia;
	FAMILIA_TITULOS = titulos;
};

let promesa: Promise<unknown> | null = null;

const carga = () => {
	promesa ??= Promise.all(
		ARCHIVOS.map((a) =>
			new FontFace(a.familia, `url(${staticFile(a.archivo)})`, {weight: a.peso, style: a.estilo ?? 'normal'})
				.load()
				.then((f) => document.fonts.add(f)),
		),
	);
	return promesa;
};

export const useFuentes = () => {
	const [espera] = useState(() => delayRender('fuentes'));
	useEffect(() => {
		carga().then(() => continueRender(espera));
	}, [espera]);
};
