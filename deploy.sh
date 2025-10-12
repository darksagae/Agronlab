#!/bin/bash

# AGROF Deployment Script for Coolify
echo "🚀 Starting AGROF Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.production from template...${NC}"
    cp .env.production .env.production.bak 2>/dev/null || true
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${GREEN}📦 Building and starting services...${NC}"

# Stop existing containers
docker compose down 2>/dev/null || true

# Build and start services
docker compose up --build -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check service health
echo -e "${GREEN}🔍 Checking service health...${NC}"

# Check API service
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AGROF API is healthy${NC}"
else
    echo -e "${RED}❌ AGROF API health check failed${NC}"
fi

# Check Store service
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AGROF Store is healthy${NC}"
else
    echo -e "${RED}❌ AGROF Store health check failed${NC}"
fi

# Show running containers
echo -e "${GREEN}📋 Running containers:${NC}"
docker compose ps

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo "Services available at:"
echo "  🌐 AGROF API: http://localhost:5000"
echo "  🛒 AGROF Store: http://localhost:3000"
echo "  🗄️  PostgreSQL: localhost:5432"
echo ""
echo "Health checks:"
echo "  🔍 API Health: curl http://localhost:5000/health"
echo "  🔍 Store Health: curl http://localhost:3000/health"
