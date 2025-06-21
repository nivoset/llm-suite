'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { createElement, useState, useEffect } from 'react';
import { updateIssue } from '~/llm/jira/client';
import { Markdown } from './Markdown';
import type { JiraIssue } from '~/llm/jira';
import { adfToMarkdown } from '~/lib/adf-to-markdown';

interface JiraCardProps {
  doc: JiraIssue;
  isDetailView?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onSuggestUpdate?: (newContent: string) => void;
}

export function JiraCard({ doc, isDetailView = false, onRefresh, isRefreshing = false }: JiraCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { fields } = doc;

  useEffect(() => {
    // Initialize editable content when the component mounts or the doc changes
    setEditableContent(fields.description || '');
  }, [fields.description]);

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      await updateIssue(doc.key, { description: editableContent });
      setIsEditing(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to save issue:', error);
      // Handle error display to user
    } finally {
      setIsSaving(false);
    }
  };

  // This function can be called from a parent to suggest an update
  const handleSuggestUpdate = (newContent: string) => {
    setEditableContent(newContent);
    setIsEditing(true);
  };
  
  // A bit of a hack to expose the function to the parent.
  // In a real app, you might use forwardRef or a more robust state management solution.
  useEffect(() => {
    if (isDetailView && (doc as any).onSuggestUpdate !== handleSuggestUpdate) {
      (doc as any).onSuggestUpdate = handleSuggestUpdate;
    }
  }, [doc, isDetailView, handleSuggestUpdate]);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-transparent ${isDetailView ? '' : 'hover:shadow-lg transition-shadow'}`}>
      {/* Header with issue key and status */}
      <div className="bg-blue-50 dark:bg-blue-900 p-3 flex items-center justify-between border-b border-slate-200 dark:border-transparent">
        <div className="flex items-center gap-2">
          {fields.issuetype?.iconUrl && (
            <Image
              src={fields.issuetype.iconUrl}
              alt={fields.issuetype.name || 'Issue'}
              width={16}
              height={16}
            />
          )}
          {isDetailView ? (
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {doc.key}
            </span>
          ) : (
            <Link
              href={`/jira/${doc.key}`}
              className="font-mono text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
            >
              {doc.key}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-sm rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            {fields.status?.name}
          </span>
          {isDetailView && onRefresh && (
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className={`p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRefreshing ? 'cursor-not-allowed animate-spin' : ''
              }`}
              aria-label="Refresh Jira Card"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Epic context if available */}
      {fields.parent && (
        <div className="bg-purple-50 dark:bg-purple-900/30 px-3 py-2 border-b border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-600 dark:text-purple-400">Epic:</span>
            <Link
              href={`/jira/${fields.parent.key}`}
              className="text-purple-700 dark:text-purple-300 hover:underline"
            >
              {fields.parent.fields.summary}
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`p-4 relative ${isDetailView ? '' : 'max-h-96 overflow-y-auto'}`}>
        {!isDetailView && (
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pointer-events-none"></div>
        )}
        <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">
          {fields.summary}
        </h2>
        
        {isEditing ? (
          <div className="mb-4">
            <textarea
              className="w-full h-64 p-2 border rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
            />
            <div className="mt-2 flex gap-2">
              <button 
                onClick={handleSaveClick}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          fields.description && (
            <div className="prose dark:text-slate-300 max-w-none mb-4">
              <Markdown markdown={adfToMarkdown(fields.description)} />
            </div>
          )
        )}

        {/* Child issues if this is an epic */}
        {fields.issuetype.name === 'Epic' && fields.subtasks && fields.subtasks.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Child Issues:</h3>
            <div className="space-y-2">
              {fields.subtasks.map((child: any) => (
                <div key={child.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded p-2 border border-slate-200 dark:border-transparent">
                  <Link
                    href={`/jira/${child.key}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {child.key} - {child.fields.summary}
                  </Link>
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-600">
                    {child.fields.status.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            {fields.assignee && (
              <div className="flex items-center gap-2">
                {fields.assignee.avatarUrls?.['48x48'] && (
                  <Image
                    src={fields.assignee.avatarUrls['48x48']}
                    alt={fields.assignee.displayName}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}
                <span>{fields.assignee.displayName}</span>
              </div>
            )}
            {fields.priority && (
              <div className="flex items-center gap-1">
                {fields.priority.iconUrl && (
                  <Image
                    src={fields.priority.iconUrl}
                    alt={fields.priority.name}
                    width={16}
                    height={16}
                  />
                )}
                <span>{fields.priority.name}</span>
              </div>
            )}
            {fields.labels && fields.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {fields.labels.map((label: string) => (
                  <span
                    key={label}
                    className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-transparent"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 