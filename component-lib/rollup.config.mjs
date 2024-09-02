import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import svgr from '@svgr/rollup';
import path from 'path';

export default {
  input: './src/index.tsx', // Entry point of the component library
  output: [
    {
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    commonjs(),
    postcss({
      extract: path.resolve('dist/styles.css'), // Extract CSS to a single file
    }),
    typescript({
        tsconfig: 'tsconfig.json',
    }),
    babel({
      exclude: '**/node_modules/**', // Only transpile our source code
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      babelHelpers: 'bundled',
      include: ['../client', '../shared', '../component-lib']
    }),
    svgr()
  ],
  external: [
    'react', // Prevent bundling react
    'react-dom' // Prevent bundling react-dom
  ],
};
