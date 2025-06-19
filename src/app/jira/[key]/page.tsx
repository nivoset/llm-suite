'use client';

import { use } from 'react';
import { JiraDetailView } from '~/components/JiraDetailView';

interface JiraDetailPageProps {
  params: Promise<{
    key: string;
  }>;
}

export default function JiraDetailPage({ params }: JiraDetailPageProps) {
  const { key } = use(params);
  return <JiraDetailView issueKey={key} />;
} 