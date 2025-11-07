#!/bin/bash

# Vercel Deployment Script
# This script automates the deployment process to Vercel

echo "🚀 Starting Vercel Deployment Process..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found: $(vercel --version)"
echo ""

# Check if user is logged in
echo "🔐 Checking authentication status..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not authenticated with Vercel."
    echo ""
    echo "Please complete the login process:"
    echo "1. Run: vercel login"
    echo "2. Open the URL shown in your browser"
    echo "3. Enter the code to authenticate"
    echo "4. Then run this script again"
    echo ""
    read -p "Would you like to start the login process now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Starting login process..."
        echo "Please follow the instructions in the browser..."
        vercel login
        if [ $? -eq 0 ]; then
            echo "✅ Login successful!"
        else
            echo "❌ Login failed or was cancelled."
            exit 1
        fi
    else
        echo "Exiting. Please login manually and run this script again."
        exit 0
    fi
else
    echo "✅ Authenticated as: $(vercel whoami)"
fi

echo ""

# Check git status
echo "📦 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Would you like to commit and push changes before deploying? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message (or press Enter for default): " commit_message
        if [ -z "$commit_message" ]; then
            commit_message="Deploy to Vercel"
        fi
        git add .
        git commit -m "$commit_message"
        if [ $? -eq 0 ]; then
            echo "✅ Changes committed"
            git push
            if [ $? -eq 0 ]; then
                echo "✅ Changes pushed to remote"
            else
                echo "⚠️  Failed to push changes, but continuing with deployment..."
            fi
        else
            echo "⚠️  Failed to commit changes, but continuing with deployment..."
        fi
        echo ""
    fi
else
    echo "✅ Working directory is clean"
fi

echo ""

# Check if project is linked
echo "🔗 Checking project link..."
if [ -d ".vercel" ]; then
    echo "✅ Project is linked to Vercel"
else
    echo "⚠️  Project is not linked. Linking now..."
    if ! vercel link --yes &> /dev/null; then
        echo "❌ Failed to link project. You may need to link manually:"
        echo "   vercel link"
        exit 1
    fi
    echo "✅ Project linked successfully"
fi

echo ""

# Deploy to production
echo "🚀 Deploying to Vercel production..."
echo ""

if vercel --prod --yes; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "✨ Deployment process completed!"
else
    echo ""
    echo "❌ Deployment failed!"
    exit 1
fi

