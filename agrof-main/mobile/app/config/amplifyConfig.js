import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

/**
 * Wire Amplify JS v6 to Gen 2 `amplify_outputs.json`.
 * Replace `amplify_outputs.json` (copy from repo root after `npm run sandbox`) when the backend exists.
 * Does not call `Amplify.configure` until `auth` is present, so Firebase auth keeps working until you deploy.
 */
export function configureAmplify() {
  if (outputs && typeof outputs === 'object' && outputs.auth) {
    Amplify.configure(outputs);
  }
}
