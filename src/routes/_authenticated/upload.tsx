import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { verifyStudyImage } from "@/lib/ai.functions";
import { createPost } from "@/lib/posts.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { toast } from "sonner";
import { Loader2, ImagePlus, FileText, ShieldCheck, X, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({ meta: [{ title: "Upload — Wisdom Share" }] }),
  component: UploadPage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function UploadPage() {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [verified, setVerified] = useState<null | { allowed: boolean; reason: string }>(null);
  const verify = useServerFn(verifyStudyImage);
  const createFn = useServerFn(createPost);
  const meFn = useServerFn(getMyProfile);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });

  const onFile = async (f: File | null) => {
    setVerified(null);
    setFile(f);
    if (!f) { setPreview(null); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error("Max 8MB"); return; }
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else if (f.type === "application/pdf") {
      setPreview(null);
    } else {
      toast.error("Only images or PDFs are allowed");
      setFile(null);
    }
  };

  const runVerification = async () => {
    if (!file || !file.type.startsWith("image/")) return;
    setVerifying(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await verify({ data: { dataUrl } });
      setVerified(res);
      if (!res.allowed) toast.error(res.reason || "Not study-related. Upload rejected.");
      else toast.success("Verified: study-related content");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const publish = async () => {
    if (!me) return;
    if (file && file.type.startsWith("image/") && !verified?.allowed) {
      return toast.error("Please verify the image first");
    }
    setPublishing(true);
    try {
      let media_url: string | null = null;
      let media_type: "image" | "pdf" | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "bin");
        const path = `${me.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("post-media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
        if (error) throw error;
        const { data: signed, error: signErr } = await supabase.storage
          .from("post-media")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 5); // 5 years
        if (signErr || !signed) throw signErr ?? new Error("Failed to sign URL");
        media_url = signed.signedUrl;
        media_type = file.type === "application/pdf" ? "pdf" : "image";
      }
      await createFn({ data: { caption: caption.trim(), media_url, media_type } });
      toast.success("Upload successful.");
      navigate({ to: "/home" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold">Share what you're learning</h1>
        <p className="mt-1 text-muted-foreground">Notes, whiteboards, PDFs, or code screenshots — AI checks images before they go live.</p>

        <Card className="mt-6 p-6 space-y-4 shadow-soft">
          <Textarea
            placeholder="What's this study material about?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2000}
            rows={4}
          />

          {!file ? (
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/60 hover:bg-accent/50">
              <div className="flex gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ImagePlus className="size-5" /></span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary/20 text-secondary-foreground"><FileText className="size-5" /></span>
              </div>
              <p className="font-medium">Drop an image or PDF</p>
              <p className="text-xs text-muted-foreground">Max 8MB • Images are AI-verified as study content</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
                    {file.type === "application/pdf" ? <FileText className="size-4" /> : <ImagePlus className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onFile(null)}><X className="size-4" /></Button>
              </div>
              {preview && (
                <img src={preview} alt="preview" className="max-h-72 w-full rounded-xl border object-contain bg-muted" />
              )}
              {file.type.startsWith("image/") && (
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={runVerification} disabled={verifying}>
                    {verifying ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}
                    Verify with AI
                  </Button>
                  {verified?.allowed && (
                    <span className="flex items-center gap-1 text-sm text-secondary-foreground">
                      <CheckCircle2 className="size-4 text-green-600" /> Verified
                    </span>
                  )}
                  {verified && !verified.allowed && (
                    <span className="text-sm text-destructive">{verified.reason || "Not study-related"}</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => navigate({ to: "/home" })}>Cancel</Button>
            <Button
              onClick={publish}
              disabled={
                publishing ||
                (!caption.trim() && !file) ||
                (file?.type.startsWith("image/") && !verified?.allowed)
              }
            >
              {publishing && <Loader2 className="mr-2 size-4 animate-spin" />}
              Publish
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
