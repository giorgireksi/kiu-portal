# OpenAI Codex for Open Source — Application Kit

**Program:** [Codex for Open Source](https://developers.openai.com/community/codex-for-oss) — 6 months of free ChatGPT Pro, API credits, and conditional access to Codex Security.
**Form:** https://openai.com/form/codex-for-oss/
**Repo:** https://github.com/giorgireksi/kiu-portal
**Filed:** August 2026 (all numbers below verified 2026-08-10 against git history and the GitHub API)

> Written in plain English on purpose. Fill the identity fields first, then the three text fields (500 characters each). Read the wording once, copy it, done.

---

## 1. Form answers (fill-ready)

### Identity fields

| Field | Value |
|---|---|
| First name / Last name | *(your name)* |
| Email | *(use the email of your ChatGPT account)* |
| GitHub username | `giorgireksi` — **set your profile to public** |
| GitHub repository URL | `https://github.com/giorgireksi/kiu-portal` |
| Maintainer role | **Primary maintainer** |
| I'm interested in | ☑ **API credits for my project** ☐ Codex Security |
| OpenAI Organization ID | `platform.openai.com/settings/organization/general` |

### Why does this repository qualify? *(500 chars max — 3 drafts, pick one)*

> I built kiu-portal, a free, open-source learning system for universities. It has 1 star and 0 downloads — it went public 3 weeks ago and is not packaged yet. But it is no demo: 482,000 lines of code, 260 server functions, 597 test files, secure exams, video calls, live quizzes, and a shared whiteboard, built in 12 weeks by one person. Schools in Georgia can run it on their own servers — no fees, no student data in foreign clouds. Education needs tools like this; I want to keep building it.

> I am the main maintainer of kiu-portal, a free university platform made for Georgian schools. It has 1 star and 0 downloads because it just went public and is not packaged for download yet. Still, it is a real product: 482k lines of code, 260 server functions, 597 test files, and safe exam software for computers, Android, and iPhone. A school installs it with one command, keeps its own data, and works offline. That is its value: good school software should not cost a fortune.

> kiu-portal is a free university platform that does more than most paid school systems: secure online exams, video calls, live quizzes, and a shared whiteboard in one package. It has 1 star and 0 downloads so far (public 3 weeks), but 482k lines of code, 260 server functions, and 597 tests. One developer built it in 12 weeks. Schools host it themselves with Docker, keep their data, and use it offline. Education deserves this; I am asking for support to keep improving it.

### How will you use API credits for your project? *(500 chars max)*

> I will use the credits for everyday upkeep: reviewing my own code changes, writing change notes, finding missing tests, sorting issues, and preparing releases for my 597-file test suite. I will also use Codex to add more tests for the 260 server functions and to make the three exam apps (Windows, Android, iPhone) safer. I check everything myself before it goes live. Credits are used only for this project's open-source work.

### Anything else we should know? *(500 chars max)*

> A one-person project for Georgian higher education, where good AI tools are hard to get. Proof of hard work: 74 updates in 12 weeks, including this week. Production quality: Docker setup with HTTPS, hardened containers, PostgreSQL, backups, test runs, offline mode, and Microsoft school sign-in. Any school can follow our guide and run it. I am currently finishing the license and README.

---

## 2. Long-form letter

*Use as a personal email. Plain English, no jargon.*

---

**Subject: kiu-portal — a free university system that deserves your support**

Dear OpenAI Codex for Open Source team,

My name is Giorgi Babunashvili. I built kiu-portal — a free, open-source learning system for universities — and I am applying to your program. My project's numbers are small, but I believe the work itself deserves a closer look.

**Let me be honest first.** The repository has 1 star and 0 monthly downloads. It went public only three weeks ago, nothing is packaged for download yet, and it is maintained by one person — me. I am saying this openly because I would rather be approved on merit than on made-up numbers.

**Why it matters anyway.** Inside this "1-star" repository is a complete university system, not a demo: about 482,000 lines of code, a backend with 260 functions, 597 test files, and 74 updates in the first 12 weeks. It was made for Georgian universities, where cloud systems are often too expensive and internet is not always reliable. kiu-portal runs on the school's own server: data stays with the school, and the app keeps working even offline.

**Why it is better than other learning systems, in plain words:**

- **Moodle is old and heavy.** It works, but it needs many plugins from different people, which break often and take time to maintain. kiu-portal is one system, built together: nothing to assemble, one developer owns everything, and everything is tested.
- **Paid systems (Blackboard, Canvas Cloud, and similar) cost money per student**, keep student data on their servers, and need the internet. kiu-portal is free, runs on the school's server, and works offline. Video calls, live quizzes, and a shared whiteboard are included for free.
- **Exam security.** Proctoring companies charge $20–40 per student per exam. kiu-portal comes with its own safe exam app for Windows, Android, and iPhone: it locks the screen, blocks shortcuts, and reports any attempt to cheat to the teacher. Free, and the code is open.
- **Ready for real use.** Docker setup with HTTPS, PostgreSQL, backups, and test runs are all included, plus a step-by-step guide for universities.

**What I would do with your help.** With ChatGPT Pro and API credits I will (1) do the everyday maintainer work — checking code changes, writing release notes, sorting issues — and (2) add AI features to the open-source product itself: auto-generated quiz questions, help with grading, and analysis of exam security reports. Everything I add will be shared with everyone, for free.

Education is exactly the place OpenAI's tools should help the most. I am asking you to help one developer prove that in Georgia.

Thank you for reading the story behind the small numbers.

Giorgi Babunashvili — primary maintainer, kiu-portal

---

## 3. Facts and numbers (checked 2026-08-10)

| Fact | Value | Where it comes from |
|---|---|---|
| GitHub stars | 1 | GitHub |
| Forks / watchers | 0 / 1 | GitHub |
| Monthly downloads | 0 (nothing is published anywhere yet) | — |
| Repo public since | 2026-07-20 | GitHub |
| Total commits | 74 | `git rev-list --count HEAD` |
| First → last commit | 2026-05-20 → 2026-08-10 | git log |
| Contributors | 1 (only me) | git shortlog |
| Lines of code | 481,990 (JS 373,672 · CSS 71,499 · HTML 7,387) | git ls-files + wc |
| Backend functions | 260 endpoints | backend/ |
| Test files | 597 (Vitest + Playwright) | test/ |
| Frontend pages | 30 pages, ~208k JS lines | assets/ |
| Exam apps | Windows, Android, iPhone | anti-cheat/ |
| Server setup | Docker: Caddy 2.9 + Node 22 + PostgreSQL 16 + coturn | docker-compose.production.yml |

## 4. Checklist before you press submit

1. **GitHub profile → public** (`github.com/settings/profile`)
2. **Add a license** — the repo currently has none (MIT, one small file). This matters to reviewers and to schools that want to use it
3. **Add topics to the repo** (`lms`, `education`, `university`, `self-hosted`, `pwa`) — helps search and review
4. **README** — currently only 22 lines; a short "what this is + how to start" makes the repo look serious
5. **Get your OpenAI Organization ID** from `platform.openai.com/settings/organization/general`
6. **Use the email of your ChatGPT account** — a different email is a common reason applications are rejected
7. Submit at https://openai.com/form/codex-for-oss/ — they review continuously and reply by email