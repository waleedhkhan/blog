import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { execSync } from "child_process";

type Bookmark = {
  name: string;
  url: string;
  category: string | string[];
  description: string;
  date: string; // Added date field
};

// ...existing code...

export default function Command() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // ...existing code...

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search bookmarks..."
      throttle
    >
      {filteredBookmarks.map((item) => (
        <List.Item
          key={item.url}
          title={item.name}
          subtitle={item.description}
          accessories={[
            {
              text: Array.isArray(item.category)
                ? item.category.join(", ")
                : item.category,
            },
            { date: new Date(item.date) }, // Display the date
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={item.url} />
              <Action.CopyToClipboard
                content={item.url}
                onCopy={() =>
                  showToast({
                    style: Toast.Style.Success,
                    title: "Copied to clipboard",
                  })
                }
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
