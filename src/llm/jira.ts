"use server"
import type { JiraProjectLoaderParams } from "@langchain/community/document_loaders/web/jira";
import { fetchJiraIssues, type JiraIssue } from "./jira/client";

const host = process.env.JIRA_HOST!;
const username = process.env.JIRA_USERNAME!;
const accessToken = process.env.JIRA_ACCESS_TOKEN!;

export { type JiraIssue };

export async function loadJiraDocuments(
  props: { projectKey?: string; epicKey?: string | null; jql?: string }
): Promise<JiraIssue[]> {
  // Mock users
  const users = [
    { displayName: 'Alice Smith', emailAddress: 'alice@example.com', avatarUrls: { '48x48': 'https://example.com/avatar/alice.png' }, accountId: 'alice-1', accountType: 'atlassian', active: true, self: '', timeZone: 'UTC' },
    { displayName: 'Bob Johnson', emailAddress: 'bob@example.com', avatarUrls: { '48x48': 'https://example.com/avatar/bob.png' }, accountId: 'bob-1', accountType: 'atlassian', active: true, self: '', timeZone: 'UTC' },
    { displayName: 'Charlie Lee', emailAddress: 'charlie@example.com', avatarUrls: { '48x48': 'https://example.com/avatar/charlie.png' }, accountId: 'charlie-1', accountType: 'atlassian', active: true, self: '', timeZone: 'UTC' },
    { displayName: 'Dana Wu', emailAddress: 'dana@example.com', avatarUrls: { '48x48': 'https://example.com/avatar/dana.png' }, accountId: 'dana-1', accountType: 'atlassian', active: true, self: '', timeZone: 'UTC' },
  ];

  // Epic: Enterprise SSO Integration (extremely verbose, regulatory, references, Gherkin)
  const gherkinCriteria = [
    `Feature: SSO Login\n  As an enterprise user\n  I want to log in using my corporate SSO\n  So that I can access the platform securely`,
    `Scenario: Successful SAML login\n  Given I am on the login page\n  When I select SSO and authenticate with Okta\n  Then I am redirected to the dashboard`,
    `Scenario: OIDC login with Google\n  Given I am on the login page\n  When I select SSO and authenticate with Google\n  Then my user profile is created if new`,
    `Scenario: Role mapping from IdP\n  Given my IdP provides a role claim\n  When I log in via SSO\n  Then my platform role matches the IdP role`,
    `Scenario: SAML assertion logging\n  Given a user logs in via SAML\n  Then the assertion is logged for audit purposes`,
    `Scenario: User deprovisioning\n  Given a user is removed from the IdP\n  When a sync runs\n  Then the user is deactivated in the platform`,
    `Scenario: Regulatory compliance logging\n  Given any SSO login\n  Then all authentication events are logged per SOX/ISO27001`,
    `Scenario: SSO error handling\n  Given an IdP is unreachable\n  Then the user sees a clear error message`,
    `Scenario: SSO documentation\n  Given the feature is live\n  Then documentation is available for IT admins`,
    `Scenario: Security review\n  Given the feature is ready\n  Then it passes a security review by the InfoSec team`,
  ];

  const epic = {
    id: '10010',
    key: 'SCRUM-100',
    expand: '',
    self: 'https://jira.example.com/rest/api/2/issue/10010',
    fields: {
      summary: 'Enterprise SSO Integration',
      description: `# Enterprise SSO Integration\n\n## Business Context\nThis feature is required for onboarding Fortune 500 clients and is a contractual obligation for Q3.\n\n## Regulatory Requirements\n- All authentication events must be logged and retained for 7 years (SOX, ISO27001)\n- SSO must support SAML 2.0 and OIDC 1.0\n- User deprovisioning must occur within 24 hours of IdP removal (GDPR, CCPA)\n- All data in transit must be encrypted (TLS 1.2+)\n\n## References\n- [SSO Architecture Doc](https://confluence.example.com/display/SEC/SSO+Architecture)\n- [SOX Controls](https://confluence.example.com/display/REG/SOX+Controls)\n- [ISO27001 Policy](https://confluence.example.com/display/REG/ISO27001)\n- [GDPR Guidelines](https://confluence.example.com/display/REG/GDPR)\n\n## Technical Notes\n- Use passport-saml and oidc-client\n- Integrate with User Directory v2\n- Audit logging via Splunk\n- All endpoints must be covered by automated tests\n\n## Acceptance Criteria (Gherkin)\n${gherkinCriteria.map((c, i) => `### AC${i+1}\n${c}`).join('\n\n')}\n\n## Risks\n- Downstream system (User Directory v2) not yet deployed (BLOCKER)\n- Legacy user migration complexity\n- Regulatory audit scheduled for July\n\n## Stakeholders\n- IT Security\n- Compliance\n- Enterprise Customer Success\n\n## Attachments\n- SSO-ENT-2024-ARCH.pdf\n- idp-mapping.xlsx\n`,
      status: { name: 'In Progress', statusCategory: { key: 'in-progress', name: 'In Progress', colorName: 'yellow' } },
      assignee: users[0],
      reporter: users[1],
      priority: { name: 'Highest', iconUrl: 'https://example.com/priority/highest.png' },
      labels: ['sso', 'enterprise', 'security', 'feature', 'regulatory', 'sox', 'iso27001', 'gdpr'],
      created: '2024-04-01T08:00:00.000Z',
      updated: '2024-06-10T10:00:00.000Z',
      duedate: '2024-07-01',
      components: [{ name: 'Authentication' }, { name: 'Frontend' }, { name: 'Backend' }, { name: 'Compliance' }],
      issuetype: { name: 'Epic', iconUrl: 'https://example.com/issuetype/epic.png' },
      issuelinks: [
        { id: 'link-1', self: '', type: { id: '1', name: 'Blocks', inward: 'is blocked by', outward: 'blocks', self: '' }, outwardIssue: { id: '10014', key: 'SCRUM-104', self: '', fields: { summary: 'Wait for User Directory v2 Deployment', status: { name: 'Blocked', statusCategory: { key: 'blocked', name: 'Blocked', colorName: 'red' } }, priority: { name: 'Highest', iconUrl: '' }, issuetype: { name: 'Task', iconUrl: '' } } } }
      ],
      progress: { progress: 5, total: 10 },
      project: { id: '20001', key: 'SCRUM', name: 'Scrum Example Project' },
      creator: users[1],
      subtasks: [],
      customfield_10011: 'SSO-ENT-2024',
      watchers: [users[2], users[3]],
      attachments: [
        { id: 'att-1', filename: 'sso-architecture.pdf', content: 'https://example.com/attachments/sso-architecture.pdf', mimeType: 'application/pdf' },
        { id: 'att-2', filename: 'idp-mapping.xlsx', content: 'https://example.com/attachments/idp-mapping.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      ],
      comment: {
        comments: [
          { id: 'c1', author: users[2], body: 'Will this support SAML logout?', created: '2024-05-01T12:00:00.000Z' },
          { id: 'c2', author: users[0], body: 'Yes, SAML logout is in scope for phase 2.', created: '2024-05-02T09:00:00.000Z' },
          { id: 'c3', author: users[3], body: 'Regulatory review scheduled for July 10.', created: '2024-06-01T10:00:00.000Z' },
          { id: 'c4', author: users[1], body: 'Added GDPR compliance checklist.', created: '2024-06-05T14:00:00.000Z' },
        ],
      },
      sprint: { id: 'sprint-1', name: 'Sprint 24.06', state: 'active', startDate: '2024-06-01', endDate: '2024-06-14' },
    },
  };

  // Stories under the epic (each references some Gherkin ACs)
  const stories = [
    {
      id: '10011',
      key: 'SCRUM-101',
      expand: '',
      self: 'https://jira.example.com/rest/api/2/issue/10011',
      fields: {
        summary: 'Implement SAML SSO',
        description: `Implements AC1, AC2, AC4, AC5.\n\n${gherkinCriteria[0]}\n\n${gherkinCriteria[1]}\n\n${gherkinCriteria[3]}\n\n${gherkinCriteria[4]}\n\nTechnical: Use passport-saml, Okta/Azure AD integration.\nAudit: All SAML assertions must be logged.`,
        status: { name: 'Done', statusCategory: { key: 'done', name: 'Done', colorName: 'green' } },
        assignee: users[2],
        reporter: users[0],
        priority: { name: 'High', iconUrl: 'https://example.com/priority/high.png' },
        labels: ['sso', 'saml', 'audit'],
        created: '2024-04-10T09:00:00.000Z',
        updated: '2024-05-01T10:00:00.000Z',
        duedate: '2024-05-01',
        components: [{ name: 'Authentication' }, { name: 'Compliance' }],
        issuetype: { name: 'Story', iconUrl: 'https://example.com/issuetype/story.png' },
        parent: { id: '10010', key: 'SCRUM-100', self: '', fields: { summary: epic.fields.summary, status: epic.fields.status, priority: epic.fields.priority, issuetype: epic.fields.issuetype } },
        issuelinks: [],
        progress: { progress: 3, total: 3 },
        project: epic.fields.project,
        creator: users[0],
        subtasks: [
          { id: '20001', key: 'SCRUM-101A', self: '', fields: { summary: 'Configure Okta SAML App', status: { name: 'Done', statusCategory: { key: 'done', name: 'Done', colorName: 'green' } }, issuetype: { name: 'Sub-task', iconUrl: '' } } },
          { id: '20002', key: 'SCRUM-101B', self: '', fields: { summary: 'Configure Azure AD SAML App', status: { name: 'Done', statusCategory: { key: 'done', name: 'Done', colorName: 'green' } }, issuetype: { name: 'Sub-task', iconUrl: '' } } },
        ],
        customfield_10012: 'SAML',
        comment: { comments: [{ id: 'c5', author: users[3], body: 'SAML integration tested with Okta.', created: '2024-04-15T11:00:00.000Z' }] },
        sprint: epic.fields.sprint,
      },
    },
    {
      id: '10012',
      key: 'SCRUM-102',
      expand: '',
      self: 'https://jira.example.com/rest/api/2/issue/10012',
      fields: {
        summary: 'Implement OIDC SSO',
        description: `Implements AC1, AC3, AC4, AC7.\n\n${gherkinCriteria[0]}\n\n${gherkinCriteria[2]}\n\n${gherkinCriteria[3]}\n\n${gherkinCriteria[6]}\n\nTechnical: Use oidc-client, Google/custom IdP integration.\nCompliance: All authentication events logged per SOX/ISO27001.`,
        status: { name: 'In Progress', statusCategory: { key: 'in-progress', name: 'In Progress', colorName: 'yellow' } },
        assignee: users[3],
        reporter: users[0],
        priority: { name: 'Medium', iconUrl: 'https://example.com/priority/medium.png' },
        labels: ['sso', 'oidc', 'compliance'],
        created: '2024-05-01T10:00:00.000Z',
        updated: '2024-06-10T10:00:00.000Z',
        duedate: '2024-06-15',
        components: [{ name: 'Authentication' }, { name: 'Frontend' }, { name: 'Compliance' }],
        issuetype: { name: 'Story', iconUrl: 'https://example.com/issuetype/story.png' },
        parent: { id: '10010', key: 'SCRUM-100', self: '', fields: { summary: epic.fields.summary, status: epic.fields.status, priority: epic.fields.priority, issuetype: epic.fields.issuetype } },
        issuelinks: [],
        progress: { progress: 1, total: 3 },
        project: epic.fields.project,
        creator: users[0],
        subtasks: [
          { id: '20003', key: 'SCRUM-102A', self: '', fields: { summary: 'Set up Google OIDC', status: { name: 'Done', statusCategory: { key: 'done', name: 'Done', colorName: 'green' } }, issuetype: { name: 'Sub-task', iconUrl: '' } } },
          { id: '20004', key: 'SCRUM-102B', self: '', fields: { summary: 'Set up custom IdP OIDC', status: { name: 'To Do', statusCategory: { key: 'to-do', name: 'To Do', colorName: 'blue' } }, issuetype: { name: 'Sub-task', iconUrl: '' } } },
        ],
        customfield_10012: 'OIDC',
        comment: { comments: [{ id: 'c6', author: users[1], body: 'OIDC claims mapping doc uploaded.', created: '2024-06-01T10:00:00.000Z' }] },
        sprint: epic.fields.sprint,
      },
    },
    {
      id: '10013',
      key: 'SCRUM-103',
      expand: '',
      self: 'https://jira.example.com/rest/api/2/issue/10013',
      fields: {
        summary: 'Provision Users from IdP',
        description: `Implements AC4, AC6, AC7.\n\n${gherkinCriteria[3]}\n\n${gherkinCriteria[5]}\n\n${gherkinCriteria[6]}\n\nSync users and groups from IdP to internal directory.\nCompliance: User deprovisioning and audit logging.`,
        status: { name: 'To Do', statusCategory: { key: 'to-do', name: 'To Do', colorName: 'blue' } },
        assignee: users[1],
        reporter: users[0],
        priority: { name: 'Medium', iconUrl: 'https://example.com/priority/medium.png' },
        labels: ['provisioning', 'idp', 'compliance'],
        created: '2024-06-01T10:00:00.000Z',
        updated: '2024-06-10T10:00:00.000Z',
        duedate: '2024-06-20',
        components: [{ name: 'Backend' }, { name: 'Compliance' }],
        issuetype: { name: 'Story', iconUrl: 'https://example.com/issuetype/story.png' },
        parent: { id: '10010', key: 'SCRUM-100', self: '', fields: { summary: epic.fields.summary, status: epic.fields.status, priority: epic.fields.priority, issuetype: epic.fields.issuetype } },
        issuelinks: [],
        progress: { progress: 0, total: 2 },
        project: epic.fields.project,
        creator: users[0],
        subtasks: [],
        customfield_10012: 'Provisioning',
        comment: { comments: [{ id: 'c7', author: users[2], body: 'Provisioning logic reviewed by compliance.', created: '2024-06-10T10:00:00.000Z' }] },
        sprint: epic.fields.sprint,
      },
    },
    // Blocker story
    {
      id: '10014',
      key: 'SCRUM-104',
      expand: '',
      self: 'https://jira.example.com/rest/api/2/issue/10014',
      fields: {
        summary: 'Wait for User Directory v2 Deployment',
        description: `Implements AC9.\n\n${gherkinCriteria[8]}\n\nCannot proceed with SSO go-live until User Directory v2 is deployed by the infrastructure team.\nAcceptance Criteria: User Directory v2 is available in staging, API contract is stable.`,
        status: { name: 'Blocked', statusCategory: { key: 'blocked', name: 'Blocked', colorName: 'red' } },
        assignee: users[3],
        reporter: users[0],
        priority: { name: 'Highest', iconUrl: 'https://example.com/priority/highest.png' },
        labels: ['blocker', 'infra', 'documentation'],
        created: '2024-06-01T10:00:00.000Z',
        updated: '2024-06-10T10:00:00.000Z',
        duedate: '2024-06-30',
        components: [{ name: 'Infrastructure' }, { name: 'Compliance' }],
        issuetype: { name: 'Task', iconUrl: 'https://example.com/issuetype/task.png' },
        parent: { id: '10010', key: 'SCRUM-100', self: '', fields: { summary: epic.fields.summary, status: epic.fields.status, priority: epic.fields.priority, issuetype: epic.fields.issuetype } },
        issuelinks: [
          { id: 'link-2', self: '', type: { id: '1', name: 'Blocks', inward: 'is blocked by', outward: 'blocks', self: '' }, inwardIssue: { id: '10010', key: 'SCRUM-100', self: '', fields: { summary: epic.fields.summary, status: epic.fields.status, priority: epic.fields.priority, issuetype: epic.fields.issuetype } } }
        ],
        progress: { progress: 0, total: 1 },
        project: epic.fields.project,
        creator: users[0],
        subtasks: [],
        customfield_10012: 'Blocker',
        comment: { comments: [{ id: 'c8', author: users[1], body: 'Infra team ETA is June 30. Documentation pending.', created: '2024-06-10T10:00:00.000Z' }] },
        sprint: epic.fields.sprint,
      },
    },
  ];

  // Filter logic for epicKey or projectKey if needed
  if (props.epicKey) {
    return stories.filter(story => story.fields.parent && story.fields.parent.key === props.epicKey);
  }
  return [epic, ...stories];
} 