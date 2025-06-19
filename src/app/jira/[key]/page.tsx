'use client';

import { JiraDetailView } from '~/components/JiraDetailView';

interface JiraDetailPageProps {
  params: {
    key: string;
  };
}

export default function JiraDetailPage({ params }: JiraDetailPageProps) {
  return <JiraDetailView issueKey={params.key} />;
} 