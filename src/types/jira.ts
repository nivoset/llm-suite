export interface JiraDocument {
  pageContent: string;
  metadata: {
    id: string;
    key: string;
    title: string;
    description?: string;
    status: string;
    statusCategory?: string;
    assignee?: string;
    assigneeEmail?: string;
    assigneeAvatar?: string;
    reporter?: string;
    reporterEmail?: string;
    reporterAvatar?: string;
    priority?: string;
    priorityIcon?: string;
    labels?: string[];
    created?: string;
    updated?: string;
    dueDate?: string;
    components?: string[];
    issueType?: string;
    issueTypeIcon?: string;
    issueUrl: string;
    rawFields: Record<string, any>;
  };
} 