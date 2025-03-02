import fs from "fs";
import path from "path";
import { showToast, Toast } from "@raycast/api";

// Path to your blog repository
const BLOG_PATH = "/Users/waleed/code/blog";
// Path to your bookmarks JSON file
const BOOKMARKS_FILE = path.join(BLOG_PATH, "src/data/bookmarks.json");

// Define bookmark type with flexible category types
export interface Bookmark {
  name: string;
  url: string;
  description: string;
  category?: string | string[]; // Can be string or string array
}

// Define bookmarks data structure
export interface BookmarksData {
  bookmarks: Bookmark[];
}

// Read bookmarks from file
export const readBookmarks = (): BookmarksData => {
  try {
    const data = fs.readFileSync(BOOKMARKS_FILE, "utf8");
    return JSON.parse(data) as BookmarksData;
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to read bookmarks",
      message: `${error}`,
    });
    return { bookmarks: [] };
  }
};

// Write bookmarks to file
export const writeBookmarks = async (data: BookmarksData): Promise<boolean> => {
  try {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to save bookmarks",
      message: `${error}`,
    });
    return false;
  }
};

// Add a new bookmark
export const addBookmark = async (bookmark: Bookmark): Promise<boolean> => {
  const data = readBookmarks();

  // Ensure category exists
  if (
    !bookmark.category ||
    (Array.isArray(bookmark.category) && bookmark.category.length === 0)
  ) {
    bookmark.category = ["Uncategorized"];
  }

  data.bookmarks.push(bookmark);
  return await writeBookmarks(data);
};

// Update an existing bookmark
export const updateBookmark = async (
  index: number,
  updatedBookmark: Bookmark
): Promise<boolean> => {
  const data = readBookmarks();
  if (index >= 0 && index < data.bookmarks.length) {
    // Ensure category exists
    if (
      !updatedBookmark.category ||
      (Array.isArray(updatedBookmark.category) &&
        updatedBookmark.category.length === 0)
    ) {
      updatedBookmark.category = ["Uncategorized"];
    }

    data.bookmarks[index] = updatedBookmark;
    return await writeBookmarks(data);
  }
  return false;
};

// Delete a bookmark
export const deleteBookmark = async (index: number): Promise<boolean> => {
  const data = readBookmarks();
  if (index >= 0 && index < data.bookmarks.length) {
    data.bookmarks.splice(index, 1);
    return await writeBookmarks(data);
  }
  return false;
};
