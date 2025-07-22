#!/bin/bash

# Setup Deployment Script for MSA Platform
# This script helps configure the deployment environment

set -e

echo "🚀 MSA Platform - Deployment Setup"
echo "=================================="

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📁 Repository: $REPO"

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    
    echo ""
    echo "🔐 Setting up $secret_name"
    echo "Description: $secret_description"
    
    # Check if secret already exists
    if gh secret list | grep -q "$secret_name"; then
        echo "⚠️  Secret $secret_name already exists."
        read -p "Do you want to update it? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping $secret_name"
            return
        fi
    fi
    
    if [ "$secret_name" == "SSH_PRIVATE_KEY" ]; then
        echo "Please enter the path to your SSH private key file:"
        read -p "Path: " key_path
        
        if [ ! -f "$key_path" ]; then
            echo "❌ File not found: $key_path"
            return
        fi
        
        gh secret set "$secret_name" < "$key_path"
    else
        echo "Please enter the value for $secret_name:"
        read -s secret_value
        echo "$secret_value" | gh secret set "$secret_name"
    fi
    
    echo "✅ Secret $secret_name set successfully"
}

# Set up required secrets
echo ""
echo "🔧 Setting up GitHub Secrets..."
echo "You'll need to provide values for the following secrets:"

set_secret "HOST_IP" "Production server IP address (e.g., 203.0.113.1)"
set_secret "SSH_PRIVATE_KEY" "SSH private key for deploy user"

echo ""
echo "✅ Deployment setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Ensure your server is set up according to DEPLOYMENT.md"
echo "2. Create .env.production file on your server"
echo "3. Push to develop branch to trigger deployment"
echo ""
echo "🔍 Check deployment status:"
echo "   - GitHub Actions: https://github.com/$REPO/actions"
echo "   - Server logs: ssh deploy@YOUR_SERVER_IP 'docker compose logs -f'"