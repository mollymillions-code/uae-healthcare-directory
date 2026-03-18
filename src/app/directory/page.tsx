import { redirect } from "next/navigation";

// /uae → redirect to homepage (which has the UAE-wide view)
export default function UAEPage() {
  redirect("/");
}
