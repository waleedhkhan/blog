#!/bin/bash

# Change to blog directory
cd /Users/waleed/code/blog || exit

# Check if there are changes to the bookmarks.json file
if git diff --quiet src/data/bookmarks.json; then
  echo "No changes to bookmarks.json detected"
  exit 0
fi

# Add changes to git
git add src/data/bookmarks.json

# Commit changes with timestamp
git commit -m "Auto-update bookmarks $(date +"%Y-%m-%d %H:%M:%S")"

# Push changes to GitHub
git push

echo "Bookmark changes deployed successfully"
echo "Cloudflare Pages will automatically rebuild your site"
