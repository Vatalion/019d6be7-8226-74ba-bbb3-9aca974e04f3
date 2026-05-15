import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { useAuth } from "../hooks/useAuth";
import { useUploadFile } from "../hooks/useBackend";
import { useLocale } from "../hooks/useLocale";

const MIN_USERNAME = 2;
const MAX_USERNAME = 30;
const MAX_BIO = 500;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

// iPhone/iOS accepts image/* but also needs explicit HEIC
const PHOTO_ACCEPT = "image/*,image/heic,image/heif";

export default function OnboardingPage() {
  const { identity, isAuthenticated, isInitializing } = useAuth();
  const { actor, isFetching } = useActor(createActor);
  const { uploadFile } = useUploadFile(identity);
  const navigate = useNavigate();
  const { t, locale } = useLocale();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect away if not authenticated (should not happen via ProfileGuard but safety net)
  if (!isInitializing && !isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  const validateUsername = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return t("onboarding.validation.usernameRequired");
    if (trimmed.length < MIN_USERNAME)
      return t("onboarding.validation.usernameMin").replace(
        "{min}",
        String(MIN_USERNAME),
      );
    if (trimmed.length > MAX_USERNAME)
      return t("onboarding.validation.usernameMax").replace(
        "{max}",
        String(MAX_USERNAME),
      );
    if (!/^[a-zA-Z0-9 _]+$/.test(trimmed))
      return t("validation.username.format");
    return null;
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (usernameError) setUsernameError(null);
  };

  const handleAvatarSelect = async (file: File) => {
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setAvatarError(t("onboarding.error.notAuthenticated"));
      return;
    }

    // 5 MB file size guard
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t("profile.avatar.sizeError"));
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError(null);

    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);

    try {
      const url = await uploadFile(file);
      setAvatarUrl(url);
      toast.success(t("onboarding.avatar.uploaded"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAvatarError(msg);
      setAvatarPreview(null);
      toast.error(t("onboarding.avatar.uploadFailed"), { description: msg });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    // Validate username
    const err = validateUsername(username);
    if (err) {
      setUsernameError(err);
      return;
    }

    if (!actor || isFetching) {
      const msg =
        locale === "uk"
          ? "Немає з'єднання з мережею. Оновіть сторінку."
          : "Not connected. Please refresh the page.";
      setSubmitError(msg);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await actor.setMyProfile(
        username.trim(),
        bio.trim(),
        avatarUrl ?? "",
        null,
      );

      // Handle both __kind__-based and plain {ok}/{err} Candid variants
      const isErr = (r: { __kind__?: string; ok?: unknown; err?: unknown }) =>
        r.__kind__ === "err" || (r.__kind__ === undefined && "err" in r);

      if (isErr(result)) {
        const errVariant = (result as { err: unknown }).err;
        let errMsg = JSON.stringify(errVariant);
        if (typeof errVariant === "object" && errVariant !== null) {
          const kind = (errVariant as { __kind__?: string }).__kind__;
          if (kind === "invalid_input") {
            errMsg = String(
              (errVariant as { invalid_input?: string }).invalid_input ??
                errMsg,
            );
          } else if (kind === "unauthorized") {
            errMsg = t("onboarding.error.unauthorized");
          }
        }
        setSubmitError(errMsg);
        toast.error(t("onboarding.error.saveFailed"), { description: errMsg });
      } else {
        toast.success(t("onboarding.success"));
        navigate({ to: "/" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSubmitError(msg);
      toast.error(t("onboarding.error.saveFailed"), { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUsernameValid = !validateUsername(username);

  if (isInitializing || isFetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/15 border border-accent/30 mb-4">
            <UserCircle2 className="w-8 h-8 text-accent" />
          </div>
          <h1
            className="text-2xl font-display font-bold text-foreground"
            data-ocid="onboarding.page"
          >
            {t("onboarding.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
            {t("onboarding.subtitle")}
          </p>
        </div>

        {/* Anonymity notice */}
        <div className="flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/8 px-4 py-3 mb-6">
          <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80">
            {t("onboarding.anonymityNote")}
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 space-y-6">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              className="relative w-24 h-24 rounded-full border-2 border-dashed border-border bg-muted/30 hover:border-accent/50 hover:bg-accent/5 transition-smooth flex items-center justify-center overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              aria-label={t("onboarding.avatar.change")}
              data-ocid="onboarding.avatar_upload"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              ) : avatarPreview ? (
                <>
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth">
                    <Camera className="w-5 h-5 text-foreground" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {t("onboarding.avatar.optional")}
                  </span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={PHOTO_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarSelect(file);
              }}
            />
            {avatarUrl && !isUploadingAvatar && (
              <div className="flex items-center gap-1 text-xs text-accent">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("onboarding.avatar.uploaded")}
              </div>
            )}
            {avatarError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {avatarError}
              </p>
            )}
          </div>

          {/* Display name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="username" className="text-label">
                {t("onboarding.field.displayName")}
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <span
                className={`text-xs tabular-nums ${username.length > MAX_USERNAME * 0.85 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {username.length}/{MAX_USERNAME}
              </span>
            </div>
            <Input
              id="username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              onBlur={() => setUsernameError(validateUsername(username))}
              maxLength={MAX_USERNAME}
              placeholder={t("onboarding.placeholder.displayName")}
              className={usernameError ? "border-destructive" : ""}
              autoComplete="nickname"
              data-ocid="onboarding.username_input"
            />
            {usernameError && (
              <p
                className="text-xs text-destructive flex items-center gap-1"
                data-ocid="onboarding.username_error"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {usernameError}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio" className="text-label">
                {t("onboarding.field.bio")}
                <span className="text-muted-foreground text-xs ml-1.5">
                  ({t("onboarding.optional")})
                </span>
              </Label>
              <span
                className={`text-xs tabular-nums ${bio.length > MAX_BIO * 0.9 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {bio.length}/{MAX_BIO}
              </span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={MAX_BIO}
              placeholder={t("onboarding.placeholder.bio")}
              rows={3}
              className="resize-none"
              data-ocid="onboarding.bio_input"
            />
          </div>

          {/* Submit error */}
          {submitError && (
            <div
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2"
              data-ocid="onboarding.error_state"
            >
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            className="w-full button-primary"
            size="lg"
            onClick={handleSubmit}
            disabled={
              !isUsernameValid || isSubmitting || isUploadingAvatar || !actor
            }
            data-ocid="onboarding.submit_button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t("onboarding.submitting")}
              </>
            ) : (
              t("onboarding.submit")
            )}
          </Button>

          {/* Hint about why username is needed */}
          <p className="text-xs text-center text-muted-foreground">
            {t("onboarding.footerHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
