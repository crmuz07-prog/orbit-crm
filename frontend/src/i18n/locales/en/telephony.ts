export const telephony = {
  telephony: {
    title: 'Telephony', description: 'Calls through your PBX / VoIP number are logged automatically.',
    howTitle: 'How automatic logging works',
    how1: 'Connect your cloud PBX (OnlinePBX, Zadarma, UTEL, Sipuni, Asterisk, Twilio…) and paste the webhook URL below.',
    how2: 'On every call the PBX notifies Orbit: the caller is matched to a contact, the deal is linked and the call is saved.',
    how3: 'A pop-up appears during the call; after hang-up you write what was discussed. Missed calls become call-back tasks.',
    webhookUrl: 'Webhook URL', secret: 'Signing secret', signatureHint: 'Send header X-Orbit-Signature: sha256=HMAC(body, secret)',
    copy: 'Copy', copied: 'Copied', reveal: 'Show', hide: 'Hide', rotate: 'Regenerate', rotated: 'New URL and secret generated',
    rotateConfirm: 'Regenerate webhook credentials?', rotateConfirmDesc: 'The old URL stops working immediately — update it in your PBX.',
    payload: 'Event payload', createUnknown: 'Create a contact for unknown numbers', callbackTask: 'Create a call-back task for missed calls',
    simulator: 'Call simulator', simulatorDesc: 'Test the full pipeline without a PBX.', phone: 'Phone number', pickContact: 'Contact',
    startCall: 'Simulate call', endCall: 'Hang up', status: 'Result',
    incoming: 'Incoming call', outgoing: 'Outgoing call', ringing: 'Ringing…', onCall: 'On call', ended: 'Call ended',
    openRecord: 'Open', dismiss: 'Dismiss', wrapUp: 'Write what was discussed', missedTask: 'Missed — a call-back task was created',
    unknown: 'Unknown number', auto: 'Auto', recording: 'Recording', needsSummary: 'Write summary', wrapUpTitle: 'Call summary',
    wrapUpSaved: 'Call summary saved', live: 'Live',
  },
}
