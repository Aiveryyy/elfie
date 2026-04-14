import { SettingsPage } from "@/features/settings/settings-page";

export default function SettingsRoutePage() {
  return <SettingsPage aiAvailable={Boolean(process.env.OPENAI_API_KEY)} />;
}
