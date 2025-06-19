'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { JiraDocument } from '~/types/jira';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { createElement } from 'react';

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
      const level = Math.min(Math.max(node.attrs?.level || 1, 1), 6);
      return createElement(
        `h${level}`,
        { className: "font-bold mb-2 mt-4" },
        node.content?.map((child: any, i: number) => renderAdfNode(child))
      );
    
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
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              aria-label="Refresh card"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Epic context if available */}
      {doc.metadata.epicKey && (
        <div className="bg-purple-50 dark:bg-purple-900/30 px-3 py-2 border-b border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-600 dark:text-purple-400">Epic:</span>
            <Link
              href={`/jira/${doc.metadata.epicKey}`}
              className="text-purple-700 dark:text-purple-300 hover:underline"
            >
              {doc.metadata.epicTitle}
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {doc.metadata.title}
        </h2>
        
        {doc.metadata.description && (
          <div className="prose dark:prose-invert max-w-none mb-4">
            {renderAdfContent(doc.metadata.description)}
          </div>
        )}

        {/* Child issues if this is an epic */}
        {doc.metadata.childIssues && doc.metadata.childIssues.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Child Issues:</h3>
            <div className="space-y-2">
              {doc.metadata.childIssues.map((child) => (
                <div key={child.key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                  <Link
                    href={`/jira/${child.key}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {child.key} - {child.title}
                  </Link>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-600">
                    {child.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata footer */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            {doc.metadata.assignee && (
              <div className="flex items-center gap-2">
                {doc.metadata.assigneeAvatar && (
                  <Image
                    src={doc.metadata.assigneeAvatar}
                    alt={doc.metadata.assignee}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}
                <span>{doc.metadata.assignee}</span>
              </div>
            )}
            {doc.metadata.priority && (
              <div className="flex items-center gap-1">
                {doc.metadata.priorityIcon && (
                  <Image
                    src={doc.metadata.priorityIcon}
                    alt={doc.metadata.priority}
                    width={16}
                    height={16}
                  />
                )}
                <span>{doc.metadata.priority}</span>
              </div>
            )}
            {doc.metadata.labels && doc.metadata.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {doc.metadata.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700"
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