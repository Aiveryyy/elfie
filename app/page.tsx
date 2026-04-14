import { DashboardPage } from "@/features/dashboard/dashboard-page";

export default function HomePage() {
  return <DashboardPage aiAvailable={Boolean(process.env.OPENAI_API_KEY)} />;
}
