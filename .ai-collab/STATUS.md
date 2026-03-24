# Zavis Landing - Project Status

## Overview
- **Project:** Zavis Landing (zavis.ai) - Healthcare directory + Research ecosystem
- **Framework:** Next.js 14.2.35 with React 18, TypeScript, Tailwind CSS

## Database
- **Engine:** PostgreSQL 16 (local on EC2, migrated from Neon serverless)
- **Driver:** node-postgres (`pg`) - changed from `@neondatabase/serverless`

## Hosting & Deployment
- **Hosting:** Self-hosted on AWS EC2 (`13.205.197.148`) via PM2 + Nginx
- **Port:** 3200
- **Domain:** zavis.ai / www.zavis.ai (DNS pending)
- **SSL:** Pending (certbot after DNS pointing)
- **PM2 process name:** `zavis-landing`
- **Auto-deploy:** GitHub webhook on push to `main` -> git pull + build + PM2 restart
- **Deploy webhook:** `zavis-deploy-webhook` (port 9100)
- **GitHub:** https://github.com/zavis-support/zavis-landing

## Other Services on Same EC2
- `ontology-app` (port 3100)
- Postiz / socials
- MCP servers
- LinkedIn autoposter
