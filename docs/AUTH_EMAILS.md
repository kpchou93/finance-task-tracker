# Authentication email delivery and recovery

Signup requests a Supabase confirmation email. Sign-in links to `/forgot-password`, which uses Supabase `resetPasswordForEmail` with the fixed production return URL `/auth/recovery`. This callback exchanges the PKCE code for a session and redirects to `/reset-password`. Default email links must be opened in the browser that requested them. Optional custom templates can use `token_hash` with the appropriate `signup` or `recovery` type; other types are rejected.

The password form and server action both require a verified authenticated user. Passwords must be 8–128 characters and match the confirmation. Successful update ends the local session and asks the user to sign in again. Responses do not identify whether the requested email has an account. Missing, expired and invalid links lead to the recovery retry page. Callback responses disable caching and referrer forwarding.

The production Site URL and Vercel production `NEXT_PUBLIC_APP_URL` are `https://finance-task-tracker-pi.vercel.app`. Exact `/auth/callback` and `/auth/recovery` redirect URLs are saved for that host and for the localhost/127.0.0.1 development host. Local builds need `NEXT_PUBLIC_APP_URL` set to the local origin. Callback redirects use this configured origin, not an untrusted host or arbitrary `next` parameter. Keep email confirmation enabled; it is currently on.

Email delivery requires custom SMTP configured in Supabase, with a verified sender domain and provider credentials. SMTP secrets belong in the Supabase SMTP settings, not Vercel variables, browser source, commits or documentation. Resend supports `smtp.resend.com`, port 465, username `resend`, and its API key as the SMTP password. A sender from its verified domain is required. Default Supabase templates are sufficient for the PKCE flow; keep provider link tracking disabled.

Delivery and real-account password changes must be tested by the account holder after SMTP is configured. The app being deployed does not itself mean that SMTP or email delivery is configured.
