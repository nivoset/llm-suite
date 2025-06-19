'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { JiraDocument } from '~/types/jira';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface JiraCardProps {
  doc: JiraDocument;
  isDetailView?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function renderAdfContent(content: string) {
  try {
    // If the content is already in ADF format (JSON string), parse it
    const adfDoc = typeof content === 'string' ? JSON.parse(content) : content;
    
    if (adfDoc.type === 'doc') {
      return renderAdfNode(adfDoc);
    }
    
    // Fallback to plain text if not valid ADF
    return <p className="whitespace-pre-wrap">{content}</p>;
  } catch (e) {
    // If parsing fails, treat as plain text
    return <p className="whitespace-pre-wrap">{content}</p>;
  }
}

function renderAdfNode(node: any): React.ReactNode {
  if (!node) return null;

  switch (node.type) {
    case 'doc':
      return <div>{node.content?.map((child: any, i: number) => renderAdfNode(child))}</div>;
    
    case 'paragraph':
      return <p className="mb-2">{node.content?.map((child: any, i: number) => renderAdfNode(child))}</p>;
    
    case 'text':
      let content = node.text;
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'strong':
              content = <strong>{content}</strong>;
              break;
            case 'em':
              content = <em>{content}</em>;
              break;
            case 'strike':
              content = <del>{content}</del>;
              break;
            case 'code':
              content = <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{content}</code>;
              break;
            case 'link':
              content = <a href={mark.attrs.href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{content}</a>;
              break;
          }
        });
      }
      return content;
    
    case 'bulletList':
      return <ul className="list-disc list-inside mb-2">{node.content?.map((child: any, i: number) => renderAdfNode(child))}</ul>;
    
    case 'orderedList':
      return <ol className="list-decimal list-inside mb-2">{node.content?.map((child: any, i: number) => renderAdfNode(child))}</ol>;
    
    case 'listItem':
      return <li className="ml-4">{node.content?.map((child: any, i: number) => renderAdfNode(child))}</li>;
    
    case 'heading':
      const HeadingTag = `h${node.attrs?.level || 1}` as keyof JSX.IntrinsicElements;
      return <HeadingTag className="font-bold mb-2 mt-4">{node.content?.map((child: any, i: number) => renderAdfNode(child))}</HeadingTag>;
    
    case 'codeBlock':
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-2 overflow-x-auto">
          <code>{node.content?.map((child: any, i: number) => renderAdfNode(child))}</code>
        </pre>
      );
    
    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 mb-2 italic">
          {node.content?.map((child: any, i: number) => renderAdfNode(child))}
        </blockquote>
      );
    
    case 'rule':
      return <hr className="my-4 border-gray-200 dark:border-gray-700" />;
    
    case 'hardBreak':
      return <br />;
    
    default:
      // For unsupported node types, try to render children if they exist
      return node.content ? node.content.map((child: any, i: number) => renderAdfNode(child)) : null;
  }
}

export function JiraCard({ doc, isDetailView = false, onRefresh, isRefreshing = false }: JiraCardProps) {
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
              className="font-mono text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
            >
              {doc.metadata.key}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            {doc.metadata.status}
          </span>
          {isDetailView && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh card and analysis"
              aria-disabled={isRefreshing}
              className={`p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowPathIcon className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="sr-only">
                {isRefreshing ? 'Refreshing...' : 'Refresh card and analysis'}
              </span>
            </button>
          )}
        </div>
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
      <div className="p-4">
        <h3 className="font-medium mb-2">{doc.metadata.title}</h3>
        {doc.metadata.description && (
          <div className={`text-gray-600 dark:text-gray-300 text-sm ${isDetailView ? '' : 'line-clamp-3'}`}>
            {renderAdfContent(doc.metadata.description)}
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
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
        <div className="flex flex-col items-end text-xs text-gray-600 dark:text-gray-400">
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
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
          >
            View in Jira →
          </a>
        </div>
      )}
    </div>
  );
} 