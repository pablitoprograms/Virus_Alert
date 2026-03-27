'use server';
/**
 * @fileOverview This file implements a Genkit flow to automatically identify, categorize,
 * and prioritize active disease outbreak clusters from raw global health data.
 *
 * - identifyOutbreaks - A function that processes raw health data to detect outbreaks.
 * - IdentifyOutbreaksInput - The input type for the identifyOutbreaks function.
 * - IdentifyOutbreaksOutput - The return type for the identifyOutbreaks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the input schema for identifying disease outbreaks.
 * @property {string} rawData - Raw global health data, such as epidemiological reports or news articles.
 * @property {string} [currentTime] - The current timestamp in ISO 8601 format to help prioritize recent outbreaks.
 */
const IdentifyOutbreaksInputSchema = z.object({
  rawData: z
    .string()
    .describe(
      'Raw global health data, such as epidemiological reports, news articles, or social media mentions, describing potential disease outbreaks.'
    ),
  currentTime: z
    .string()
    .datetime()
    .describe(
      'The current timestamp in ISO 8601 format (e.g., "2024-07-30T10:00:00Z") to help prioritize recent outbreaks.'
    )
    .optional(),
});
export type IdentifyOutbreaksInput = z.infer<typeof IdentifyOutbreaksInputSchema>;

/**
 * Defines the schema for a single identified outbreak cluster.
 * @property {string} diseaseName - The name of the identified disease outbreak.
 * @property {string} locationDescription - A textual description of the location of the outbreak.
 * @property {number} latitude - The latitude coordinate for the outbreak cluster location.
 * @property {number} longitude - The longitude coordinate for the outbreak cluster location.
 * @property {'Viral' | 'Bacterial' | 'Parasitic' | 'Fungal' | 'Other' | 'Unknown'} category - The category of the disease.
 * @property {'High' | 'Medium' | 'Low'} priority - The prioritization of the outbreak.
 * @property {number} intensity - A numerical intensity value (0-100) for heatmap visualization.
 * @property {'Active' | 'Contained' | 'New' | 'Monitoring'} status - The current status of the outbreak.
 * @property {string} reportedDate - The date and time when this outbreak was reported or primarily active.
 */
const OutbreakClusterSchema = z.object({
  diseaseName: z
    .string()
    .describe(
      'The name of the identified disease outbreak (e.g., "COVID-19", "Ebola Virus").'
    ),
  locationDescription: z
    .string()
    .describe(
      'A textual description of the location of the outbreak (e.g., "North Kivu, Democratic Republic of Congo", "Wuhan, China").'
    ),
  latitude: z
    .number()
    .describe('The latitude coordinate for the outbreak cluster location.'),
  longitude: z
    .number()
    .describe('The longitude coordinate for the outbreak cluster location.'),
  category: z
    .enum(['Viral', 'Bacterial', 'Parasitic', 'Fungal', 'Other', 'Unknown'])
    .describe('The category of the disease (e.g., Viral, Bacterial).'),
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe(
      'The prioritization of the outbreak based on severity, spread, and public health impact.'
    ),
  intensity: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A numerical intensity value (0-100) for heatmap visualization, where higher values indicate greater severity/activity.'
    ),
  status: z
    .enum(['Active', 'Contained', 'New', 'Monitoring'])
    .describe('The current status of the outbreak.'),
  reportedDate: z
    .string()
    .datetime()
    .describe(
      'The date and time when this outbreak was reported or primarily active, in ISO 8601 format.'
    ),
});

/**
 * Defines the output schema for the identified disease outbreaks.
 * @property {OutbreakCluster[]} outbreakClusters - A list of identified and categorized disease outbreak clusters.
 */
const IdentifyOutbreaksOutputSchema = z.object({
  outbreakClusters: z
    .array(OutbreakClusterSchema)
    .describe('A list of identified and categorized disease outbreak clusters.'),
});
export type IdentifyOutbreaksOutput = z.infer<typeof IdentifyOutbreaksOutputSchema>;

/**
 * Genkit prompt definition for identifying, categorizing, and prioritizing disease outbreaks.
 */
const identifyOutbreaksPrompt = ai.definePrompt({
  name: 'identifyOutbreaksPrompt',
  input: { schema: IdentifyOutbreaksInputSchema },
  output: { schema: IdentifyOutbreaksOutputSchema },
  prompt: `You are an expert global health analyst AI. Your task is to analyze raw global health data to identify, categorize, and prioritize active disease outbreak clusters.
For each identified outbreak, provide its name, a description of its location, precise latitude and longitude coordinates, its disease category, its priority (High, Medium, Low), a numerical intensity (0-100) for heatmap visualization, its current status, and the reported date. The location description should be specific enough to understand where the outbreak is occurring.
Use the provided 'currentTime' if available to help prioritize recent or currently active outbreaks. Prioritize outbreaks based on their potential for spread, severity, and current public health impact.

Raw Health Data:
{{{rawData}}}

Current Time: {{{currentTime}}}`,
});

/**
 * Genkit flow definition for identifying disease outbreaks.
 * @param {IdentifyOutbreaksInput} input - The input containing raw global health data and an optional current timestamp.
 * @returns {Promise<IdentifyOutbreaksOutput>} A promise that resolves to an object containing identified outbreak clusters.
 */
const identifyOutbreaksFlow = ai.defineFlow(
  {
    name: 'identifyOutbreaksFlow',
    inputSchema: IdentifyOutbreaksInputSchema,
    outputSchema: IdentifyOutbreaksOutputSchema,
  },
  async (input) => {
    const { output } = await identifyOutbreaksPrompt(input);
    if (!output) {
      throw new Error('Failed to identify outbreaks.');
    }
    return output;
  }
);

/**
 * Wrapper function to call the identify outbreaks Genkit flow.
 * This function processes raw global health data to identify, categorize, and prioritize disease outbreaks.
 *
 * @param {IdentifyOutbreaksInput} input - The raw health data and optional current time.
 * @returns {Promise<IdentifyOutbreaksOutput>} The identified outbreak clusters.
 */
export async function identifyOutbreaks(
  input: IdentifyOutbreaksInput
): Promise<IdentifyOutbreaksOutput> {
  return identifyOutbreaksFlow(input);
}
