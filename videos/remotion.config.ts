import {Config} from '@remotion/cli/config';

// WebGL por la tarjeta gráfica: sin esto Chrome sin cabeza pinta el 3D con
// SwiftShader (en CPU) y cada cuadro tarda diez veces más.
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setEntryPoint('src/bolanos/index.ts');
