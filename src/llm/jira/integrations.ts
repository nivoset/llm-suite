'use server';

import { z } from 'zod';
import jiraClient from './client';
import type { CardOperationResult } from './cards';

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
      // Validate the tool configuration
      const validatedConfig = ToolConfigSchema.parse(config);
      
      // Store the tool configuration
      this.toolConfigs.set(config.id, validatedConfig);

      // Set up any necessary webhooks or connections
      if (validatedConfig.webhookUrl) {
        // TODO: Set up webhook in Jira
      }

      return {
        success: true,
        message: `Tool ${config.name} registered successfully`,
      };
    } catch (error) {
      console.error('Error registering tool:', error);
      return {
        success: false,
        message: 'Failed to register tool',
        error,
      };
    }
  }

  // Handle an event from an integrated tool
  static async handleToolEvent(event: ToolEvent): Promise<CardOperationResult> {
    try {
      const toolConfig = this.toolConfigs.get(event.toolId);
      if (!toolConfig) {
        throw new Error(`Tool ${event.toolId} not found`);
      }

      // Process the event based on tool type and event type
      switch (toolConfig.type) {
        case 'github':
          return this.handleGitHubEvent(event, toolConfig);
        case 'gitlab':
          return this.handleGitLabEvent(event, toolConfig);
        case 'confluence':
          return this.handleConfluenceEvent(event, toolConfig);
        case 'slack':
          return this.handleSlackEvent(event, toolConfig);
        case 'teams':
          return this.handleTeamsEvent(event, toolConfig);
        case 'custom':
          return this.handleCustomEvent(event, toolConfig);
        default:
          throw new Error(`Unsupported tool type: ${toolConfig.type}`);
      }
    } catch (error) {
      console.error('Error handling tool event:', error);
      return {
        success: false,
        message: 'Failed to handle tool event',
        error,
      };
    }
  }

  // GitHub specific event handling
  private static async handleGitHubEvent(event: ToolEvent, config: ToolConfig): Promise<CardOperationResult> {
    const { eventType, payload } = event;

    switch (eventType) {
      case 'pull_request':
        // Update Jira issue with PR information
        const prLink = payload.pull_request.html_url;
        const prStatus = payload.pull_request.state;
        const comment = `GitHub Pull Request ${prStatus}: ${prLink}`;
        
        // Update custom fields if configured
        const customFields: Record<string, any> = {};
        if (config.customFields) {
          config.customFields.forEach(fieldId => {
            if (fieldId.includes('pr_link')) customFields[fieldId] = prLink;
            if (fieldId.includes('pr_status')) customFields[fieldId] = prStatus;
          });
        }

        return {
          success: true,
          message: 'GitHub event processed successfully',
        };

      case 'push':
        // Handle push events
        return {
          success: true,
          message: 'GitHub push event processed',
        };

      default:
        return {
          success: false,
          message: `Unsupported GitHub event type: ${eventType}`,
        };
    }
  }

  // GitLab specific event handling
  private static async handleGitLabEvent(event: ToolEvent, config: ToolConfig): Promise<CardOperationResult> {
    // Similar to GitHub event handling
    return {
      success: true,
      message: 'GitLab event processed',
    };
  }

  // Confluence specific event handling
  private static async handleConfluenceEvent(event: ToolEvent, config: ToolConfig): Promise<CardOperationResult> {
    const { eventType, payload } = event;

    switch (eventType) {
      case 'page_created':
      case 'page_updated':
        // Update Jira issue with Confluence page information
        const pageLink = payload.page.url;
        const pageTitle = payload.page.title;
        const comment = `Confluence page ${eventType === 'page_created' ? 'created' : 'updated'}: [${pageTitle}](${pageLink})`;
        
        // Update custom fields if configured
        const customFields: Record<string, any> = {};
        if (config.customFields) {
          config.customFields.forEach(fieldId => {
            if (fieldId.includes('confluence_link')) customFields[fieldId] = pageLink;
          });
        }

        return {
          success: true,
          message: 'Confluence event processed successfully',
        };

      default:
        return {
          success: false,
          message: `Unsupported Confluence event type: ${eventType}`,
        };
    }
  }

  // Slack specific event handling
  private static async handleSlackEvent(event: ToolEvent, config: ToolConfig): Promise<CardOperationResult> {
    // Handle Slack events (messages, reactions, etc.)
    return {
      success: true,
      message: 'Slack event processed',
    };
  }

  // Microsoft Teams specific event handling
  private static async handleTeamsEvent(event: ToolEvent, config: ToolConfig): Promise<CardOperationResult> {
    // Handle Teams events
    return {
      success: true,
      message: 'Teams event processed',
    };
  }

  // Custom tool event handling
  private static async handleCustomEvent(event: ToolEvent, config: ToolConfig): Promise<CardOperationResult> {
    // Handle custom tool events based on configuration
    try {
      // Process the event using the custom configuration
      const { eventType, payload } = event;
      
      // Example: Update custom fields based on the event
      const customFields: Record<string, any> = {};
      if (config.customFields) {
        config.customFields.forEach(fieldId => {
          const value = payload[fieldId];
          if (value !== undefined) {
            customFields[fieldId] = value;
          }
        });
      }

      return {
        success: true,
        message: 'Custom event processed successfully',
      };
    } catch (error) {
      console.error('Error processing custom event:', error);
      return {
        success: false,
        message: 'Failed to process custom event',
        error,
      };
    }
  }

  // Get all registered tools
  static async getRegisteredTools(): Promise<ToolConfig[]> {
    return Array.from(this.toolConfigs.values());
  }

  // Get a specific tool configuration
  static async getToolConfig(toolId: string): Promise<ToolConfig | undefined> {
    return this.toolConfigs.get(toolId);
  }

  // Update a tool configuration
  static async updateToolConfig(toolId: string, config: Partial<ToolConfig>): Promise<CardOperationResult> {
    try {
      const existingConfig = this.toolConfigs.get(toolId);
      if (!existingConfig) {
        throw new Error(`Tool ${toolId} not found`);
      }

      const updatedConfig = {
        ...existingConfig,
        ...config,
      };

      // Validate the updated configuration
      const validatedConfig = ToolConfigSchema.parse(updatedConfig);
      
      // Update the stored configuration
      this.toolConfigs.set(toolId, validatedConfig);

      return {
        success: true,
        message: `Tool ${toolId} configuration updated successfully`,
      };
    } catch (error) {
      console.error('Error updating tool configuration:', error);
      return {
        success: false,
        message: 'Failed to update tool configuration',
        error,
      };
    }
  }
}

export default JiraIntegrationService; 