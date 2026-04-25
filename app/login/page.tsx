import { LoginPage } from "@/features/auth/login-page";
import { getConfiguredAuthProviders } from "@/lib/auth";

export default function Page() {
  return <LoginPage configuredProviders={getConfiguredAuthProviders()} />;
}
