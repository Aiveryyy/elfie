"use client";

import { create } from "zustand";

import type { ElvyxLog } from "@/types/elvyx";

interface WizardDraft {
  energyRaw?: string;
  mentalTexture?: string;
  attentionMode?: string;
  emotionalTone?: string;
  dominantThoughtVector?: string;
  bodySignal?: string;
}

interface LogWizardState {
  currentStepIndex: number;
  draft: WizardDraft;
  isSaving: boolean;
  lastSavedLog: ElvyxLog | null;
  saveError: string | null;
  answerStep: (field: keyof WizardDraft, value: string) => void;
  startSaving: () => void;
  finishSaving: (log: ElvyxLog) => void;
  failSaving: (message: string) => void;
  reset: () => void;
}

const initialState = {
  currentStepIndex: 0,
  draft: {},
  isSaving: false,
  lastSavedLog: null,
  saveError: null,
};

export const useLogWizardStore = create<LogWizardState>((set) => ({
  ...initialState,
  answerStep: (field, value) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [field]: value,
      },
      currentStepIndex: Math.min(state.currentStepIndex + 1, 6),
      saveError: null,
    })),
  startSaving: () =>
    set({
      isSaving: true,
      saveError: null,
    }),
  finishSaving: (log) =>
    set({
      ...initialState,
      lastSavedLog: log,
    }),
  failSaving: (message) =>
    set({
      isSaving: false,
      saveError: message,
    }),
  reset: () => set(initialState),
}));
