import {
  base,
  browser,
  perfectionist,
  prettier,
  solid,
  typescript,
} from 'eslint-config-imperium';

export default [
  { ignores: ['dist', 'vite.config.ts'] },
  base,
  browser,
  solid,
  typescript,
  prettier,
  perfectionist,
];
