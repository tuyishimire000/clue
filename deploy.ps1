# Vercel Deployment Script
# This script automates the deployment process to Vercel

Write-Host "Starting Vercel Deployment Process..." -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
$vercelVersion = vercel --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Vercel CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "SUCCESS: Vercel CLI found: $vercelVersion" -ForegroundColor Green
Write-Host ""

# Check if user is logged in
Write-Host "Checking authentication status..." -ForegroundColor Cyan
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Not authenticated with Vercel." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please complete the login process:" -ForegroundColor Yellow
    Write-Host "1. Run: vercel login" -ForegroundColor White
    Write-Host "2. Open the URL shown in your browser" -ForegroundColor White
    Write-Host "3. Enter the code to authenticate" -ForegroundColor White
    Write-Host "4. Then run this script again" -ForegroundColor White
    Write-Host ""
    
    $login = Read-Host "Would you like to start the login process now? (y/n)"
    if ($login -eq "y" -or $login -eq "Y") {
        Write-Host ""
        Write-Host "Starting login process..." -ForegroundColor Cyan
        Write-Host "Please follow the instructions in the browser..." -ForegroundColor Yellow
        vercel login
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Login successful!" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Login failed or was cancelled." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Exiting. Please login manually and run this script again." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "SUCCESS: Authenticated as: $whoami" -ForegroundColor Green
}

Write-Host ""

# Check git status
Write-Host "Checking git status..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "WARNING: You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor White
    Write-Host ""
    $commit = Read-Host "Would you like to commit and push changes before deploying? (y/n)"
    if ($commit -eq "y" -or $commit -eq "Y") {
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Deploy to Vercel"
        }
        git add .
        git commit -m $commitMessage
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Changes committed" -ForegroundColor Green
            git push
            if ($LASTEXITCODE -eq 0) {
                Write-Host "SUCCESS: Changes pushed to remote" -ForegroundColor Green
            } else {
                Write-Host "WARNING: Failed to push changes, but continuing with deployment..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "WARNING: Failed to commit changes, but continuing with deployment..." -ForegroundColor Yellow
        }
        Write-Host ""
    }
} else {
    Write-Host "SUCCESS: Working directory is clean" -ForegroundColor Green
}

Write-Host ""

# Check if project is linked
Write-Host "Checking project link..." -ForegroundColor Cyan
if (Test-Path ".vercel") {
    Write-Host "SUCCESS: Project is linked to Vercel" -ForegroundColor Green
} else {
    Write-Host "WARNING: Project is not linked. Linking now..." -ForegroundColor Yellow
    $link = vercel link --yes 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to link project. You may need to link manually:" -ForegroundColor Red
        Write-Host "   vercel link" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "SUCCESS: Project linked successfully" -ForegroundColor Green
}

Write-Host ""

# Deploy to production
Write-Host "Deploying to Vercel production..." -ForegroundColor Cyan
Write-Host ""

$deploy = vercel --prod --yes 2>&1
$deployOutput = $deploy | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host $deployOutput -ForegroundColor White
    
    # Extract deployment URL if available
    if ($deployOutput -match "https://[^\s]+\.vercel\.app") {
        $deploymentUrl = $matches[0]
        Write-Host ""
        Write-Host "Deployment URL: $deploymentUrl" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host $deployOutput -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployment process completed!" -ForegroundColor Green

