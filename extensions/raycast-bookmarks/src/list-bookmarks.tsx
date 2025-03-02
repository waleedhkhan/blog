import {
  ActionPanel,
  Action,
  List,
  Icon,
  showToast,
  Toast,
  confirmAlert,
  Color,
} from "@raycast/api";
import React, { useState, useEffect } from "react";
import { readBookmarks, deleteBookmark, Bookmark } from "./utils";
import AddBookmarkView from "./add-bookmark";
import EditBookmarkView from "./edit-bookmark";

export default function ListBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");

  // Load bookmarks on component mount
  useEffect(() => {
    loadBookmarks();
  }, []);

  // Load bookmarks from file
  const loadBookmarks = () => {
    setIsLoading(true);
    try {
      const data = readBookmarks();
      setBookmarks(data.bookmarks);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load bookmarks",
        message: `${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bookmarks based on search
  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.name.toLowerCase().includes(searchText.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchText.toLowerCase()) ||
      bookmark.category.toLowerCase().includes(searchText.toLowerCase())
  );

  // Handle bookmark deletion
  const handleDelete = async (index: number) => {
    if (
      await confirmAlert({
        title: "Delete Bookmark",
        message: "Are you sure you want to delete this bookmark?",
        primaryAction: {
          title: "Delete",
          style: Action.Style.Destructive, // Changed from ActionPanel.Style.Destructive
        },
      })
    ) {
      const success = await deleteBookmark(index);
      if (success) {
        showToast({
          style: Toast.Style.Success,
          title: "Bookmark deleted",
        });
        loadBookmarks();
      }
    }
  };

  // Function to handle successful bookmark addition
  const handleBookmarkAdded = () => {
    loadBookmarks();
  };

  // Format category for display - handles both string and array types
  const formatCategory = (category: any): string => {
    if (!category) return "Uncategorized";
    if (typeof category === "string") return category;
    if (Array.isArray(category)) return category.join(", ");
    return String(category);
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search bookmarks..."
      onSearchTextChange={setSearchText}
      actions={
        <ActionPanel>
          <Action.Push
            title="Add New Bookmark"
            icon={Icon.Plus}
            target={<AddBookmarkView onSuccess={handleBookmarkAdded} />}
          />
        </ActionPanel>
      }
    >
      {filteredBookmarks.map((bookmark, index) => {
        // Format category for this specific bookmark
        const categoryText = formatCategory(bookmark.category);

        return (
          <List.Item
            key={index}
            title={bookmark.name}
            subtitle={bookmark.url}
            accessories={[{ tag: categoryText }]}
            detail={
              <List.Item.Detail
                markdown={`
                  # ${bookmark.name}
                  
                  **URL:** ${bookmark.url}
                  
                  **Category:** ${categoryText}
                  
                  **Description:**
                  ${bookmark.description || "No description provided"}
                `}
              />
            }
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={bookmark.url} />
                <Action.Push
                  title="Edit Bookmark"
                  icon={Icon.Pencil}
                  target={
                    <EditBookmarkView
                      bookmark={bookmark}
                      index={index}
                      onSuccess={loadBookmarks}
                    />
                  }
                />
                <Action
                  title="Delete Bookmark"
                  style={Action.Style.Destructive} // Changed from ActionPanel.Style.Destructive
                  icon={Icon.Trash}
                  onAction={() => handleDelete(index)}
                />
                <Action.CopyToClipboard
                  title="Copy URL"
                  content={bookmark.url}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
