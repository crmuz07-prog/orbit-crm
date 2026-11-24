export const billing = {
  billing: {
    tab: 'Payments', manage: 'Subscription', status: { active: 'Active', expiring: 'Ending soon', expired: 'Expired', blocked: 'Blocked' },
    paidUntil: 'Paid until', noEnd: 'No end date', seats: 'Seats', unlimited: 'Unlimited', seatsUsed: '{{used}} / {{limit}}',
    recordPayment: 'Record payment', amount: 'Amount (UZS)', months: 'Months', seatsField: 'Seats (optional)', note: 'Note',
    newEnd: 'Paid until after this payment: {{date}}', paymentRecorded: 'Payment recorded', saved: 'Subscription updated',
    limits: 'Limits', seatLimit: 'Seat limit', endDate: 'End date (inclusive)', block: 'Block company', unblock: 'Unblock company',
    blockConfirm: 'Block {{name}}?', blockDesc: 'Every member is shut out of the CRM until the company is unblocked.',
    history: 'Payment history', noPayments: 'No payments yet', total: 'Total received', period: 'Period', company: 'Company', date: 'Date',
    daysLeft_one: '{{count}} day left', daysLeft_other: '{{count}} days left', emptyHint: 'Leave empty for no limit',
    warning_one: 'Your subscription ends in {{count}} day ({{date}}). Contact the platform administrator to renew.',
    warning_other: 'Your subscription ends in {{count}} days ({{date}}). Contact the platform administrator to renew.',
    expiredTitle: 'The subscription has ended', expiredDesc: 'Access to {{name}} is paused. Ask the platform administrator to renew the subscription.',
    blockedTitle: 'The company is blocked', blockedDesc: 'The platform administrator has blocked {{name}}. Please contact them.',
    teamSeats: 'Seats used: {{used}} of {{limit}}',
  },
}
