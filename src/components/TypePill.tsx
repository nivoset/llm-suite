import React from 'react';

interface TypePillProps {
  type: string;
}

export function TypePill({ type }: TypePillProps) {
  let pillClass = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
  let displayText = type;

  switch (type.toLowerCase()) {
    case 'engineering':
      pillClass = 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      displayText = 'Engineering';
      break;
    case 'architect':
    case 'architecture':
      pillClass = 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
      displayText = 'Architecture';
      break;
    case 'business':
      pillClass = 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      displayText = 'Business';
      break;
    case 'development':
      pillClass = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      displayText = 'Development';
      break;
    case 'testing':
      pillClass = 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      displayText = 'Testing';
      break;
    default:
      displayText = type.charAt(0).toUpperCase() + type.slice(1);
      break;
  }

  const commonClasses = 'inline-block px-2.5 py-0.5 text-xs font-medium rounded-full';

  return (
    <span className={`${commonClasses} ${pillClass}`}>
      {displayText}
    </span>
  );
} 