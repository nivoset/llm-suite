import { JiraIntegrationService, type ToolConfig, type ToolEvent } from './integration-types';

export async function registerTool(config: ToolConfig) {
  return JiraIntegrationService.registerTool(config);
}

export async function handleToolEvent(event: ToolEvent) {
  return JiraIntegrationService.handleToolEvent(event);
}

export async function getRegisteredTools() {
  return JiraIntegrationService.getRegisteredTools();
}

export async function getToolConfig(toolId: string) {
  return JiraIntegrationService.getToolConfig(toolId);
}

export async function updateToolConfig(toolId: string, config: Partial<ToolConfig>) {
  return JiraIntegrationService.updateToolConfig(toolId, config);
} 