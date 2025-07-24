#!/bin/bash
# Comprehensive hex grid testing script

echo "🔍 Starting comprehensive hex grid testing..."

# Ensure test results directory exists
mkdir -p test-results

# Function to run tests with retries
run_test_suite() {
    local test_name=$1
    local max_retries=3
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        echo "Running $test_name (attempt $((retry + 1))/$max_retries)..."
        
        if npx playwright test tests/e2e/hex-grid-visual.spec.js --grep "$test_name"; then
            echo "✅ $test_name passed"
            return 0
        else
            echo "❌ $test_name failed"
            retry=$((retry + 1))
            if [ $retry -lt $max_retries ]; then
                echo "Retrying in 5 seconds..."
                sleep 5
            fi
        fi
    done
    
    return 1
}

# Install Playwright if needed
if ! command -v playwright &> /dev/null; then
    echo "Installing Playwright..."
    npm install -D @playwright/test
    npx playwright install chromium firefox webkit
fi

# Start the application if not running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "Starting application..."
    docker-compose --profile hybrid up -d
    echo "Waiting for application to be ready..."
    sleep 10
fi

# Run different test suites
echo "📊 Running visual regression tests..."
run_test_suite "visual regression"

echo "🎯 Running positioning tests..."
run_test_suite "should position nodes correctly"

echo "🔄 Running animation tests..."
run_test_suite "Animation Timing Tests"

echo "💪 Running stress tests (100 iterations)..."
run_test_suite "Stress Testing"

# Generate HTML report
echo "📈 Generating test report..."
npx playwright show-report

echo "✨ Testing complete! Check test-results/ for detailed reports."