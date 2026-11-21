import { redirect } from "next/navigation";

// The ledger lives in the Finance hub (Ledger tab). Keep this URL working.
export default function LedgerPage() {
  redirect("/finance?tab=ledger");
}
