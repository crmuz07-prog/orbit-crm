export const record = {
  pipelines: {
    title: 'Pipelines', description: 'Each pipeline has its own stages, rules and time limits.', add: 'Add pipeline', name: 'Pipeline name',
    newName: 'New pipeline', created: 'Pipeline created', saved: 'Pipeline saved', deleted: 'Pipeline deleted', default: 'Default', makeDefault: 'Make default',
    deleteConfirm: 'Delete the pipeline “{{name}}”?', deleteDesc: 'Its stages are deleted too. A pipeline with deals can’t be deleted.',
    select: 'Pipeline', rule: 'Stage rule', rulePlaceholder: 'e.g. A lead may not stay here longer than 24 hours', maxDays: 'Max days',
  },
  board: {
    header_one: '{{count}} deal: {{sum}}', header_other: '{{count}} deals: {{sum}}', quickAdd: 'Quick add', quickTitle: 'Deal name', quickAmount: 'Amount',
    inStage_one: '{{count}} day in stage', inStage_other: '{{count}} days in stage', report: 'Deal movement report',
  },
  report: {
    title: 'Deal movement', stage: 'Stage', now: 'Now', entered: 'Entered', avgTime: 'Avg. time in stage',
    days_one: 'Last {{count}} day', days_other: 'Last {{count}} days',
  },
  feed: {
    today: 'Today', yesterday: 'Yesterday', created: 'created the record', createdIn: 'created the deal in «{{stage}}»',
    set: 'set «{{field}}» to «{{value}}»', cleared: 'cleared «{{field}}»', moved: 'moved the deal from «{{from}}» to «{{to}}»',
    system: 'System', noTasks: 'No planned tasks — we recommend to', addTask: 'add one', empty: 'Nothing here yet. Write a note or log a call below.',
  },
  card: { linked: 'Linked', main: 'Main', stageTimes: 'Time in stages', saved: 'Saved', edit: 'Click to edit', none: 'Not set' },
  feedFields: {
    title: 'Name', amount: 'Budget', currency: 'Currency', company_id: 'Company', contact_id: 'Contact', owner_id: 'Owner', priority: 'Priority',
    source: 'Source', expected_close_date: 'Expected close', lost_reason: 'Lost reason', name: 'Name', domain: 'Website', industry: 'Industry',
    employees: 'Employees', country: 'Country', city: 'City', annual_revenue: 'Annual revenue', lifecycle: 'Lifecycle stage', description: 'Description',
    first_name: 'First name', last_name: 'Last name', email: 'Email', phone: 'Phone', title_job: 'Job title', linkedin_url: 'LinkedIn',
  },
  duration: { d: '{{count}} d', h: '{{count}} h', m: '{{count}} min', lessThanMinute: '< 1 min' },
}
