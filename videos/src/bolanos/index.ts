// El tema va primero: los demás módulos leen la paleta al cargarse.
import './tema';
import './voz';
import {registerRoot} from 'remotion';
import {RaizBolanos} from './Raiz';

/**
 * Punto de entrada de los videos con la marca de Bolaños Abogados. Se
 * renderiza aparte: ENTRADA=src/bolanos/index.ts bash herramientas/final.sh registro-bolanos
 */
registerRoot(RaizBolanos);
