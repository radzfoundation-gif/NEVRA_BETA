#!/bin/bash

# Script untuk upload environment variables ke Vercel
# Usage: ./upload-env-to-vercel.sh

echo "🚀 Uploading Environment Variables to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI tidak terinstall!"
    echo "Install dengan: npm i -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Belum login ke Vercel!"
    echo "Login dengan: vercel login"
    exit 1
fi

echo "✅ Vercel CLI ready"
echo ""

# Environment variables yang diperlukan
declare -a ENV_VARS=(
    # Frontend (VITE_*)
    "VITE_CLERK_PUBLISHABLE_KEY"
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_CLERK_SUPABASE_TEMPLATE"
    
    # Backend API Keys
    "OPENROUTER_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    
    # Supabase Service (untuk backend)
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    
    # Optional
    "CORS_ORIGIN"
    "OPENROUTER_SITE_URL"
    "OPENROUTER_SITE_NAME"
    
    # Additional API Keys (jika ada)
    "DEEPSEEK_API_KEY"
    "MOONSHOT_API_KEY"
    "TAVILY_API_KEY"
    "GITHUB_CLIENT_ID"
    "GITHUB_CLIENT_SECRET"
    "GITHUB_REDIRECT_URI"
    "FRONTEND_URL"
    "VERCEL_TOKEN"
    "NETLIFY_TOKEN"
)

# Function to add env var
add_env_var() {
    local var_name=$1
    local var_value=$2
    local environment=${3:-production}
    
    if [ -z "$var_value" ]; then
        echo "⚠️  Skipping $var_name (empty value)"
        return
    fi
    
    echo "📤 Adding $var_name to $environment..."
    echo "$var_value" | vercel env add "$var_name" "$environment" --force
}

# Read from .env file if exists
if [ -f .env ]; then
    echo "📖 Reading from .env file..."
    source .env
    echo ""
fi

# Read from .env.local if exists
if [ -f .env.local ]; then
    echo "📖 Reading from .env.local file..."
    source .env.local
    echo ""
fi

# Ask user which environment
echo "Pilih environment:"
echo "1) Production"
echo "2) Preview"
echo "3) Development"
echo "4) All (Production + Preview + Development)"
read -p "Pilihan (1-4): " env_choice

case $env_choice in
    1) environments=("production") ;;
    2) environments=("preview") ;;
    3) environments=("development") ;;
    4) environments=("production" "preview" "development") ;;
    *) echo "❌ Invalid choice"; exit 1 ;;
esac

echo ""
echo "🔐 Uploading environment variables..."
echo ""

# Upload each variable
for env_var in "${ENV_VARS[@]}"; do
    var_value="${!env_var}"
    
    if [ -z "$var_value" ]; then
        echo "⚠️  $env_var: Not set, skipping..."
        continue
    fi
    
    for env in "${environments[@]}"; do
        echo "📤 Adding $env_var to $env..."
        echo "$var_value" | vercel env add "$env_var" "$env" --force 2>&1 | grep -v "Already exists" || echo "✅ $env_var already exists in $env"
    done
    echo ""
done

echo ""
echo "✅ Done! Environment variables uploaded to Vercel"
echo ""
echo "📋 Verifikasi di Vercel Dashboard:"
echo "   https://vercel.com/[your-team]/[your-project]/settings/environment-variables"
echo ""

