/**
 * Los colores de los videos.
 *
 * `marca` y `estado` son los tokens del panel (resources/css/themes/
 * puntualiza.css) convertidos de OKLCH a hex: un video de Puntualiza se tiene
 * que ver de la misma familia que la pantalla que explica. `escena` es la
 * paleta de las maquetas 3D: pastel cálido, del lado de los neutros de la
 * marca, porque el estilo de referencia (los muñecos de clavija del video de
 * SOP del SWEFC) vive de colores suaves y mates.
 *
 * Regla igual que en el panel: ningún componente escribe un color a mano.
 */
export const marca = {
	fondo: '#F2F1EF', // --color-puntualiza-50, fondo de página
	linea: '#E6E3E3', // --color-puntualiza-200
	tenue: '#8F8B85', // --color-puntualiza-500
	secundario: '#737372', // --color-puntualiza-600
	tinta: '#242423', // --color-puntualiza-800
	oscuro: '#141414', // --color-puntualiza-950, botón primario
	claro: '#F9F9F8', // --color-puntualiza-gray-50, texto sobre oscuro
	blanco: '#FFFFFF',
} as const;

export const estado = {
	presente: '#307A4F',
	presenteSuave: '#E0F5E6',
	retardo: '#A06604',
	retardoSuave: '#FFEBD2',
	falta: '#B33832',
	faltaSuave: '#FFE7E4',
	justificado: '#386CA0',
	justificadoSuave: '#E0F1FF',
} as const;

/**
 * Los mismos estados en el modo oscuro del panel (`.dark` en
 * puntualiza.css), convertidos de OKLCH a hex: son los que se leen sobre el
 * fondo oscuro de los cortos verticales. Ámbar para la palabra clave, rojo para
 * MITO y lo tachado, verde para LEY y VERDAD, azul para datos.
 */
export const estadoOscuro = {
	presente: '#57BC80', // oklch(72% 0.13 155)
	retardo: '#E8AA4E', // oklch(78% 0.13 75)
	falta: '#EA6B60', // oklch(68% 0.16 27)
	justificado: '#67A3E0', // oklch(70% 0.11 250)
} as const;

export const escena = {
	cielo: '#F2F1EF', // detrás de la maqueta: el fondo de la marca
	pared: '#E8DFD0',
	paredLateral: '#DDD2C0',
	zoclo: '#CFC3AF',
	piso: '#BBA98F',
	madera: '#9C7F62',
	maderaClara: '#D9CAB2',
	metal: '#A7A9A6',
	pantalla: '#2B2B2D',
	papel: '#FBFAF7',
	planta: '#6F9A6B',
	plantaOscura: '#557D52',
	maceta: '#C77B5B',
	carpetas: ['#386CA0', '#C9A05A', '#6F9A6B', '#B86B5E'],
	// el cielo de la ventana a lo largo del día
	dia: '#CFE2EC',
	tarde: '#F1BC8E',
	noche: '#46557A',
	tarima: '#E4DCCD', // el escenario redondo de las escenas sin cuarto
	tarimaCanto: '#CDBFA8',
} as const;

/** La gente. Piel y pelo variados a propósito: la plantilla de un cliente no es de un solo tono. */
export const gente = {
	pielClara: '#E5B396',
	pielMedia: '#C68863',
	pielOscura: '#8A5A3F',
	pelo: '#2A2522',
	peloCastano: '#5A3B2B',
	ojos: '#1D1B19',
	ana: '#4F7FB0', // camisa: el azul de «justificado», más claro
	supervisor: '#C99A4B', // camisa: el ámbar de «retardo», más claro
	companero: '#7FA37A',
} as const;
