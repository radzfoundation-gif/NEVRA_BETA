#!/bin/bash
# Environment Variables Validator for Vercel Deployment

echo "🔍 Nevra AI - Environment Variables Checker"
echo "==========================================="

# Load .env if exists
if [ -f .env ]; then
    source .env
fi

# Define required variables with descriptions
declare -A REQUIRED_VARS=(
    ["VITE_CLERK_PUBLISHABLE_KEY"]="Clerk authentication"
    ["VITE_FIREBASE_API_KEY"]="Firebase client config"
    ["VITE_FIREBASE_AUTH_DOMAIN"]="Firebase auth domain"
    ["VITE_FIREBASE_PROJECT_ID"]="Firebase project ID"
    ["VITE_FIREBASE_STORAGE_BUCKET"]="Firebase storage"
    ["VITE_FIREBASE_MESSAGING_SENDER_ID"]="Firebase messaging"
    ["VITE_FIREBASE_APP_ID"]="Firebase app ID"
    ["GROQ_API_KEY"]="Primary AI provider (Groq)"
)

declare -A OPTIONAL_VARS=(
    ["OPENROUTER_API_KEY"]="Fallback AI provider"
    ["ANTHROPIC_API_KEY"]="Claude API (optional)"
    ["OPENAI_API_KEY"]="OpenAI API (optional)"
    ["DEEPSEEK_API_KEY"]="DeepSeek API (optional)"
    ["GEMINI_API_KEY"]="Gemini API (optional)"
    ["TAVILY_API_KEY"]="Web search functionality"
    ["FIREBASE_SERVICE_ACCOUNT"]="Firebase Admin (for MCP)"
    ["STRIPE_SECRET_KEY"]="Payment processing"
)

MISSING_REQUIRED=()
MISSING_OPTIONAL=()
FOUND_VARS=()

# Check required variables
echo ""
echo "Required Variables:"
echo "-------------------"
for var in "${!REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var - ${REQUIRED_VARS[$var]}"
        MISSING_REQUIRED+=("$var")
    else
        echo "✅ $var - ${REQUIRED_VARS[$var]}"
        FOUND_VARS+=("$var")
    fi
done

# Check optional variables
echo ""
echo "Optional Variables:"
echo "-------------------"
for var in "${!OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var - ${OPTIONAL_VARS[$var]}"
        MISSING_OPTIONAL+=("$var")
    else
        echo "✅ $var - ${OPTIONAL_VARS[$var]}"
        FOUND_VARS+=("$var")
    fi
done

# Summary
echo ""
echo "Summary:"
echo "--------"
echo "✅ Found: ${#FOUND_VARS[@]} variables"
echo "❌ Missing Required: ${#MISSING_REQUIRED[@]} variables"
echo "⚠️  Missing Optional: ${#MISSING_OPTIONAL[@]} variables"

if [ ${#MISSING_REQUIRED[@]} -gt 0 ]; then
    echo ""
    echo "🚨 Cannot deploy! Missing required variables:"
    for var in "${MISSING_REQUIRED[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Add these to your .env file or Vercel environment variables."
    exit 1
else
    echo ""
    echo "✅ All required variables present! Ready to deploy."
    
    if [ ${#MISSING_OPTIONAL[@]} -gt 0 ]; then
        echo ""
        echo "💡 Consider adding these optional variables for full functionality:"
        for var in "${MISSING_OPTIONAL[@]}"; do
            echo "  - $var (${OPTIONAL_VARS[$var]})"
        done
    fi
    
    exit 0
fi
