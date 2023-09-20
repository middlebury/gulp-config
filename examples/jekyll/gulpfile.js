import { createJekyllConfig } from '../../src/create-jekyll-config.js';

export const { dev, build } = createJekyllConfig();

console.log(dev);