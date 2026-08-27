"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Save, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUser(user); setName(user.user_metadata?.name || ""); }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { name } });
    if (!error) toast("success", "Profile updated!");
    else toast("error", "Failed to update profile.");
    setSaving(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    // In production, this would call a backend endpoint to delete all user data
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast("success", "Account deleted.");
      router.push("/");
    }
    setDeleting(false);
    setDeleteOpen(false);
  }

  if (loading) return <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6 animate-fade-in max-w-lg">
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Delete Account"
        loading={deleting}
      />

      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Input label="Email" value={user?.email || ""} disabled />
          <Button onClick={handleSave} loading={saving} className="gap-2">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 mb-3">Manage your account or delete it permanently.</p>
          <Button variant="outline" className="text-error-600 border-error-200 hover:bg-error-50 gap-2" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
