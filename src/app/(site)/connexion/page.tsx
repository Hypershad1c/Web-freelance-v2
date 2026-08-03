import { Suspense } from "react";
import ConnexionForm from "@/components/auth/ConnexionForm";

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm />
    </Suspense>
  );
}
