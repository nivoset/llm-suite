'use server';

import { JiraCardService, type CardInput } from './card-types';

export async function getCard(issueKey: string) {
  return JiraCardService.getCard(issueKey);
}

export async function createCard(projectKey: string, input: CardInput) {
  return JiraCardService.createCard(projectKey, input);
}

export async function updateCard(issueKey: string, input: Partial<CardInput>) {
  return JiraCardService.updateCard(issueKey, input);
}

export async function transitionCard(issueKey: string, transitionId: string, fields?: Record<string, any>) {
  return JiraCardService.transitionCard(issueKey, transitionId, fields);
}

export async function addComment(issueKey: string, comment: string) {
  return JiraCardService.addComment(issueKey, comment);
}

export async function addAttachment(issueKey: string, file: File) {
  return JiraCardService.addAttachment(issueKey, file);
} 