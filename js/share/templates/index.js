// Template registry. To add a template:
//   1. copy any file in this folder, rename it, and change the drawing code
//   2. import it below and add one line to TEMPLATES
// The studio picks it up automatically.
import editorial from './editorial.js';
import terminal from './terminal.js';
import card from './trading-card.js';
import brutalist from './brutalist.js';
import meme from './meme.js';

export const TEMPLATES = { editorial, terminal, card, brutalist, meme };
