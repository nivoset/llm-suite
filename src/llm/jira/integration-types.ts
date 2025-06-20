import { z } from 'zod';
import type { CardOperationResult } from './card-types';

// Schema for tool integration configuration
export const ToolConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['github', 'gitlab', 'bitbucket', 'confluence', 'slack', 'teams', 'custom']),
  config: z.record(z.string(), z.any()),
  customFields: z.array(z.string()).optional(), // IDs of custom fields this tool uses
  webhookUrl: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type ToolConfig = z.infer<typeof ToolConfigSchema>;

// Schema for tool events
export const ToolEventSchema = z.object({
  toolId: z.string(),
  eventType: z.string(),
  payload: z.record(z.string(), z.any()),
  timestamp: z.string(),
});

export type ToolEvent = z.infer<typeof ToolEventSchema>;

export class JiraIntegrationService {
  private static toolConfigs = new Map<string, ToolConfig>();

  // Register a new tool integration
  static async registerTool(config: ToolConfig): Promise<CardOperationResult> {
    try {
      const validatedConfig = ToolConfigSchema.parse(config);
      this.toolConfigs.set(config.id, validatedConfig);
      if (validatedConfig.webhookUrl) {
        // TODO: Set up webhook in Jira
      }
      return { success: true, message: `Tool ${config.name} registered successfully` };
    } catch (error) {
      console.error('Error registering tool:', error);
      return { success: false, message: 'Failed to register tool', error };
    }
  }

  static async handleToolEvent(event: ToolEvent): Promise<CardOperationResult> {
    try {
      const toolConfig = this.toolConfigs.get(event.toolId);
      if (!toolConfig) throw new Error(`Tool ${event.toolId} not found`);

      switch (toolConfig.type) {
        case 'github': return this.handleGitHubEvent(event, toolConfig);
        // Add other cases here
        default: throw new Error(`Unsupported tool type: ${toolConfig.type}`);
      }
    } catch (error) {
      console.error('Error handling tool event:', error);
      return { success: false, message: 'Failed to handle tool event', error };
    }
  }
  
  private static async handleGitHubEvent(event: ToolEvent, config: ToolConfig): Promise<CardOperationResult> {
    const { eventType, payload } = event;
    // Simplified logic for brevity
    return { success: true, message: 'GitHub event processed' };
  }

  static async getRegisteredTools(): Promise<ToolConfig[]> {
    return Array.from(this.toolConfigs.values());
  }

  static async getToolConfig(toolId: string): Promise<ToolConfig | undefined> {
    return this.toolConfigs.get(toolId);
  }

  static async updateToolConfig(toolId: string, config: Partial<ToolConfig>): Promise<CardOperationResult> {
    try {
      const existingConfig = this.toolConfigs.get(toolId);
      if (!existingConfig) throw new Error(`Tool ${toolId} not found`);
      
      const updatedConfig = { ...existingConfig, ...config };
      const validatedConfig = ToolConfigSchema.parse(updatedConfig);
      this.toolConfigs.set(toolId, validatedConfig);

      return { success: true, message: `Tool ${toolId} config updated` };
    } catch (error) {
      console.error('Error updating tool config:', error);
      return { success: false, message: 'Failed to update tool config', error };
    }
  }
} 