#!/bin/bash

# Debug helper script for troubleshooting with enhanced logging
# Provides various debugging commands and utilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Main menu
show_menu() {
    echo -e "\n${BLUE}=== Prompt Alchemy Debug Helper ===${NC}\n"
    echo "1. Start services with debug logging"
    echo "2. View real-time logs (all services)"
    echo "3. View API logs only"
    echo "4. View Web UI logs only"
    echo "5. Search for errors in logs"
    echo "6. View recent API requests"
    echo "7. Check service health"
    echo "8. Export logs for analysis"
    echo "9. Clear all logs"
    echo "10. Stop all services"
    echo "0. Exit"
    echo -n -e "\n${YELLOW}Select option: ${NC}"
}

# Start with debug logging
start_debug() {
    print_info "Setting up debug logging directories..."
    ./scripts/setup-debug-logs.sh
    
    print_info "Starting services with debug logging..."
    docker-compose -f docker-compose.yml -f docker-compose.debug.yml --profile hybrid up -d
    
    print_success "Services started with debug logging enabled!"
    print_info "Logs are being written to ./logs/ directory"
}

# View all logs
view_all_logs() {
    print_info "Viewing all service logs (Ctrl+C to stop)..."
    docker-compose -f docker-compose.yml -f docker-compose.debug.yml logs -f --tail=100
}

# View API logs
view_api_logs() {
    print_info "Viewing API logs (Ctrl+C to stop)..."
    if [ -f "logs/api/prompt-alchemy.log" ]; then
        tail -f logs/api/*.log
    else
        docker-compose logs -f prompt-alchemy --tail=100
    fi
}

# View Web UI logs
view_web_logs() {
    print_info "Viewing Web UI logs (Ctrl+C to stop)..."
    if [ -f "logs/web/access.log" ]; then
        tail -f logs/web/*.log
    else
        docker-compose logs -f prompt-alchemy-web --tail=100
    fi
}

# Search for errors
search_errors() {
    print_info "Searching for errors in logs..."
    echo -e "\n${YELLOW}=== Errors in API logs ===${NC}"
    grep -i "error\|fail\|exception\|panic" logs/api/*.log 2>/dev/null | tail -20 || echo "No errors found in API logs"
    
    echo -e "\n${YELLOW}=== Errors in Web logs ===${NC}"
    grep -i "error\|fail\|exception" logs/web/*.log 2>/dev/null | tail -20 || echo "No errors found in Web logs"
    
    echo -e "\n${YELLOW}=== Container errors ===${NC}"
    docker-compose logs --tail=200 | grep -i "error\|fail\|exception\|panic" | tail -20 || echo "No errors in container logs"
}

# View recent requests
view_requests() {
    print_info "Viewing recent API requests..."
    if [ -f "logs/api/http.log" ]; then
        echo -e "${YELLOW}=== Recent HTTP requests ===${NC}"
        tail -20 logs/api/http.log | jq -r '"\(.timestamp) [\(.level)] \(.method) \(.path) -> \(.status) (\(.duration))"' 2>/dev/null || tail -20 logs/api/http.log
    else
        print_warning "HTTP log file not found. Checking container logs..."
        docker-compose logs prompt-alchemy --tail=50 | grep -E "GET|POST|PUT|DELETE"
    fi
}

# Check health
check_health() {
    print_info "Checking service health..."
    
    echo -e "\n${YELLOW}=== Container Status ===${NC}"
    docker-compose ps
    
    echo -e "\n${YELLOW}=== API Health Check ===${NC}"
    curl -s http://localhost:8080/health | jq '.' 2>/dev/null || echo "API health check failed"
    
    echo -e "\n${YELLOW}=== Web UI Check ===${NC}"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8090/ || echo "Web UI check failed"
    
    echo -e "\n${YELLOW}=== Resource Usage ===${NC}"
    docker stats --no-stream $(docker-compose ps -q)
}

# Export logs
export_logs() {
    timestamp=$(date +%Y%m%d_%H%M%S)
    export_dir="debug_logs_${timestamp}"
    
    print_info "Exporting logs to ${export_dir}..."
    mkdir -p "${export_dir}"
    
    # Copy log files
    cp -r logs/* "${export_dir}/" 2>/dev/null || true
    
    # Export container logs
    docker-compose logs --no-color > "${export_dir}/docker-compose.log"
    
    # Export container inspect
    for service in prompt-alchemy prompt-alchemy-web; do
        docker inspect $(docker-compose ps -q $service) > "${export_dir}/${service}_inspect.json" 2>/dev/null || true
    done
    
    # Create summary
    cat > "${export_dir}/summary.txt" << EOF
Debug Log Export - ${timestamp}
================================

Services Status:
$(docker-compose ps)

Recent Errors:
$(grep -i "error" logs/*/*.log 2>/dev/null | tail -20 || echo "No errors found")

API Requests (last 10):
$(tail -10 logs/api/http.log 2>/dev/null || echo "No HTTP logs found")
EOF
    
    # Compress
    tar -czf "${export_dir}.tar.gz" "${export_dir}"
    rm -rf "${export_dir}"
    
    print_success "Logs exported to ${export_dir}.tar.gz"
}

# Clear logs
clear_logs() {
    print_warning "This will delete all log files. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -rf logs/*/*.log
        print_success "All log files cleared"
    else
        print_info "Cancelled"
    fi
}

# Stop services
stop_services() {
    print_info "Stopping all services..."
    docker-compose down
    print_success "All services stopped"
}

# Main loop
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1) start_debug ;;
        2) view_all_logs ;;
        3) view_api_logs ;;
        4) view_web_logs ;;
        5) search_errors ;;
        6) view_requests ;;
        7) check_health ;;
        8) export_logs ;;
        9) clear_logs ;;
        10) stop_services ;;
        0) print_info "Goodbye!"; exit 0 ;;
        *) print_error "Invalid option" ;;
    esac
    
    if [[ $choice != 0 ]]; then
        echo -e "\n${YELLOW}Press Enter to continue...${NC}"
        read -r
    fi
done