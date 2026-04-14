"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db/app-db";
import { saveSettings } from "@/db/log-service";
import { defaultSettings, SETTINGS_RECORD_ID } from "@/types/elvyx";

export function useSettings() {
  const settings =
    useLiveQuery(() => db.settings.get(SETTINGS_RECORD_ID), [], defaultSettings) ??
    defaultSettings;

  return {
    settings,
    updateSettings: saveSettings,
  };
}
