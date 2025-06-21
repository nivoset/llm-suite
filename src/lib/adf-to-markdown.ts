// src/lib/adf-to-markdown.ts

// A basic type definition for ADF nodes.
// This can be expanded for more thorough type checking.
interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  attrs?: {
    [key: string]: any;
  };
}

/**
 * Converts a string or Atlassian Document Format (ADF) object into a markdown string.
 * This is a simplified converter and may not handle all ADF features.
 *
 * @param adf The ADF object or a plain string.
 * @returns A markdown string representation of the input.
 */
export function adfToMarkdown(adf: any): string {
  // If the input is already a string, return it directly.
  if (typeof adf === 'string') {
    return adf;
  }

  // If the input is not an object or doesn't have a type, return an empty string.
  if (typeof adf !== 'object' || !adf.type) {
    return '';
  }

  let markdown = '';

  function traverse(node: AdfNode) {
    if (!node.type) {
      return;
    }

    switch (node.type) {
      case 'doc':
        if (node.content) {
          node.content.forEach(traverse);
        }
        break;
      case 'paragraph':
        if (node.content) {
          node.content.forEach(traverse);
        }
        markdown += '\\n\\n';
        break;
      case 'text':
        markdown += node.text;
        break;
      case 'heading':
        markdown += `${'#'.repeat(node.attrs?.level || 1)} `;
        if (node.content) {
          node.content.forEach(traverse);
        }
        markdown += '\\n\\n';
        break;
      // Add more cases here for other ADF node types like lists, tables, etc.
      default:
        if (node.content) {
          node.content.forEach(traverse);
        }
        break;
    }
  }

  traverse(adf);

  return markdown.trim();
} 