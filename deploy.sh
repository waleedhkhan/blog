#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting deployment process...${NC}"

# Check if there are any changes to commit
if [[ -z $(git status -s) ]]; then
  echo -e "${YELLOW}No changes detected. Nothing to deploy.${NC}"
  exit 0
fi

# Get a list of modified files
MODIFIED_FILES=$(git status --porcelain | awk '{print $2}')

# Generate commit message based on changed files
COMMIT_MESSAGE=""




# Check for specific file patterns
if echo "$MODIFIED_FILES" | grep -q "src/pages"; then
  PAGE_CHANGES=$(echo "$MODIFIED_FILES" | grep "src/pages" | grep -v "index.astro" | sed 's/.*\/\([^\/]*\)\..*/\1/' | sort | uniq | tr '\n' ', ' | sed 's/,$//')
  INDEX_CHANGED=$(echo "$MODIFIED_FILES" | grep -q "index.astro" && echo "true" || echo "false")
  
  if [ ! -z "$PAGE_CHANGES" ]; then
    if [ "$INDEX_CHANGED" = "true" ]; then
      COMMIT_MESSAGE="Update pages: home and $PAGE_CHANGES"
    else
      COMMIT_MESSAGE="Update pages: $PAGE_CHANGES"
    fi
  elif [ "$INDEX_CHANGED" = "true" ]; then
    COMMIT_MESSAGE="Update home page"
  fi
fi

# Check for component changes
if echo "$MODIFIED_FILES" | grep -q "src/components" && [ -z "$COMMIT_MESSAGE" ]; then
  COMPONENT_CHANGES=$(echo "$MODIFIED_FILES" | grep "src/components" | sed 's/.*\/\([^\/]*\)\..*/\1/' | sort | uniq | tr '\n' ', ' | sed 's/,$//')
  COMMIT_MESSAGE="Update components: $COMPONENT_CHANGES"
fi

# Check for style changes
if echo "$MODIFIED_FILES" | grep -q "\.css" && [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="Update styles"
fi

# Check for content changes
if echo "$MODIFIED_FILES" | grep -q "content" && [ -z "$COMMIT_MESSAGE" ]; then
  CONTENT_CHANGES=$(echo "$MODIFIED_FILES" | grep "content" | sed 's/.*\/\([^\/]*\)\..*/\1/' | sort | uniq | tr '\n' ', ' | sed 's/,$//')
  COMMIT_MESSAGE="Update content: $CONTENT_CHANGES"
fi

# Default commit message if specific patterns weren't matched
if [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="Update site: $(date +'%Y-%m-%d')"
fi

# Stage all changes
echo -e "${YELLOW}Staging changes...${NC}"
git add .

# Commit with the generated message
echo -e "${YELLOW}Committing with message: ${COMMIT_MESSAGE}${NC}"
git commit -m "$COMMIT_MESSAGE"

# Push to main branch
echo -e "${YELLOW}Pushing to main branch...${NC}"
git push origin main

echo -e "${GREEN}✅ Deployment complete!${NC}"
