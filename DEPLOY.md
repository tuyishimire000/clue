# Deployment Guide

## Quick Deploy

Use the automated deployment script:

### Windows (PowerShell)
```powershell
.\deploy.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x deploy.sh
./deploy.sh
```

## What the Script Does

1. ✅ Checks if Vercel CLI is installed
2. 🔐 Verifies authentication (prompts for login if needed)
3. 📦 Checks git status (offers to commit/push changes)
4. 🔗 Links project to Vercel (if not already linked)
5. 🚀 Deploys to production

## First Time Setup

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```
   - Open the URL shown in your browser
   - Enter the code to authenticate

3. **Run the deployment script**:
   ```powershell
   .\deploy.ps1
   ```

## Manual Deployment

If you prefer to deploy manually:

```bash
# Login (first time only)
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod --yes
```

## Troubleshooting

- **"Not authenticated"**: Run `vercel login` first
- **"Project not linked"**: The script will attempt to link automatically
- **Build failures**: Check your code for errors before deploying

## Environment Variables

Make sure your environment variables are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Set them in: Vercel Dashboard → Your Project → Settings → Environment Variables

