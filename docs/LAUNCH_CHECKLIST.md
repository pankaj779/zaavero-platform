# Launch Checklist

Nothing below should be skipped for the first production launch.

## A. Repository & CI

- [ ] `main` protected; PR reviews required
- [ ] CI green on Node 20 (lint, typecheck, build, test, prisma validate, mobile)
- [ ] Deploy secrets configured (Render, Vercel, Expo, Neon)
- [ ] Release tag workflow tested (`v0.0.0-rc.1`)

## B. Infrastructure

- [ ] Neon prod project + PITR
- [ ] Migrations applied (`prisma migrate deploy`)
- [ ] Render API healthy (`/ready` 200)
- [ ] Vercel web live on custom domain
- [ ] TLS valid (A+ on SSL Labs optional)
- [ ] CORS allowlist matches web origins only

## C. Providers

- [ ] Cloudinary uploads work (avatar)
- [ ] Resend delivers verification email
- [ ] Razorpay live webhook verified
- [ ] Zoom OAuth connect + create meeting
- [ ] Google Meet OAuth connect + create meeting
- [ ] AI provider responds (student tutor stream)
- [ ] Meeting sandbox **disabled**
- [ ] Email/storage sandboxes **disabled**

## D. Security

- [ ] Helmet + HSTS active on API
- [ ] CSP headers on web
- [ ] Rate limits enabled
- [ ] Auth throttle verified (expect 429 after burst)
- [ ] Webhooks signature-verified (Razorpay, Resend, Zoom)
- [ ] Secrets not in git history
- [ ] Sentry receives a test error (optional)

## E. Product smoke

### Student
- [ ] Register / verify / login
- [ ] Enroll / lesson play / assignment
- [ ] Join live class
- [ ] Certificate download
- [ ] Payment checkout
- [ ] AI tutor stream
- [ ] Push permission (mobile)

### Teacher
- [ ] Create/start/end live session
- [ ] Grade assignment path
- [ ] AI workspace

### Admin
- [ ] Users / roles
- [ ] Audit logs
- [ ] AI admin health
- [ ] Payments invoices list

## F. Mobile

- [ ] EAS production build Android
- [ ] EAS production build iOS
- [ ] Deep link `graphology://` opens app
- [ ] Universal / App Links host verified
- [ ] Store metadata + privacy policy URLs
- [ ] Icons / splash / permissions copy approved

## G. Ops readiness

- [ ] Runbook bookmarked
- [ ] Backup script dry-run completed
- [ ] On-call contact + escalation path
- [ ] Status page / Slack alert channel (optional)

## H. Go / No-go

- [ ] All blockers closed
- [ ] Rollback owners named (API / Web / Mobile / DB)
- [ ] Launch window communicated
- [ ] **GO** decision recorded
