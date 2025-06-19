import Image from 'next/image';
import Link from 'next/link';
import type { JiraDocument } from '~/types/jira';

interface JiraCardProps {
  doc: JiraDocument;
  isDetailView?: boolean;
}

export function JiraCard({ doc, isDetailView = false }: JiraCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${isDetailView ? '' : 'hover:shadow-lg transition-shadow'}`}>
      {/* Header with issue key and status */}
      <div className="bg-blue-50 dark:bg-blue-900 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {doc.metadata.issueTypeIcon && (
            <Image
              src={doc.metadata.issueTypeIcon}
              alt={doc.metadata.issueType || 'Issue'}
              width={16}
              height={16}
            />
          )}
          {isDetailView ? (
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {doc.metadata.key}
            </span>
          ) : (
            <Link
              href={`/jira/${doc.metadata.key}`}
              className="font-mono text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
            >
              {doc.metadata.key}
            </Link>
          )}
        </div>
        <span className="px-2 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
          {doc.metadata.status}
        </span>
      </div>
      
      {/* Labels section */}
      {doc.metadata.labels && doc.metadata.labels.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {doc.metadata.labels.map((label, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="p-4 text-gray-900 dark:text-gray-100">
        <h3 className="font-medium mb-2">{doc.metadata.title}</h3>
        {doc.metadata.description && (
          <div className={`text-gray-600 dark:text-gray-300 text-sm ${isDetailView ? '' : 'line-clamp-3'}`}>
            {doc.metadata.description}
          </div>
        )}
        
        {isDetailView && doc.metadata.components && doc.metadata.components.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Components</h4>
            <div className="flex flex-wrap gap-1">
              {doc.metadata.components.map((component, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                >
                  {component}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with assignee and date */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          {doc.metadata.assigneeAvatar && (
            <Image
              src={doc.metadata.assigneeAvatar}
              alt={doc.metadata.assignee || 'Assignee'}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span>{doc.metadata.assignee || 'Unassigned'}</span>
        </div>
        <div className="flex flex-col items-end text-xs">
          <span>
            Updated: {new Date(doc.metadata.updated || '').toLocaleDateString()}
          </span>
          {isDetailView && doc.metadata.created && (
            <span>
              Created: {new Date(doc.metadata.created).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      {isDetailView && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <a
            href={doc.metadata.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
          >
            View in Jira →
          </a>
        </div>
      )}
    </div>
  );
} 