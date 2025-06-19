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
    epicKey?: string;
    epicTitle?: string;
    epicColor?: string;
    childIssues?: Array<{
      key: string;
      title: string;
      status: string;
    }>;
    rawFields: Record<string, any>;
  };
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype: {
      name: string;
      iconUrl?: string;
    };
    priority?: {
      name: string;
      iconUrl?: string;
    };
    status: {
      name: string;
      statusCategory?: {
        key: string;
        colorName?: string;
      };
    };
    created: string;
    updated: string;
    assignee?: {
      displayName: string;
      emailAddress?: string;
      avatarUrls?: {
        [key: string]: string;
      };
    };
    reporter?: {
      displayName: string;
      emailAddress?: string;
      avatarUrls?: {
        [key: string]: string;
      };
    };
    labels?: string[];
    components?: {
      name: string;
      description?: string;
    }[];
    fixVersions?: {
      name: string;
      description?: string;
      releaseDate?: string;
    }[];
    customfields?: {
      [key: string]: any;
    };
    parent?: {
      key: string;
      fields: {
        summary: string;
        status: {
          name: string;
        };
      };
    };
    issuelinks?: Array<{
      type: {
        name: string;
        inward: string;
        outward: string;
      };
      inwardIssue?: {
        key: string;
        fields: {
          summary: string;
          status: {
            name: string;
          };
        };
      };
      outwardIssue?: {
        key: string;
        fields: {
          summary: string;
          status: {
            name: string;
          };
        };
      };
    }>;
  };
} 