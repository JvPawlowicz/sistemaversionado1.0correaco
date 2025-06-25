'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { enableFirebaseTelemetry as firebase } from '@genkit-ai/firebase';
import {googleCloud} from '@genkit-ai/google-cloud';

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(),
    googleCloud(),
  ],
  enableDevUI: false,
});
