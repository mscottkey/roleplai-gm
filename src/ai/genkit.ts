import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {enableFirebaseTelemetry} from '@genkit-ai/firebase';

export const ai = genkit({
  plugins: [googleAI(), enableFirebaseTelemetry()],
  enableTracingAndMetrics: true,
  logLevel: 'debug',
});
