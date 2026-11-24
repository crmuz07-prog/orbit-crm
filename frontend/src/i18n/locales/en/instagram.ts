export const instagram = {
  instagram: {
    nav: 'Instagram', title: 'Instagram leads', description: 'Direct conversations and lead ads from your Instagram account.',
    leads: 'Leads', messages: 'Direct conversations', leadForms: 'Lead forms', won: 'Won', conversion: 'Conversion',
    avgResponse: 'Avg. first reply', unanswered: 'Waiting for a reply', perDay: 'Leads per day', perDayDesc: 'New conversations and lead forms',
    topAds: 'Top ads', topAdsDesc: 'Ads that brought the most leads', ad: 'Ad', noAds: 'No lead ads in this period',
    latest: 'Latest leads', latestDesc: 'Newest Instagram deals', empty: 'No Instagram leads yet',
    emptyDesc: 'Connect Instagram in Settings, or send a test message to see how leads arrive.', openSettings: 'Instagram settings',
    simulateMessage: 'Test message', simulateLead: 'Test lead form', simulated: 'Test lead received',
    kind: { message: 'Direct', lead_form: 'Lead form' },
  },
  igSettings: {
    title: 'Instagram', description: 'Direct messages and lead ads come into the CRM automatically through the Meta Graph API.',
    callbackUrl: 'Callback URL', verifyToken: 'Verify token', appSecret: 'App secret', accessToken: 'Page access token',
    accountId: 'Instagram account ID', stage: 'New leads go to', owner: 'Owner of new leads', saved: 'Instagram settings saved',
    secretSet: 'Saved — type a new value to replace it', connected: 'Connected', notConnected: 'Not connected', lastEvent: 'Last event {{time}}',
    steps: 'How to connect', step1: 'Switch Instagram to a Business account and link it to a Facebook Page.',
    step2: 'Create an app at developers.facebook.com and add the Webhooks and Instagram / Messenger products.',
    step3: 'Paste the callback URL and verify token into the webhook settings; subscribe to messages and leadgen.',
    step4: 'Copy the app secret and the Page access token here. Development mode works for your own account without App Review.',
    rotate: 'Rotate tokens', rotated: 'New callback URL and verify token issued',
    rotateConfirm: 'Issue a new callback URL?', rotateDesc: 'The old URL stops working; update it in the Meta app.',
  },
  igReply: {
    placeholder: 'Reply in Instagram Direct…', send: 'Send', sent: 'Sent to Instagram',
    window: 'Replies are possible within 24 hours of the customer’s last message.', you: 'You',
  },
}
