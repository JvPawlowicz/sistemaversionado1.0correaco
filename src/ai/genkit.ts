'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase/plugin';
import {googleCloud} from '@genkit-ai/google-cloud/plugin';

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(),
    googleCloud(),
  ],
  enableDevUI: false,
});
