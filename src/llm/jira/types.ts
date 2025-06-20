import { z } from 'zod';

// Core Jira field types
export const JiraFieldTypes = {
  string: 'string',
  number: 'number',
  date: 'date',
  datetime: 'datetime',
  user: 'user',
  array: 'array',
  option: 'option',
  component: 'component',
  version: 'version',
  sprint: 'sprint',
  status: 'status',
  priority: 'priority',
  attachment: 'attachment',
} as const;

export type JiraFieldType = keyof typeof JiraFieldTypes;

// Schema for custom field definitions
export const CustomFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(Object.keys(JiraFieldTypes) as [JiraFieldType, ...JiraFieldType[]]),
  description: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.string()).optional(), // For option/select fields
});

export type CustomField = z.infer<typeof CustomFieldSchema>;

// Configuration for the Jira client
export interface JiraConfig {
  host: string;
  username: string;
  accessToken: string;
  customFields?: CustomField[];
} 