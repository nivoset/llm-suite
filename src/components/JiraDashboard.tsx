'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JiraCard } from './JiraCard';
import { useJiraCards } from '~/hooks/useJiraCards';
import { useQueryParameter } from '~/hooks/useQueryParameter';

interface JiraProject {
  id: string;
  key: string;
  name: string;
}

interface JiraEpic {
  id: string;
  key: string;
  fields: {
    summary: string;
  };
}

export default function JiraDashboard() {
  const [selectedProject, setSelectedProject] = useQueryParameter('project', '');
  const [selectedEpic, setSelectedEpic] = useQueryParameter('epic', '');

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<JiraProject[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/jira-projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const projects = await response.json();
      // Set the default project to the first project if no project is selected
      setSelectedProject((selectedProject: string) => `${selectedProject || projects[0].key}`)
      return projects;
    },
  });


  const { data: jiraCards, isLoading, error } = useJiraCards({ projectKey: selectedProject || null, epicKey: selectedEpic || null });

  const { data: epics = [], isLoading: isEpicsLoading } = useQuery<JiraEpic[]>({
    queryKey: ['epics', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await fetch(`/api/jira-epics?projectKey=${selectedProject}`);
      if (!response.ok) {
        throw new Error('Failed to fetch epics');
      }
      return response.json();
    },
    enabled: !!selectedProject,
  });

  const sortedCards = jiraCards?.slice().sort((a, b) => {
    const aIsEpic = a.fields.issuetype.name === 'Epic';
    const bIsEpic = b.fields.issuetype.name === 'Epic';

    if (aIsEpic && !bIsEpic) {
      return -1;
    }
    if (!aIsEpic && bIsEpic) {
      return 1;
    }

    try {
      const aNum = parseInt(a.key.split('-')[1], 10);
      const bNum = parseInt(b.key.split('-')[1], 10);
      return aNum - bNum;
    } catch (e) {
      // Fallback to string comparison if key format is unexpected
      return a.key.localeCompare(b.key);
    }
  });

  const isOverallLoading = isProjectsLoading || isLoading;

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jira Dashboard</h1>
            <div className="flex gap-4">
              <div className="w-64">
                <select
                  value={selectedProject || ''}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedEpic('');
                  }}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:text-white"
                  disabled={isProjectsLoading || (projects && projects.length === 0)}
                >
                  {isProjectsLoading ? (
                    <option>Loading projects...</option>
                  ) : (
                    projects && projects.map((project: JiraProject) => (
                      <option key={project.id} value={project.key}>
                        {project.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="w-64">
                <select
                  value={selectedEpic || ''}
                  onChange={(e) => setSelectedEpic(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:text-white"
                  disabled={!selectedProject || isEpicsLoading}
                >
                  <option value="">All Epics</option>
                  {isEpicsLoading ? (
                    <option>Loading epics...</option>
                  ) : (
                    epics.map((epic) => (
                      <option key={epic.id} value={epic.key}>
                        {epic.fields.summary}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 h-full">
          {isOverallLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-100"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg shadow max-w-lg">
                <h3 className="text-lg font-semibold mb-2">Error Loading Jira Cards</h3>
                <p className="whitespace-pre-wrap">{error.message}</p>
              </div>
            </div>
          ) : jiraCards && jiraCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCards && sortedCards.map((card) => (
                <JiraCard key={card.key} doc={card} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">No Jira Cards Found</h3>
                <p>No cards were found for the selected project or epic.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
