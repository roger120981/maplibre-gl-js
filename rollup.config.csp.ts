import {plugins} from './build/rollup_plugins';
import banner from './build/banner';
import {type InputOption, type ModuleFormat, type RollupOptions} from 'rollup';

// a config for generating a special GL JS bundle with static web worker code (in a separate file)
// https://github.com/mapbox/mapbox-gl-js/issues/6058

const {BUILD} = process.env;

const production: boolean = (BUILD !== 'dev');
const outputPostfix: string = production ? '' : '-dev';

const config = (input: InputOption, file: string, format: ModuleFormat): RollupOptions => ({
    input,
    output: {
        name: 'maplibregl',
        file,
        format,
        sourcemap: true,
        indent: false,
        banner
    },
    treeshake: production,
    plugins: plugins(production)
});

const configs = [
    config('src/index.ts', `dist/maplibre-gl-csp${outputPostfix}.js`, 'umd'),
    config('src/source/worker.ts', `dist/maplibre-gl-csp-worker${outputPostfix}.js`, 'iife')
];

export default configs;
