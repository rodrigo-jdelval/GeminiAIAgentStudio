
import React from 'react';

// Simple parser for a subset of Markdown
const parseMarkdown = (text: string): React.ReactElement[] => {
  if (!text) return [];

  const nodes: React.ReactElement[] = [];
  const lines = text.split('\n');
  let inTable = false;
  let tableHeader: string[] = [];
  const tableRows: string[][] = [];

  const flushTable = () => {
    if (tableHeader.length > 0 && tableRows.length > 0) {
      nodes.push(
        <table key={`table-${nodes.length}`} className="w-full my-4 text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-600">
              {tableHeader.map((th, i) => <th key={i} className="p-2 font-semibold">{th.trim()}</th>)}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-700">
                {row.map((td, j) => <td key={j} className="p-2">{td.trim()}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    tableHeader = [];
    tableRows.length = 0;
    inTable = false;
  };

  const parseInlineFormatting = (line: string): (string | React.ReactElement)[] => {
    // Regex to split by bold, code, and now images
    const parts = line.split(/(\*\*.*?\*\*|`.*?`|!\[.*?\]\(.*?\))/g).filter(Boolean);
    return parts.map((part, pIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={pIndex}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={pIndex} className="bg-gray-700 text-indigo-300 rounded px-1 py-0.5 text-sm">{part.slice(1, -1)}</code>;
        const imageMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
        if (imageMatch) {
            const [, alt, src] = imageMatch;
            return <img key={pIndex} src={src} alt={alt} className="max-w-full my-2 rounded-lg" />;
        }
        return part;
    });
  };
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Table handling
    if (line.trim().startsWith('|')) {
        const columns = line.trim().split('|').slice(1, -1).map(c => c.trim());
        if (columns.length === 0) continue;

        const nextLine = lines[i+1]?.trim();
        if (nextLine && nextLine.match(/^\|(?:\s*:?-{3,}:?\s*\|)+$/)) {
             flushTable();
             inTable = true;
             tableHeader = columns;
             i++;
             continue;
        } else if (inTable) {
             tableRows.push(columns);
             continue;
        }
    } else if (inTable) {
        flushTable();
    }
    
    if (inTable) continue;
    
    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
        const [, alt, src] = imageMatch;
        nodes.push(<img key={i} src={src} alt={alt} className="max-w-full my-2 rounded-lg" />);
        continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={i} className="text-2xl font-bold mt-4 mb-2 border-b border-gray-700 pb-2">{line.substring(2)}</h1>);
    } else if (line.startsWith('## ')) {
      nodes.push(<h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
      nodes.push(<h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.substring(4)}</h3>);
    } 
    // Unordered List
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems = [line.trim().substring(2)];
      while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('- ') || lines[i + 1].trim().startsWith('* '))) {
        i++;
        listItems.push(lines[i].trim().substring(2));
      }
      nodes.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-2 pl-4">
          {listItems.map((item, index) => <li key={index}>{parseInlineFormatting(item)}</li>)}
        </ul>
      );
    } 
    // Paragraphs and inline formatting
    else {
      if (line.trim() !== '') {
        nodes.push(<p key={i}>{parseInlineFormatting(line)}</p>);
      } else {
        if (nodes.length > 0 && nodes[nodes.length-1]?.type === 'p') {
           nodes.push(<br key={`br-${i}`} />);
        }
      }
    }
  }

  flushTable(); // Flush any remaining table at the end
  return nodes;
};

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parsedContent = parseMarkdown(content || '');
  return <div className="space-y-2">{parsedContent}</div>;
};

export default MarkdownRenderer;
