import {aplicaTema} from '../kit/tema';

/**
 * La identidad de Bolaños Abogados, del paquete de marca que mandó Oscar el
 * 2026-10-16 (paleta en `BRANDING/PaletaDeColores…png`): carbón #2C2E33,
 * dorado #D7A55A, hueso #F0ECEB y pizarra #41474F. Su logotipo combina un
 * serif de alto contraste con un sans espaciado; aquí van Playfair Display
 * para los titulares y Lato para el texto, las dos OFL (sus licencias están
 * en public/fuentes). El dorado se oscurece un punto (#B98B45) cuando va como
 * texto sobre el hueso, para que se lea.
 *
 * Este módulo se importa ANTES que cualquier otro en src/bolanos/index.ts.
 */
aplicaTema({
	nombre: 'Bolaños Abogados',
	marca: {
		fondo: '#F0ECEB',
		linea: '#DDD7D3',
		tenue: '#B98B45',
		secundario: '#41474F',
		tinta: '#2C2E33',
		oscuro: '#2C2E33',
		claro: '#F0ECEB',
		blanco: '#FFFFFF',
	},
	iso: {
		papel: '#F0ECEB',
		blanco: '#FAF8F7',
		muro: '#EDE8E5',
		lote: '#E2DCD8',
		linea: '#D8D1CC',
		gris: '#C7C2BE',
		grisOscuro: '#8B9199',
		tinta: '#2C2E33',
		negro: '#41474F',
		vidrio: '#41474F',
		isotipo: 'marca/isotipo-dorado.png',
	},
	fuentes: {
		archivos: [
			{familia: 'Lato', archivo: 'fuentes/Lato-Regular.ttf', peso: '400 500'},
			{familia: 'Lato', archivo: 'fuentes/Lato-Bold.ttf', peso: '600 700'},
			{familia: 'Lato', archivo: 'fuentes/Lato-Black.ttf', peso: '800 900'},
			{familia: 'Playfair Display', archivo: 'fuentes/PlayfairDisplay-variable.ttf', peso: '400 900'},
		],
		familia: '"Lato", system-ui, sans-serif',
		titulos: '"Playfair Display", Georgia, serif',
	},
});
