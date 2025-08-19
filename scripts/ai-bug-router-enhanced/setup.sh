#!/bin/bash

# Enhanced AI Bug Router Setup Script
# Automates the setup process

set -e

echo "🚀 Enhanced AI Bug Router Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating environment configuration file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your actual API keys before running"
else
    echo "✅ Environment file already exists"
fi

# Test basic functionality
echo "🧪 Running basic functionality test..."
if node test-demo.js > /dev/null 2>&1; then
    echo "✅ Basic functionality test passed"
else
    echo "❌ Basic functionality test failed"
    exit 1
fi

# Check if all required files are present
REQUIRED_FILES=(
    "main.js"
    "enhanced-issue-classifier.js"
    "issue-tracker.js"
    "user-education-system.js"
    "emoji-feedback-handler.js"
    "enhanced-daily-workflow.js"
    "package.json"
    "README.md"
)

echo "📋 Checking required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your API keys:"
echo "   - OPENAI_API_KEY (required for classification)"
echo "   - CLICKUP_API_TOKEN (required for ticket creation)"
echo "   - SLACK_TOKEN (required for notifications)"
echo ""
echo "2. Test the system:"
echo "   npm run test     # Run demo with sample issues"
echo "   npm run health   # Check system health"
echo ""
echo "3. Deploy to production:"
echo "   npm run prod     # Run daily workflow"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Complete feature documentation"
echo "   - INTEGRATION_GUIDE.md - Integration with existing systems"
echo ""
echo "🎮 Emoji Controls:"
echo "   🆘 - Add to Slack message to trigger AI Bug Router"
echo "   🚨 - React to escalate issue (override AI decision)"
echo "   🙋 - React to mark as user education issue"
echo "   🤖 - React to add to AI training dataset"
echo ""
echo "✨ Ready to enhance your bug routing workflow!"
