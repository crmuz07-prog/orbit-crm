export const setup = {
  setup: {
    groups: { personal: 'Personal', team: 'Team', sales: 'Sales', integrations: 'Integrations', data: 'Data' },
    nav: {
      profile: 'Profile', security: 'Password', appearance: 'Appearance', members: 'Users', roles: 'Roles and access', teams: 'Sales teams',
      pipelines: 'Pipelines and stages', fields: 'Deal fields', lostReasons: 'Lost reasons', telephony: 'Telephony', instagram: 'Instagram', data: 'Import and export',
    },
    hideSections: 'Hide sections', showSections: 'Show sections', navLabel: 'Settings sections',
    securityDesc: 'Changing the password signs you out on other devices.',
    stageCols: { name: 'Stage', chance: 'Chance', deals: 'Deals' },
    openStages: 'Working stages', closedStages: 'Final stages', closedHint: 'Deals end up here. A pipeline keeps at least one won and one lost stage.',
    color: 'Colour', rule: 'Rule shown on the board', maxDays: 'Max days in stage',
    stageDelete: {
      title: 'Delete the stage “{{name}}”?', empty: 'It has no deals. This cannot be undone.',
      hasDeals_one: 'It has {{count}} deal. Choose where to move it — the deal history keeps the move.',
      hasDeals_other: 'It has {{count}} deals. Choose where to move them — each deal’s history keeps the move.',
      moveTo: 'Move deals to', pick: 'Choose a stage', action: 'Move and delete', done: 'Stage deleted',
      last: 'This is the only {{kind}} of the pipeline — add another one before deleting it.',
    },
    members: { fullAccess: 'Full access', add: 'Add user', addTitle: 'New user', addDesc: 'Create the login and hand over the temporary password; they change it at first sign-in.',
      role: 'System role', access: 'Access', team: 'Sales team' },
    data: {
      importTitle: 'Import from Excel', importDesc: 'Leads, contacts and companies from an .xlsx or .csv file, with a preview before anything is saved.',
      exportTitle: 'Export to CSV', exportDesc: 'Download a list as it is — for Excel, accounting or a backup.',
      sampleHint: 'Shown only while the workspace is empty, so real data never gets mixed with samples.',
    },
    simulator: 'Try it without a PBX',
  },
}
