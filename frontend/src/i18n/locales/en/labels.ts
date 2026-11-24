export const labels = {
  defaults: {
    stage: { leadIn: 'Lead In', qualified: 'Qualified', discovery: 'Discovery / Demo', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Closed Won', lost: 'Closed Lost' },
    pipeline: { sales: 'Sales pipeline' },
    role: { salesRep: 'Sales rep', teamLead: 'Team lead', viewer: 'Viewer' },
  },
  options: {
    source: { inbound: 'Inbound', outbound: 'Outbound', referral: 'Referral', partner: 'Partner', event: 'Event', website: 'Website' },
    industry: {
      saas: 'SaaS', fintech: 'Fintech', logistics: 'Logistics', manufacturing: 'Manufacturing', healthcare: 'Healthcare', energy: 'Energy',
      retail: 'Retail', telecom: 'Telecom', education: 'Education', aerospace: 'Aerospace', food: 'Food & Beverage', mining: 'Mining',
      cybersecurity: 'Cybersecurity', other: 'Other',
    },
  },
  examples: {
    companyName: 'Acme Inc.', domain: 'acme.com', country: 'Germany', city: 'Berlin', jobTitle: 'Head of Procurement',
    dealName: 'Acme — Enterprise licence', personName: 'Alex Morgan', email: 'you@company.com',
  },
  datePicker: { placeholder: 'Pick a date', clear: 'Clear date', time: 'Time', hour: 'Hour', minute: 'Min' },
  misc: { autoCall: '{{direction}} call · {{name}}', callBack: 'Call back {{phone}}', demo: 'Demo', close: 'Close' },
}
