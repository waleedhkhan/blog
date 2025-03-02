import { ActionPanel, Action, Form, showToast, Toast } from "@raycast/api";
import React, { useState } from "react";
import { updateBookmark, Bookmark, readBookmarks } from "./utils";

interface EditBookmarkProps {
  bookmark: Bookmark;
  index: number;
  onSuccess?: () => void; // Make it optional
}

export default function EditBookmarkView({
  bookmark,
  index,
  onSuccess,
}: EditBookmarkProps) {
  const [nameError, setNameError] = useState<string | undefined>();
  const [urlError, setUrlError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get unique categories from existing bookmarks with proper type checking
  const existingCategories = Array.from(
    new Set(
      readBookmarks()
        .bookmarks.map((bookmark) => {
          // Handle case where category might be undefined or not a string
          let categories: string[] = [];

          if (typeof bookmark.category === "string") {
            categories = bookmark.category.split(",").map((cat) => cat.trim());
          } else if (Array.isArray(bookmark.category)) {
            categories = bookmark.category.map(String);
          }

          return categories;
        })
        .flat()
    )
  ).sort();

  async function handleSubmit(values: {
    name: string;
    url: string;
    description: string;
    category: string[]; // Expecting array from TagPicker
  }) {
    // Validate form
    if (!values.name) {
      setNameError("Name is required");
      return;
    }

    if (!values.url) {
      setUrlError("URL is required");
      return;
    }

    try {
      new URL(values.url);
    } catch (e) {
      setUrlError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);

    const updatedBookmark: Bookmark = {
      name: values.name,
      url: values.url,
      description: values.description || "",
      category: values.category, // Store as array directly
    };

    const success = await updateBookmark(index, updatedBookmark);

    if (success) {
      showToast({
        style: Toast.Style.Success,
        title: "Bookmark updated successfully",
      });

      // Check if onSuccess is a function before calling it
      if (onSuccess && typeof onSuccess === "function") {
        onSuccess();
      }
    }

    setIsLoading(false);
  }

  // Parse existing categories into an array for the form
  let bookmarkCategories: string[] = [];
  if (typeof bookmark.category === "string") {
    bookmarkCategories = bookmark.category.split(",").map((cat) => cat.trim());
  } else if (Array.isArray(bookmark.category)) {
    bookmarkCategories = bookmark.category.map(String);
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update Bookmark" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        defaultValue={bookmark.name}
        placeholder="Enter bookmark name"
        error={nameError}
        onChange={() => setNameError(undefined)}
        autoFocus
      />

      <Form.TextField
        id="url"
        title="URL"
        defaultValue={bookmark.url}
        placeholder="https://example.com"
        error={urlError}
        onChange={() => setUrlError(undefined)}
      />

      <Form.TextArea
        id="description"
        title="Description"
        defaultValue={bookmark.description}
        placeholder="Describe this bookmark (optional)"
      />

      <Form.TagPicker
        id="category"
        title="Categories"
        defaultValue={bookmarkCategories}
        placeholder="Select or create categories"
        allowCreatingNewTags
        enableMultipleTags
      >
        {existingCategories.map((category) => (
          <Form.TagPicker.Item
            key={category}
            value={category}
            title={category}
          />
        ))}
      </Form.TagPicker>
    </Form>
  );
}
