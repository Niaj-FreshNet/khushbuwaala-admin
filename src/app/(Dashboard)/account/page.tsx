/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { useChangePasswordMutation } from "@/redux/store/api/user/userApi";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SALESMAN: "Salesman",
  INVESTOR: "Investor",
  USER: "Customer",
};

export default function AccountPage() {
  const { user } = useAuth();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [show, setShow] = useState(false);

  const mismatch = form.confirm.length > 0 && form.newPassword !== form.confirm;
  const tooShort = form.newPassword.length > 0 && form.newPassword.length < 6;
  const canSubmit = form.oldPassword && form.newPassword.length >= 6 && form.newPassword === form.confirm && !isLoading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword }).unwrap();
      toast.success("Password changed. Use the new password next time you log in.");
      setForm({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not change the password. Please try again.");
    }
  };

  const field = (key: keyof typeof form, label: string, autoComplete: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="h-11"
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-3 sm:p-6">
      <h1 className="text-xl font-semibold sm:text-2xl">My Account</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle2 className="h-5 w-5" /> Your details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">Name</div>
            <div className="font-medium break-words">{user?.name || "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Role</div>
            <div className="font-medium">{ROLE_LABEL[user?.role] || user?.role || "—"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-muted-foreground">Email (used to log in)</div>
            <div className="font-medium break-all">{user?.email || "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5" /> Change password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            {field("oldPassword", "Current password", "current-password")}
            {field("newPassword", "New password (at least 6 characters)", "new-password")}
            {tooShort && <p className="text-xs text-red-600">At least 6 characters.</p>}
            {field("confirm", "Type the new password again", "new-password")}
            {mismatch && <p className="text-xs text-red-600">The two new passwords don&apos;t match.</p>}

            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {show ? "Hide passwords" : "Show passwords"}
            </button>

            <Button type="submit" disabled={!canSubmit} className="h-11 w-full">
              {isLoading ? "Saving…" : "Change password"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Forgot your current password? Log out and use &quot;Forgot password&quot; on the login page.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
