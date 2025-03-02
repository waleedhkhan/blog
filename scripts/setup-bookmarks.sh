#!/bin/bash

# Create the data directory if it doesn't exist
mkdir -p /Users/waleed/code/blog/src/data

# Create an empty bookmarks.json file if it doesn't exist
if [ ! -f /Users/waleed/code/blog/src/data/bookmarks.json ]; then
  echo '{
  "bookmarks": []
}' > /Users/waleed/code/blog/src/data/bookmarks.json
  echo "Created empty bookmarks.json file"
else
  echo "bookmarks.json already exists"
fi
