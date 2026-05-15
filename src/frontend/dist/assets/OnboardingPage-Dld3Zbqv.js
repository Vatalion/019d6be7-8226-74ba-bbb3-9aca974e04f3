import { c as createLucideIcon, b as useAuth, n as useActor, C as useUploadFile, u as useNavigate, e as useLocale, r as reactExports, j as jsxRuntimeExports, A as LoaderCircle, f as ShieldCheck, B as Button, z as ue, p as createActor } from "./index-BWWoZgQl.js";
import { I as Input } from "./input-CR8lQ-TV.js";
import { L as Label } from "./label-B1jsMbQH.js";
import { T as Textarea } from "./textarea-NKb8Bdy0.js";
import { C as Camera } from "./camera-Qgvh-YOs.js";
import { I as ImagePlus } from "./image-plus-BCer1qCV.js";
import { C as CircleCheck } from "./circle-check-BhAvNT3V.js";
import { C as CircleAlert } from "./circle-alert-CXr__e1O.js";
import "./index-DdS8yIT6.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M18 20a6 6 0 0 0-12 0", key: "1qehca" }],
  ["circle", { cx: "12", cy: "10", r: "4", key: "1h16sb" }],
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
];
const CircleUserRound = createLucideIcon("circle-user-round", __iconNode);
const MIN_USERNAME = 2;
const MAX_USERNAME = 30;
const MAX_BIO = 500;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const PHOTO_ACCEPT = "image/*,image/heic,image/heif";
function OnboardingPage() {
  const { identity, isAuthenticated, isInitializing } = useAuth();
  const { actor, isFetching } = useActor(createActor);
  const { uploadFile } = useUploadFile(identity);
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const [username, setUsername] = reactExports.useState("");
  const [bio, setBio] = reactExports.useState("");
  const [avatarUrl, setAvatarUrl] = reactExports.useState(null);
  const [avatarPreview, setAvatarPreview] = reactExports.useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = reactExports.useState(false);
  const [avatarError, setAvatarError] = reactExports.useState(null);
  const [usernameError, setUsernameError] = reactExports.useState(null);
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [submitError, setSubmitError] = reactExports.useState(null);
  const fileInputRef = reactExports.useRef(null);
  if (!isInitializing && !isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }
  const validateUsername = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return t("onboarding.validation.usernameRequired");
    if (trimmed.length < MIN_USERNAME)
      return t("onboarding.validation.usernameMin").replace(
        "{min}",
        String(MIN_USERNAME)
      );
    if (trimmed.length > MAX_USERNAME)
      return t("onboarding.validation.usernameMax").replace(
        "{max}",
        String(MAX_USERNAME)
      );
    if (!/^[a-zA-Z0-9 _]+$/.test(trimmed))
      return t("validation.username.format");
    return null;
  };
  const handleUsernameChange = (val) => {
    setUsername(val);
    if (usernameError) setUsernameError(null);
  };
  const handleAvatarSelect = async (file) => {
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setAvatarError(t("onboarding.error.notAuthenticated"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t("profile.avatar.sizeError"));
      return;
    }
    setIsUploadingAvatar(true);
    setAvatarError(null);
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    try {
      const url = await uploadFile(file);
      setAvatarUrl(url);
      ue.success(t("onboarding.avatar.uploaded"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAvatarError(msg);
      setAvatarPreview(null);
      ue.error(t("onboarding.avatar.uploadFailed"), { description: msg });
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const handleSubmit = async () => {
    const err = validateUsername(username);
    if (err) {
      setUsernameError(err);
      return;
    }
    if (!actor || isFetching) {
      const msg = locale === "uk" ? "Немає з'єднання з мережею. Оновіть сторінку." : "Not connected. Please refresh the page.";
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
        null
      );
      const isErr = (r) => r.__kind__ === "err" || r.__kind__ === void 0 && "err" in r;
      if (isErr(result)) {
        const errVariant = result.err;
        let errMsg = JSON.stringify(errVariant);
        if (typeof errVariant === "object" && errVariant !== null) {
          const kind = errVariant.__kind__;
          if (kind === "invalid_input") {
            errMsg = String(
              errVariant.invalid_input ?? errMsg
            );
          } else if (kind === "unauthorized") {
            errMsg = t("onboarding.error.unauthorized");
          }
        }
        setSubmitError(errMsg);
        ue.error(t("onboarding.error.saveFailed"), { description: errMsg });
      } else {
        ue.success(t("onboarding.success"));
        navigate({ to: "/" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSubmitError(msg);
      ue.error(t("onboarding.error.saveFailed"), { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };
  const isUsernameValid = !validateUsername(username);
  if (isInitializing || isFetching) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-[60vh] items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-accent" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-4 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/15 border border-accent/30 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleUserRound, { className: "w-8 h-8 text-accent" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "h1",
        {
          className: "text-2xl font-display font-bold text-foreground",
          "data-ocid": "onboarding.page",
          children: t("onboarding.title")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2 text-sm max-w-sm mx-auto", children: t("onboarding.subtitle") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/8 px-4 py-3 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-4 h-4 text-accent mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/80", children: t("onboarding.anonymityNote") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "relative w-24 h-24 rounded-full border-2 border-dashed border-border bg-muted/30 hover:border-accent/50 hover:bg-accent/5 transition-smooth flex items-center justify-center overflow-hidden group",
            onClick: () => {
              var _a;
              return (_a = fileInputRef.current) == null ? void 0 : _a.click();
            },
            disabled: isUploadingAvatar,
            "aria-label": t("onboarding.avatar.change"),
            "data-ocid": "onboarding.avatar_upload",
            children: isUploadingAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-6 h-6 animate-spin text-accent" }) : avatarPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: avatarPreview,
                  alt: "Avatar preview",
                  className: "w-full h-full object-cover"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "w-5 h-5 text-foreground" }) })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "w-6 h-6 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: t("onboarding.avatar.optional") })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            accept: PHOTO_ACCEPT,
            className: "hidden",
            onChange: (e) => {
              var _a;
              const file = (_a = e.target.files) == null ? void 0 : _a[0];
              if (file) handleAvatarSelect(file);
            }
          }
        ),
        avatarUrl && !isUploadingAvatar && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs text-accent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-3.5 h-3.5" }),
          t("onboarding.avatar.uploaded")
        ] }),
        avatarError && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
          avatarError
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "username", className: "text-label", children: [
            t("onboarding.field.displayName"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive ml-0.5", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              className: `text-xs tabular-nums ${username.length > MAX_USERNAME * 0.85 ? "text-destructive" : "text-muted-foreground"}`,
              children: [
                username.length,
                "/",
                MAX_USERNAME
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "username",
            value: username,
            onChange: (e) => handleUsernameChange(e.target.value),
            onBlur: () => setUsernameError(validateUsername(username)),
            maxLength: MAX_USERNAME,
            placeholder: t("onboarding.placeholder.displayName"),
            className: usernameError ? "border-destructive" : "",
            autoComplete: "nickname",
            "data-ocid": "onboarding.username_input"
          }
        ),
        usernameError && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            className: "text-xs text-destructive flex items-center gap-1",
            "data-ocid": "onboarding.username_error",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-3.5 h-3.5" }),
              usernameError
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "bio", className: "text-label", children: [
            t("onboarding.field.bio"),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground text-xs ml-1.5", children: [
              "(",
              t("onboarding.optional"),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              className: `text-xs tabular-nums ${bio.length > MAX_BIO * 0.9 ? "text-destructive" : "text-muted-foreground"}`,
              children: [
                bio.length,
                "/",
                MAX_BIO
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "bio",
            value: bio,
            onChange: (e) => setBio(e.target.value),
            maxLength: MAX_BIO,
            placeholder: t("onboarding.placeholder.bio"),
            rows: 3,
            className: "resize-none",
            "data-ocid": "onboarding.bio_input"
          }
        )
      ] }),
      submitError && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2",
          "data-ocid": "onboarding.error_state",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-4 h-4 text-destructive mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: submitError })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          className: "w-full button-primary",
          size: "lg",
          onClick: handleSubmit,
          disabled: !isUsernameValid || isSubmitting || isUploadingAvatar || !actor,
          "data-ocid": "onboarding.submit_button",
          children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin mr-2" }),
            t("onboarding.submitting")
          ] }) : t("onboarding.submit")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-muted-foreground", children: t("onboarding.footerHint") })
    ] })
  ] }) });
}
export {
  OnboardingPage as default
};
