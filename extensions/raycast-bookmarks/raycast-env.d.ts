/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `list-bookmarks` command */
  export type ListBookmarks = ExtensionPreferences & {}
  /** Preferences accessible in the `add-bookmark` command */
  export type AddBookmark = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `list-bookmarks` command */
  export type ListBookmarks = {}
  /** Arguments passed to the `add-bookmark` command */
  export type AddBookmark = {}
}

