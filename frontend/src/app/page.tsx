import { redirect } from "next/navigation";

export default function HomePage() {
  // VegaRAG Open Source edition defaults straight to the dashboard.
  redirect("/agents");
}
