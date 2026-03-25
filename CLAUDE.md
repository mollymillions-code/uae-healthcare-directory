# Project Instructions

## Deployment
- **Production:** zavis.ai runs on AWS EC2 (NOT Vercel)
- **Deploy:** Push to `zavis-support` remote triggers automatic EC2 deployment
- **Always push to both remotes:** `git push origin main && git push zavis-support main`
- **Full instructions:** See `.ai-collab/DEPLOYMENT.md`

## Browser Usage
- **ALWAYS** use Vercel's `agent-browser` CLI as the first choice for any web browsing, screenshots, or page interaction tasks.
- **NEVER** start a Playwright session without explicitly asking the user for permission first.
- `agent-browser` is installed globally. Use commands like `agent-browser open`, `agent-browser screenshot`, `agent-browser snapshot`, `agent-browser eval` via Bash.
