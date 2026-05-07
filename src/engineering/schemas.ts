import { z } from "zod";

export const alarmPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const alarmDefinitionSchema = z.object({
  name: z.string().min(1),
  condition: z.string().min(1),
  priority: alarmPrioritySchema,
  operatorAction: z.string().min(1),
  consequence: z.string().min(1),
  rationalization: z.string().min(1),
});

export const interlockDefinitionSchema = z.object({
  cause: z.string().min(1),
  condition: z.string().min(1),
  effect: z.string().min(1),
  resetRequirement: z.string().min(1),
  bypassAllowed: z.boolean(),
  notes: z.string().min(1),
});

export const strategyInputSchema = z.object({
  title: z.string().min(1),
  area: z.string().min(1),
  equipment: z.array(z.string().min(1)).min(1),
  objectives: z.array(z.string().min(1)).min(1),
  controlNarrativeRequirements: z.array(z.string().min(1)).default([]),
  alarms: z.array(alarmDefinitionSchema).default([]),
  interlocks: z.array(interlockDefinitionSchema).default([]),
  modes: z.array(z.string().min(1)).default([]),
  failureScenarios: z.array(z.string().min(1)).default([]),
  namingPrefix: z.string().min(1).default("MOD"),
});

export type StrategyInput = z.infer<typeof strategyInputSchema>;
export type AlarmDefinition = z.infer<typeof alarmDefinitionSchema>;
export type InterlockDefinition = z.infer<typeof interlockDefinitionSchema>;
