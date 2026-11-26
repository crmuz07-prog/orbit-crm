export const access = {
  access: {
    title: 'Roles & access', description: 'What members can see and do. Owners and admins always have full access.',
    newRole: 'New role', editRole: 'Edit role', roleName: 'Role name', default: 'Default', makeDefault: 'Make default',
    members_one: '{{count}} member', members_other: '{{count}} members', saved: 'Role saved', created: 'Role created', deleted: 'Role deleted',
    deleteConfirm: 'Delete the role “{{name}}”?', deleteDesc: 'Its members move to the default role.', module: 'Section', scope: 'Records',
    accessRole: 'Access role', fullAccess: 'Full access', noTeam: 'No team', team: 'Sales team',
    modules: { companies: 'Companies', contacts: 'Contacts', deals: 'Deals', activities: 'Activities & calls', reports: 'Reports & dashboard' },
    actions: { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', export: 'Export' },
    scopes: { own: 'Own', team: 'Team', all: 'All' },
    scopeHint: 'Own — records they own · Team — their sales team and unassigned records · All — the whole workspace.',
  },
  teams: {
    title: 'Sales teams', description: 'Group reps so team leads see their team’s pipeline.', name: 'Team name', add: 'Add team',
    created: 'Team created', renamed: 'Team renamed', deleted: 'Team deleted', deleteConfirm: 'Delete the team “{{name}}”?',
    deleteDesc: 'Members stay in the workspace without a team.', empty: 'No teams yet',
  },
  owner: { label: 'Owner', unassigned: 'Unassigned', me: 'Me', all: 'All managers' },
  noAccess: { title: 'No access to this section', desc: 'Ask an administrator to change your access role.' },
  crash: { title: 'Something went wrong', desc: 'The page could not be displayed. Reloading usually fixes it.', reload: 'Reload' },
  exportCsv: 'Export CSV', exported: 'Export downloaded',
  security: { tab: 'Security', title: 'Sign-in attempts', email: 'Login', ip: 'IP address', result: 'Result', time: 'Time', success: 'Success', failed: 'Failed', empty: 'No sign-in attempts yet' },
}
