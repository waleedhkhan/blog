import { ActionPanel, Action, Form, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { deployChanges } from "./utils";

export default function DeployChangesView() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmit(values: { commitMessage: string }) {
    setIsLoading(true);

    const success = await deployChanges(
      values.commitMessage || "Update bookmarks"
    );

    setIsLoading(false);
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Deploy Changes" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="commitMessage"
        title="Commit Message"
        placeholder="Update bookmarks"
        defaultValue="Update bookmarks"
        autoFocus
      />

      <Form.Description
        title="About"
        text="This will push your bookmark changes to GitHub, which will trigger Cloudflare Pages to rebuild your site."
      />
    </Form>
  );
}
