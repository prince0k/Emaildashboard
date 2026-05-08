import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginLoading() {
  return (
    <div className="flex h-screen items-center justify-center text-sm text-gray-500">
      Loading login…
    </div>
  );
}
