import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
  {
    input: 'src/index.js',
    name: 'markedExtensions',
    output: {
      format: 'iife',
      file: 'dist/marked-extensions.js',
      sourcemap: true
    },
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        browser: true,
      }),
      commonjs(),
      eslint(),
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: [['es2015', {modules: false}]],
        plugins: ['external-helpers']
      }),
    ]
  },
  {
    input: 'src/index.js',
    name: 'markedExtensions',
    external: ['ms'],
    output: {
      format: 'es',
      file: 'dist/marked-extensions.es.js',
    },
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        browser: true,
      }),
      commonjs(),
      eslint(),
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: [['es2015', {modules: false}]],
        plugins: ['external-helpers']
      }),
    ]
  }
];
