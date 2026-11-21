# FirstByte — DevNest Contests (Lite v14, Supabase wired)

## Copy-paste block, certificate control, contest look (v14)
- **Copy & paste are blocked for participants while the contest is live** (copy, cut, paste and right-click), with a short message when they try. The Admin panel is exempt, so the admin can still copy and paste there. Before the contest starts and after it ends, copy-paste works normally.
- **Certificate control (Admin → Certificate):** a "Show certificate to participants now" checkbox — when on, participants can get their certificate right away, even before the contest ends (scores stay hidden until the end). When off, the certificate appears automatically after the contest ends. You can also **change the certificate design**: choose an image file (max 2 MB, under 500 KB is best) and it is saved into the shared database, so every participant sees the new design. "Reset to the built-in design" goes back to the original. The name and date are overlaid at fixed positions tuned for the current design — if the team's new design puts the name elsewhere, the positions need adjusting.
- **New contest look:** the site now looks like a coding contest platform, not the DevNest club site — "FirstByte" branding with a CODING CONTEST tag, a stats row (problems, minutes, languages, points), the questions as a contest table with difficulty badges and points, and a timer bar. DevNest stays credited in the footer as the organiser.
- **After deploying v14, run these two ALTERs** in the Supabase SQL Editor (the site works without them, but the certificate settings will not sync to the shared database until they exist):
  `alter table public.firstbyte_config add column if not exists cert_open boolean not null default false;`
  `alter table public.firstbyte_config add column if not exists cert_image text;`

## Example in each description (v13)
- Every question's description now ends with one worked example (the sample input and output from the PDF), e.g. Factorial: Input 5 → Output 120. The arena renders the description with line breaks kept, so the example shows on separate lines.
- **After deploying v13, click Admin → Questions → "Reset to built-in set"** so the live site picks up the new descriptions (the shared database still holds the old ones until you do).

## Questions + admin PIN (v12)
- Only the 5 questions from the contest PDF now (Factorial of a Number, Swap Two Numbers, Reverse a Number, Count Vowels in a String, GCD of Two Numbers). The 3 LeetCode-style questions (Two Sum, Reverse an Array, Valid Parentheses) were removed.
- **After deploying v12, click Admin → Questions → "Reset to built-in set"** so the live site drops the 3 LeetCode questions too (the shared database still holds the old set until you do). Your earlier submissions for those 3 stay visible in Admin, but they no longer count in any score.
- **Admin PIN is now in .env, not in the code.** The browser sends the PIN to POST /api/admin, which checks it server-side against ADMIN_PIN. Local runs: copy .env.example to .env and set ADMIN_PIN (server.cjs reads it). Vercel: set ADMIN_PIN in Project Settings → Environment Variables and redeploy — a .env file is not read in production. Default when unset: devnest. The PIN no longer appears in the page source.

## Questions (v12)
- Only the 5 questions from the contest PDF, nothing else (per your call on 21 Nov): Factorial of a Number, Swap Two Numbers, Reverse a Number, Count Vowels in a String, GCD of Two Numbers — sample input/output exactly as in the PDF. The 3 LeetCode-style questions from v11 (Two Sum, Reverse an Array, Valid Parentheses) are removed from the built-in set. All 5 have Python and C starters that read the input and leave the solution to the participant.
- The PDF's constraints render as 10^9 (the PDF's superscript came through as "10n" in the extracted text; if it was meant to be a different power, edit the statement in Admin → Questions).
- The Vowels starter reads the whole line (fgets in C, read().rstrip in Python) because the sample input "hello world" contains a space — scanf %s would stop at the space.
- Admin → Questions has a "Reset to built-in set" button: it replaces ALL questions with the built-in 5 and saves. Use it once after deploying v12 — see below.
- **After deploying v12, the site still shows the old questions until you click that button.** The live site loads its question set from the shared database, and the code never overwrites the admin's saved config (that was the v9 config-overwrite fix). So: deploy, open Admin → Questions, click "Reset to built-in set", done. The reset is saved to the shared database, so every participant sees the 5 questions from then on. Note: any test submissions/progress on the removed Two Sum / Reverse an Array / Valid Parentheses will no longer show (those questions are no longer in the set); the 5 PDF questions and their progress are untouched. Duration stays 60 minutes — change it in Admin → Contest if you want more/less time for 5 questions.

## Bug fixes (v10)
- **Verified state no longer lost on pull:** the 5-second pull used to replace each progress record wholesale with the cloud copy, wiping the local-only `lastVerifiedCode`/`verifiedAt` (the cloud columns don't include them), so verify → wait → submit came back "not counted as solved". The pull now merges per field — cloud wins on the synced fields, local-only fields survive.
- **Clear submissions on real Supabase:** the DELETE had no filter, which Supabase rejects ("DELETE requires a WHERE clause"). Deletes now carry a filter that matches every row (`?id=not.is.null` for submissions, `?email=not.is.null` for progress). Verified against the real project on throwaway rows (a selective filtered DELETE removes only that row; the `not.is.null` filter parses on the real API). The unfiltered form was NOT tested on the real project because the tables hold real data — the filtered form is accepted wherever the unfiltered one is, so it is strictly safer.
- **Stale browsers can't resurrect a clear:** clearing now stamps `cleared_at` on the shared config. Any browser whose next pull sees a newer stamp drops its local submissions/scores and sweeps the cloud rows again, so old progress pushed back on a later save is removed within one pull cycle (≤5s). Accounts and drafts are untouched.
- **Database update needed** (config table gained 1 column — run once in Supabase SQL Editor):
  `alter table public.firstbyte_config add column if not exists cleared_at timestamptz;`
  (Plus the earlier lines for `firstbyte_users.reg_no` and `firstbyte_config.base/wrong_penalty/minute_penalty` if you haven't run them yet.) Until then the site keeps working — the clear marker just doesn't propagate, and config sync falls back to the old columns.

## Bug fixes (v9)
- **Config overwrite fixed:** a fresh visitor no longer replaces the admin's contest settings. Seeded defaults are kept local-only and never pushed; the shared config always wins when it exists. Scoring settings (base points, penalties) now sync too — they were dropped from the config row before.
- **Auto-submit fixed:** it now fires on the live → ended transition (before, the timer never called it because the status was already "ended" by then).
- **Late Run & Verify blocked:** after the contest ends, verify is closed and cannot mark anything solved.
- **Post-solve penalties fixed:** wrong attempts after a question is already solved no longer reduce its score.
- **Editor:** line numbers + Python/C syntax highlighting, dependency-free (a highlighted layer behind the same textarea). Works offline and on phones.
- **Leave warnings:** leaving the arena (refresh, close, or in-app navigation) with unsubmitted code now warns first. Drafts still autosave.
- **Starter editing:** Admin → Questions now has Python and C starter-code fields per question.
- **Early open fixed:** opening a question before the start time no longer starts its timer; solve time is measured from the contest start at the earliest.
- **Solved vs submitted:** a passing verify no longer counts as solved — only submitting the same verified code does. Submitting unverified code shows a note on the result page.
- **Admin save:** an empty start/end date no longer throws — the old value is kept.
- **Clear submissions:** now deletes the rows in the shared database too (submissions + progress), so they don't come back on the next refresh.
- **Stale text:** `server.mjs` mentions corrected to `server.cjs` (3 places).
- **Database update needed** (config table gained 3 columns — run once in Supabase SQL Editor):
  `alter table public.firstbyte_config add column if not exists base jsonb not null default '{"Easy":100,"Medium":150,"Hard":200}'::jsonb;`
  `alter table public.firstbyte_config add column if not exists wrong_penalty int not null default 10;`
  `alter table public.firstbyte_config add column if not exists minute_penalty int not null default 1;`
  (Plus the v8 line for `firstbyte_users.reg_no` if you haven't run it yet.) Until then the site keeps working — config sync falls back to the old columns.

## Registration number (v8)
- **Sign-up now asks for a registration number** (required, next to name/email/password). It is stored with the account and shown everywhere it is needed: the home welcome card, the arena "Logged in as" field, the result page next to the final score, on the certificate (in the ID line at the bottom), and in Admin — a **Reg. no** column in Participants & scores, under the name in Submissions, and as a `reg_no` column in the CSV download.
- **One database update is needed** (the users table was created before v8): in Supabase Dashboard > SQL Editor, run once:
  `alter table public.firstbyte_users add column if not exists reg_no text;`
  New installs get the column automatically from `supabase.sql`. If the column is missing, the site still works — sign-ups sync without the reg. no. until you run the line above, and it then syncs on the next save.

A simplified DevNest contest site for FirstByte. Static files + one serverless function, deploys on Vercel as-is. Supabase URL + publishable key are already filled in.

## Final score normalized to 100 + flexible Admin (v7)
- **Final score is normalized to 100:** (total points earned ÷ total possible points) × 100. A perfect run is 100. Example: one Easy solved (100) of 100 + 100 + 150 possible → 28.6 / 100. Participants see it on the result page after the contest ends; Admin sees it live in the "Final score (/100)" column.
- **Admin → Contest** now edits the scoring: base points per difficulty (Easy / Medium / Hard), penalty per wrong attempt, penalty per minute taken — plus title, duration, start/end, description as before.
- **Admin → Questions** now has **+ Add question** and a **Delete** button on each question, so the number of questions can change. A new question starts as an Easy blank with generic C/Python starters — fill in its statement and sample input/output, then Save questions.

## Final score is the average (v5)
Each question still scores base − 10 per wrong attempt − 1 per minute taken (minimum 0), but the **final score is the average of all question scores** — unsolved questions count as 0. Example: scores 100, 0, 0 across 3 questions → final score 33.3. The result page shows the final average prominently with the total in brackets; Admin shows the final average per participant (total in small text underneath).

## Results after the contest ends (v4)
- **Participants never see their score or certificate during the contest.** The result page shows a "Results after the contest ends" message with a live countdown instead. The certificate page is locked the same way, even if someone types the link directly. The home page shows no score while the contest is live.
- **After the end time** (set in Admin → Contest, or the `endAt` in the config), the result page shows the full score breakdown (per-question base, wrong attempts, time taken, average solve time) and the Certificate of Participation link. The home page says "Results are out!".
- **Admin is never locked.** The Admin dashboard shows everything live, during and after the contest: every account, score, solved count, total attempts, wrong attempts, average solve time, and every submission with code — all from the shared Supabase database (or this browser when Supabase is not configured). Use Refresh to pull the latest.
- **Friendlier home page:** a "How it works" 3-step guide (sign up → solve & submit → results after the contest ends), a clear LIVE / UPCOMING / ENDED status with start and end times, and plain-language messages everywhere. No leaderboard.

## Shared database (v3) — Supabase
Accounts, submissions, scores and contest config are shared across ALL devices through Supabase (free tier, Postgres). The site syncs with Supabase in the background: writes go up on every save, and every browser pulls fresh data on load and every 15 seconds. If Supabase is not configured, the site still works locally in one browser (v2 behaviour) and the header shows "Local only".

### Set it up (once, ~10 minutes)
1. Create a free project at https://supabase.com/dashboard (or reuse your existing RE:FORM project — FirstByte uses its own `firstbyte_*` tables, no clash).
2. In the project, open **SQL Editor** → paste the whole `supabase.sql` file from this folder → Run. It creates 4 tables + open access policies for this short-lived contest.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public key**.
4. Open `index.html`, fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` at the top of the first `<script>` block (marked "shared database (Supabase) — optional"). **v6 already has this project's URL + publishable key filled in — skip this step.** (The publishable key is public by design; it ships in the site's code.)
5. Redeploy on Vercel (or restart `node server.cjs` locally). The header should show "● Shared DB connected".
6. First-run check: sign up on your phone, submit a solution, then open Admin on your laptop — you should see the same account and submission. If not, the DB is not connected yet.

### Security notes
- The anon key is public by design (it ships in the site's code). The `supabase.sql` policies let anyone with it read/write the FirstByte tables — that is what makes the no-login-backend design work for a few-day club contest. Passwords are stored only as SHA-256 hashes, never plain text.
- When the contest is over, delete the `firstbyte_*` tables or the whole Supabase project.

## Features (v2, 18 Nov 2026)
1. **Login** — simple email + password account (name, email, password, min 6 chars). Passwords are stored as a SHA-256 hash in the browser. This site is live for a few days only, so there is no email verification, no Google login, no Firebase. Your submissions, score and certificate belong to your login.
2. **Home** — FirstByte contest, status Upcoming / Live / Ended, question list (C & Python only).
3. **Live timer** — countdown to start, countdown during the contest, auto-submit at 0:00, warning in last 5 minutes.
4. **Arena** — problem statement + sample input/output from the admin, code editor, language picker C (gcc) / Python, autosave draft.
5. **Run & Verify — the site runs your code.** Click Run & Verify and the site runs your code against the admin's sample input and compares the output with the expected output. Participants do **not** run code on their own machine. A wrong output, compile error or runtime error counts as one wrong attempt. How it runs: the browser calls the site's own `/api/run` serverless function (`api/run.js`), which forwards the code to the public Judge0 CE runner (https://ce.judge0.com, no key) and polls for the result — this keeps each function call fast and avoids browser cross-origin issues. If the site is served as plain static files with no functions, the browser tries Judge0 directly as a fallback. If the runner is unreachable, verify shows an error and you can still submit — the admin checks it later.
6. **Submit code** — per question, resubmit till timer ends, confirmation page with submit time.
7. **Score** — per question: base points (Easy 100, Medium 150, Hard 200) − 10 per wrong attempt − 1 per minute taken from first opening the question to solving it (minimum 0). Total score, solved count, and **average time to solve** (mean time across solved questions) are shown on My result. Admin sees every participant's score and average time.
8. **Certificate of Participation** — the official FirstByte design (`certificate.jpg`): NIELIT Ropar, DevNest Coding Club, FirstByte. Your name (script) and the date are filled in on the design, plus a certificate ID. Download / Print as PDF via the browser print dialog. Participation only, no rank or score on the certificate.
9. **Admin** — PIN from the `ADMIN_PIN` env var (`.env` for local runs, Vercel dashboard in production; default `devnest` if unset). Edit contest title/dates/duration, edit questions + sample input/output, view participants with scores and average times, view/download submissions (JSON/CSV), import submission JSON files.

## What is NOT included
No hidden test cases, no leaderboard, no badges, no duels, no plagiarism check.

## Important limitations — read before running a real contest
- **Shared database needs the one-time Supabase setup above.** Until then, accounts, submissions and scores live in each participant's own browser (localStorage). Admin on your device only sees accounts and submissions made on that device. Participants can download their submissions (.json) and send them to you to import.
- **Code runs on a free public runner** (Judge0 CE, via the site's own `/api/run`). It is a shared demo service: runs usually take 2–20 seconds and it can be slow or rate-limited if many people run at once. If it fails, submitting still works.
- Test entries made in a preview do not carry over to the production site — production starts empty.

## Deploy on Vercel
Option A — Vercel dashboard: push this folder to GitHub → Vercel → Add New → Project → import the repo. Framework preset: **Other** (static). No build command, no env vars, output directory: `.` (root). Deploy.
Option B — CLI on your PC: `cd devnest-contest-lite && npx vercel` (then `npx vercel --prod` for updates).

## Run locally
```
node server.cjs
# open http://localhost:8124/
```
`server.cjs` is for local testing only — it serves the site and mounts `api/run.js`. On Vercel, `api/run.js` runs as a serverless function automatically; do not use `python3 -m http.server` for testing Run & Verify, because then `/api/run` is missing and verify falls back to the direct Judge0 call.

## Files
- `index.html` — the whole site (single file)
- `api/run.js` — runner proxy (Vercel serverless function)
- `server.cjs` — local dev server for testing only
- `certificate.jpg` — official FirstByte certificate design (name + date are overlaid by the site)
- `vercel.json` — static-site config
- `README.md` — this file
#   d e v n e s t - c o n t e s t  
 