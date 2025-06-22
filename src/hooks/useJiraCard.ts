'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CardInput } from '~/llm/jira/card-types';
import * as JiraCardService from '~/llm/jira/cards';

export function useJiraCard(issueKey?: string) {
  const queryClient = useQueryClient();

  // Fetch card details
  const { data: card, isLoading, error } = useQuery({
    queryKey: ['jira-card', issueKey],
    queryFn: async () => {
      if (!issueKey) return null;
      const result = await JiraCardService.getCard(issueKey);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    enabled: !!issueKey,
  });

  // Create new card
  const createCard = useMutation({
    mutationFn: async ({ projectKey, input }: { projectKey: string; input: CardInput }) => {
      const result = await JiraCardService.createCard(projectKey, input);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-cards'] });
    },
  });

  // Update card
  const updateCard = useMutation({
    mutationFn: async ({ issueKey, input }: { issueKey: string; input: Partial<CardInput> }) => {
      const result = await JiraCardService.updateCard(issueKey, input);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jira-card', variables.issueKey] });
      queryClient.invalidateQueries({ queryKey: ['jira-cards'] });
    },
  });

  // Transition card
  const transitionCard = useMutation({
    mutationFn: async ({ issueKey, transitionId, fields }: { issueKey: string; transitionId: string; fields?: Record<string, any> }) => {
      const result = await JiraCardService.transitionCard(issueKey, transitionId, fields);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jira-card', variables.issueKey] });
      queryClient.invalidateQueries({ queryKey: ['jira-cards'] });
    },
  });

  // Add comment
  const addComment = useMutation({
    mutationFn: async ({ issueKey, comment }: { issueKey: string; comment: string }) => {
      const result = await JiraCardService.addComment(issueKey, comment);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jira-card', variables.issueKey] });
    },
  });

  // Add attachment
  const addAttachment = useMutation({
    mutationFn: async ({ issueKey, file }: { issueKey: string; file: File }) => {
      const result = await JiraCardService.addAttachment(issueKey, file);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jira-card', variables.issueKey] });
    },
  });

  return {
    card,
    isLoading,
    error,
    createCard,
    updateCard,
    transitionCard,
    addComment,
    addAttachment,
  };
} 