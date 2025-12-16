#!/bin/bash
# Automated Vercel Deployment Script for Nevra AI

set -e  # Exit on error

echo "🚀 Nevra AI - Automated Vercel Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create a .env file with your environment variables."
    exit 1
fi

# Validate required environment variables
echo ""
echo "🔍 Validating environment variables..."

REQUIRED_VARS=(
    "VITE_CLERK_PUBLISHABLE_KEY"
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "GROQ_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env 2>/dev/null; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Add these to your .env file before deploying."
    exit 1
fi

echo -e "${GREEN}✅ All required variables found${NC}"

# Check if MCP is enabled (warn if true)
if grep -q "enableMCP: true" lib/workflow/config.ts 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: MCP is enabled in config${NC}"
    echo "   MCP won't work on Vercel serverless."
    echo "   Fallback to Firebase will be automatic."
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Build the project locally first (verification)
echo ""
echo "🔨 Building project locally..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Local build successful${NC}"

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Check deployment type
if [ "$1" == "--prod" ] || [ "$1" == "-p" ]; then
    echo "📦 Production deployment"
    vercel --prod
else
    echo "🧪 Preview deployment"
    echo "   (Use --prod flag for production)"
    vercel
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Update Clerk allowed origins with your Vercel domain"
    echo "  2. Update Firebase authorized domains"
    echo "  3. Test the deployed application"
    echo ""
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi
