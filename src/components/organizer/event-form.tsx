"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createEventAction, updateEventAction } from "@/app/organizer/events/actions";
import { ImagePlus } from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { ButtonLoader } from "@/components/ui/button-loader";

type InitialEvent = {
  id?: string; title?: string; category?: string; description?: string; starts_at?: string; ends_at?: string | null;
  timezone?: string; venue_name?: string; address?: string | null; city?: string; country?: string; country_code?: string | null;
  currency?: string; price_from?: number; image_url?: string | null;
};

const inputClass = "w-full rounded-xl border border-[#e9e4ef] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#6d35e8] focus:ring-4 focus:ring-[#6d35e8]/10";

function localDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function EventForm({ initial, error }: { initial?: InitialEvent; error?: string }) {
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const router = useRouter();
  const isEditing = Boolean(initial?.id);

  async function uploadImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be 5 MB or smaller."); return; }
    setUploading(true); setUploadError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again before uploading an image.");
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("event-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Image upload failed.");
    } finally { setUploading(false); }
  }

  return (
    <form action={isEditing ? updateEventAction : createEventAction} className="space-y-8">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <section className="space-y-5">
        <div><h2 className="text-lg font-black">Event basics</h2><p className="mt-1 text-sm text-[#777180]">Give your event a clear identity.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-bold md:col-span-2">Event title<input required name="title" minLength={4} maxLength={120} defaultValue={initial?.title} className={inputClass} placeholder="e.g. Lagos Creative Week" /></label>
          <label className="space-y-2 text-sm font-bold">Category<select name="category" defaultValue={initial?.category ?? "Music"} className={inputClass}>{["Music", "Technology", "Business", "Arts", "Food", "Wellness"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="space-y-2 text-sm font-bold">Timezone<input required name="timezone" defaultValue={initial?.timezone ?? "Africa/Lagos"} className={inputClass} placeholder="Africa/Lagos" /></label>
          <label className="space-y-2 text-sm font-bold md:col-span-2">Description<textarea name="description" rows={5} maxLength={10000} defaultValue={initial?.description} className={inputClass} placeholder="Tell attendees what makes this event special..." /></label>
        </div>
      </section>
      <section className="space-y-5">
        <div><h2 className="text-lg font-black">Date and venue</h2><p className="mt-1 text-sm text-[#777180]">Use the local time for the event location.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-bold">Start date and time<input required type="datetime-local" name="starts_at" defaultValue={localDate(initial?.starts_at)} className={inputClass} /></label>
          <label className="space-y-2 text-sm font-bold">End date and time <span className="font-normal text-[#999]">(optional)</span><input type="datetime-local" name="ends_at" defaultValue={localDate(initial?.ends_at ?? undefined)} className={inputClass} /></label>
          <label className="space-y-2 text-sm font-bold">Venue name<input required name="venue_name" defaultValue={initial?.venue_name} className={inputClass} placeholder="Venue or location name" /></label>
          <label className="space-y-2 text-sm font-bold">Street address<input name="address" defaultValue={initial?.address ?? ""} className={inputClass} placeholder="Street address" /></label>
          <label className="space-y-2 text-sm font-bold">City<input required name="city" defaultValue={initial?.city} className={inputClass} placeholder="Lagos" /></label>
          <label className="space-y-2 text-sm font-bold">Country<input required name="country" defaultValue={initial?.country} className={inputClass} placeholder="Nigeria" /></label>
          <label className="space-y-2 text-sm font-bold">Country code<input name="country_code" maxLength={2} defaultValue={initial?.country_code ?? ""} className={inputClass} placeholder="NG" /></label>
        </div>
      </section>
      <section className="space-y-5">
        <div><h2 className="text-lg font-black">Pricing and artwork</h2><p className="mt-1 text-sm text-[#777180]">Set a starting price. You can configure ticket types later.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-bold">Currency<select name="currency" defaultValue={initial?.currency ?? "NGN"} className={inputClass}>{["NGN", "USD", "GBP", "EUR", "CAD", "SGD", "AUD", "KES", "GHS", "ZAR"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <label className="space-y-2 text-sm font-bold">Starting ticket price<input required type="number" min="0" step="0.01" name="price_from" defaultValue={initial?.price_from ?? 0} className={inputClass} /></label>
          <div className="space-y-2 md:col-span-2"><span className="text-sm font-bold">Event cover image</span><div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#d8d0e3] bg-[#fbf9ff] p-5 sm:flex-row sm:items-center"><div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-[#eee8fa] sm:w-44">{imageUrl ? <img src={imageUrl} alt="Event cover preview" className="h-full w-full object-cover" /> : <ImagePlus className="text-[#8c70c7]" size={32} />}</div><div className="flex-1"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#6d35e8] px-4 py-3 text-sm font-bold text-white">{uploading ? <ButtonLoader/> : <ImagePlus size={16} />}{uploading ? "Uploading..." : "Upload image"}<input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => uploadImage(event.target.files?.[0])} /></label><p className="mt-2 text-xs text-[#777180]">JPG, PNG or WebP · maximum 5 MB</p>{uploadError && <p role="alert" className="mt-2 text-xs text-red-600">{uploadError}</p>}</div></div></div>
        </div>
      </section>
      <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f2] pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => router.push("/organizer/dashboard")} className="rounded-xl border border-[#e7e1ed] px-5 py-3 text-sm font-bold">Cancel</button><div className="flex flex-col gap-3 sm:flex-row"><PendingSubmitButton name="intent" value="draft" type="submit" disabled={uploading} pendingText="Saving..." className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl border border-[#dcd3e8] px-5 py-3 text-sm font-bold">Save draft</PendingSubmitButton><PendingSubmitButton name="intent" value="review" type="submit" disabled={uploading} pendingText="Submitting..." className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#6d35e8] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6d35e8]/20">Submit for review</PendingSubmitButton></div></div>
    </form>
  );
}
