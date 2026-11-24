export const process = {
  people: {
    moveAction: 'Move', moveDesc: 'Time in stage restarts; deals moved to a won or lost stage count in the results.', moveTo: 'Move to stage…', moveTitle_one: 'Move {{count}} deal to “{{name}}”?', moveTitle_other: 'Move {{count}} deals to “{{name}}”?', moved_one: '{{count}} deal moved', moved_other: '{{count}} deals moved', section: 'Contacts and companies', shown: '{{shown}} of {{total}}', allDeals: 'All deals', deals: { open: 'With open deals', none: 'Without open deals' },
    reset: 'Clear filters', colLast: 'Last activity', selected_one: '{{count}} selected', selected_other: '{{count}} selected', clear: 'Clear selection',
    assignTo: 'Assign to…', assign: 'Assign', assignTitle_one: 'Assign {{count}} record to {{name}}?', assignTitle_other: 'Assign {{count}} records to {{name}}?',
    assignDesc: 'The new manager becomes responsible for them and sees them in their lists.', assigned_one: '{{count}} record reassigned', assigned_other: '{{count}} records reassigned',
    deleteTitle_one: 'Delete {{count}} record?', deleteTitle_other: 'Delete {{count}} records?', deleted_one: '{{count}} record deleted', deleted_other: '{{count}} records deleted',
    deleteDesc: { deals: 'Their contacts, companies and activities are kept; the activities are unlinked.', contacts: 'Their deals and activities are kept but unlinked.', companies: 'Their contacts, deals and activities are kept but unlinked.' },
  },
  tasks: {
    none: 'No task', overdueSince: 'Late · {{when}}', filter: 'All tasks', overdue: 'Overdue', today: 'Today', planned: 'Planned',
    noTask: 'No task', buckets: { overdue: 'Overdue', today: 'Today', tomorrow: 'Tomorrow', week: 'This week', later: 'Later', undated: 'No date', done: 'Done' },
  },
  leadSource: {
    title: 'Lead source', platform: 'Platform', campaign: 'Campaign', adset: 'Ad set', ad_name: 'Ad', form_name: 'Form', received: 'Received {{date}}',
    platforms: { instagram: 'Instagram', facebook: 'Facebook', messenger: 'Messenger', whatsapp: 'WhatsApp', audience_network: 'Audience Network', import: 'Import' },
  },
  customFields: {
    title: 'Deal fields', description: 'Your own fields on every deal (amoCRM custom fields): business type, volume, package type…',
    add: 'Add field', label: 'Field name', type: 'Type', options: 'Options', optionsHint: 'One per line', warn: 'Highlight in red',
    warnHint: 'Values that need attention (e.g. below the minimum order)', empty: 'No custom fields yet', saved: 'Field saved',
    deleted: 'Field deleted', deleteTitle: 'Delete “{{name}}”?', deleteDesc: 'Its values are removed from every deal.',
    types: { text: 'Text', number: 'Number', select: 'List', multiselect: 'Multi-list', date: 'Date' },
  },
  lostReasons: {
    deleteTitle: 'Remove this reason?', title: 'Loss reasons', description: 'A fixed list keeps the win/loss report countable.', add: 'Add reason', placeholder: 'e.g. Price too high',
    empty: 'Built-in reasons are used until you add your own', saved: 'Reason added', deleted: 'Reason removed',
  },
  importer: {
    button: 'Import', title: 'Import deals from Excel / CSV', pick: 'Choose an .xlsx or .csv file', pickHint: 'Meta lead exports and your own sheets. Up to 5 MB.',
    reading: 'Reading the file…', rows_one: '{{count}} row', rows_other: '{{count}} rows', pipeline: 'Pipeline', column: 'Column', sample: 'Example', target: 'Goes to',
    newField: 'New field', newFieldType: 'Type', existingField: 'Field', run: 'Import {{count}} rows', running: 'Importing…',
    doneTitle: 'Import finished', created: 'New deals', updated: 'Updated', skipped: 'Skipped (empty or test)', tasks: 'Tasks created',
    stagesCreated: 'New stages', fieldsCreated: 'New fields', unmatched: 'Managers not found — add them in Settings → Team and import again (deals are updated, not duplicated):',
    again: 'Import another file', close: 'Close', reimportHint: 'Importing the same file again updates the deals instead of duplicating them.',
    targets: {
      ignore: 'Skip', external_id: 'Lead ID', title: 'Deal name', contact_name: 'Contact name', phone: 'Phone', email: 'E-mail', created_at: 'Created at',
      stage: 'Stage', owner: 'Manager', amount: 'Amount', source: 'Source', lost_reason: 'Loss reason', note: 'Note', next_contact: 'Next contact (task)',
      platform: 'Platform', campaign: 'Campaign', adset: 'Ad set', ad_name: 'Ad', form_name: 'Form', custom: 'Existing field', new_custom: 'New field',
    },
  },
  reports: {
    nav: 'Reports', title: 'Lead report', description: 'Funnel, sources and managers for the chosen period — like your spreadsheet report, live.',
    from: 'From', to: 'To', presets: { today: 'Today', week: '7 days', month: '30 days', quarter: '90 days' },
    total: 'Leads', won: 'Won', lost: 'Lost', open: 'In progress', conversion: 'Conversion', warnings: 'Need attention', overdue: 'Overdue contacts',
    today: 'Contacts today', noTask: 'Without a task', funnel: 'Sales funnel', funnelDesc: 'Leads by current stage', stage: 'Stage', count: 'Leads',
    share: '% of all', warnCol: 'Need attention', label: 'Value', empty: 'No leads in this period', emptyDesc: 'Choose another period or pipeline.',
    unset: 'Not set', totalRow: 'Total',
    groups: { owner: 'Managers', platform: 'Platforms', campaign: 'Campaigns', adset: 'Ad sets', ad_name: 'Ads', source: 'Sources', lost_reason: 'Loss reasons' },
  },
}
