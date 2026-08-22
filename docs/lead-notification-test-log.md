# Lead Notification Test Log

## 22 August 2026

- A public buyer-financing test submission was prepared but **not submitted**, because Cloudflare Turnstile required manual human verification. No lead or email was created from that public form attempt.
- The ADMIN-only **Envoyer un test** control in `/admin/settings` was deployed and invoked to test the notification email without bypassing CAPTCHA or creating customer data.
- The resulting provider acceptance status is being checked through the protected administrator workflow.

The rendered control is a React-managed server-action form. The initial automated click did not produce a visible state result or audit entry, so the hydrated action is being retried while preserving the same ADMIN-only authorization boundary.

The repaired ADMIN-only endpoint was invoked in an authenticated administrator session on 22 August 2026. The email provider accepted the test for **3 ADMIN recipients** and returned message identifier `997966e2-83ff-40e2-9f80-a9b3c44d04bc`.
