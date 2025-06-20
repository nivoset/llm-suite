'use client';

import { useState, useEffect } from 'react';
import { JiraCard } from './JiraCard';
import { useJiraCards } from '~/hooks/useJiraCards';

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
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [epics, setEpics] = useState<JiraEpic[]>([]);
  const { data: jiraCards, isLoading, error } = useJiraCards({ projectKey: selectedProject });

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/jira-projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0].key);
        }
      } catch (err) {
        // For now, just log the error. In a real app, handle this more gracefully.
        console.error(err);
      }
    }
    fetchProjects();
  }, [selectedProject]);

  useEffect(() => {
    async function fetchEpics() {
      if (!selectedProject) return;
      try {
        const response = await fetch(`/api/jira-epics?projectKey=${selectedProject}`);
        if (!response.ok) {
          throw new Error('Failed to fetch epics');
        }
        const data = await response.json();
        setEpics(data);
        setSelectedEpic(null); // Reset epic filter when project changes
      } catch (err) {
        console.error(err);
      }
    }
    fetchEpics();
  }, [selectedProject]);

  const filteredCards = jiraCards?.filter(card => {
    if (!selectedEpic) return true; // Show all if no epic is selected
    // An epic will not have an epicKey, so we check its own key
    if (card.metadata.issueType === 'Epic') {
      return card.metadata.key === selectedEpic;
    }
    return card.metadata.epicKey === selectedEpic;
  })?.sort((a, b) => {
    const aIsEpic = a.metadata.issueType === 'Epic';
    const bIsEpic = b.metadata.issueType === 'Epic';

    if (aIsEpic && !bIsEpic) {
      return -1;
    }
    if (!aIsEpic && bIsEpic) {
      return 1;
    }

    try {
      const aNum = parseInt(a.metadata.key.split('-')[1], 10);
      const bNum = parseInt(b.metadata.key.split('-')[1], 10);
      return aNum - bNum;
    } catch (e) {
      // Fallback to string comparison if key format is unexpected
      return a.metadata.key.localeCompare(b.metadata.key);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-slate-900">
        <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg shadow max-w-lg">
          <h3 className="text-lg font-semibold mb-2">Error Loading Jira Cards</h3>
          <p className="whitespace-pre-wrap">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!jiraCards?.length) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-slate-900">
        <div className="bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">No Jira Cards Found</h3>
          <p>No cards were found in the project. Please check your project settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-8 bg-white dark:bg-slate-900">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jira Dashboard</h1>
        <div className="flex gap-4">
          <div className="w-64">
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:text-white"
              disabled={!projects.length}
            >
              {projects.length ? (
                projects.map((project) => (
                  <option key={project.id} value={project.key}>
                    {project.name}
                  </option>
                ))
              ) : (
                <option>Loading projects...</option>
              )}
            </select>
          </div>
          <div className="w-64">
            <select
              value={selectedEpic || ''}
              onChange={(e) => setSelectedEpic(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:text-white"
              disabled={!epics.length}
            >
              <option value="">All Epics</option>
              {epics.map((epic) => (
                <option key={epic.id} value={epic.key}>
                  {epic.fields.summary}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards && filteredCards.map((card) => (
          <JiraCard key={card.metadata.key} doc={card} />
        ))}
      </div>
    </div>
  );
} 