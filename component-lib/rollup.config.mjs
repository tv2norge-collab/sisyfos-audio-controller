import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import svgr from '@svgr/rollup';
import path from 'path';
import { createRequire } from 'module';

const pkg = createRequire(import.meta.url)('./package.json');
const externalPackages = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

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
  // Anything the package declares as a dependency/peerDependency is the
  // consumer's responsibility to provide, not ours to bundle. Deriving this
  // from package.json (rather than a hand-maintained list) keeps it in sync
  // automatically and stops Rollup from warning about every one of them as
  // an "unresolved" external it had to guess about.
  external: (id) => externalPackages.some(
    (name) => id === name || id.startsWith(`${name}/`)
  ),
};
