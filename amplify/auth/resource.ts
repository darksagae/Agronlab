import { defineAuth } from '@aws-amplify/backend';

/**
 * Verification email copy + SES sender (requires agron.uk verified in Amazon SES in the same region as Cognito).
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Your AGRON verification code',
      verificationEmailBody: (createCode) =>
        `Welcome to AGRON — your crop health companion.\n\nYour verification code is ${createCode()}.\n\nIf you didn’t sign up for AGRON, you can ignore this email.`,
    },
  },
  senders: {
    email: {
      fromEmail: 'noreply@agron.uk',
      fromName: 'AGRON',
      replyTo: 'support@agron.uk',
    },
  },
});
