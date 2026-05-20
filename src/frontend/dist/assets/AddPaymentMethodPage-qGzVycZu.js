import { b as useLocale, r as reactExports, j as jsxRuntimeExports, B as Button, M as LoaderCircle, v as ue, f as useAuth, k as useBackend, s as useQueryClient, l as useQuery, S as Skeleton, a6 as CreditCard, at as verifyAddress, au as addPaymentMethodToBackend, a7 as getPaymentMethodsFromBackend } from "./index-B5zdxtVX.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-Lbx6gWi8.js";
import { S as Separator } from "./separator-B3vjI6IU.js";
import { I as Input } from "./input-DHN02rGb.js";
import { L as Label } from "./label-BtVhwz-T.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CLWV2fSS.js";
import { N as NETWORK_HINTS, d as detectAddressNetwork, S as SUPPORTED_TOKENS, T as TOKEN_LABELS } from "./addressDetector-JQdSiwAQ.js";
import { D as Dialog, c as DialogContent, d as DialogHeader, e as DialogTitle } from "./dialog-CK1oAFS1.js";
import { C as Camera } from "./camera-DqcgR-Cb.js";
import { X } from "./Combination-BdycxqGU.js";
import { C as CircleCheck } from "./circle-check-DpfL7oJ3.js";
import { C as CircleAlert } from "./circle-alert-CMrXmYvG.js";
import { W as Wallet } from "./wallet-vmzndd0_.js";
import { S as Shield } from "./shield-CPybkuzJ.js";
import { T as TriangleAlert } from "./triangle-alert-o1odUVxS.js";
import { T as Trash2 } from "./trash-2-5pzD3QVn.js";
import "./index-BrewpA67.js";
import "./index-BNCFcFUZ.js";
import "./index-G6S72QUb.js";
import "./index-B-Ax1TuK.js";
import "./index-DR2cXKlE.js";
import "./chevron-up-Dv3EV01C.js";
import "./check-Ckd98-EH.js";
import "./index-Bd_GsmbO.js";
function WalletQRScanner({
  onAddressDetected,
  onClose
}) {
  const { t } = useLocale();
  const [open, setOpen] = reactExports.useState(false);
  const [scanState, setScanState] = reactExports.useState("idle");
  const videoRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const rafRef = reactExports.useRef(0);
  const detectorRef = reactExports.useRef(null);
  const canvasRef = reactExports.useRef(null);
  const stopCamera = reactExports.useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);
  const handleClose = reactExports.useCallback(() => {
    stopCamera();
    setScanState("idle");
    setOpen(false);
    onClose();
  }, [stopCamera, onClose]);
  const startScanning = reactExports.useCallback(async () => {
    setScanState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (typeof BarcodeDetector !== "undefined") {
        try {
          detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          detectorRef.current = null;
        }
      }
      setScanState("scanning");
      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        if (detectorRef.current) {
          try {
            const codes = await detectorRef.current.detect(videoRef.current);
            if (codes.length > 0 && codes[0]) {
              const raw = codes[0].rawValue;
              handleDetected(raw);
              return;
            }
          } catch {
          }
        } else {
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (err) {
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        setScanState("denied");
      } else {
        setScanState("error");
      }
    }
  }, []);
  const handleDetected = reactExports.useCallback(
    (raw) => {
      stopCamera();
      setOpen(false);
      setScanState("idle");
      const address = raw.replace(/^[a-z]+:/i, "").split("?")[0].trim();
      onAddressDetected(address);
    },
    [stopCamera, onAddressDetected]
  );
  reactExports.useEffect(() => {
    if (open) {
      void startScanning();
    }
    return () => {
      if (!open) stopCamera();
    };
  }, [open, startScanning, stopCamera]);
  reactExports.useEffect(() => () => stopCamera(), [stopCamera]);
  const hasBarcodeDetector = typeof globalThis !== "undefined" && "BarcodeDetector" in globalThis;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant: "outline",
        size: "sm",
        className: "shrink-0 gap-1.5",
        onClick: () => setOpen(true),
        "aria-label": t("payment.scanQR"),
        "data-ocid": "payment.scan_qr_button",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: t("payment.scanQR") })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Dialog,
      {
        open,
        onOpenChange: (v) => {
          if (!v) handleClose();
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          DialogContent,
          {
            className: "max-w-sm p-0 overflow-hidden",
            "data-ocid": "payment.qr_scanner_dialog",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { className: "px-4 pt-4 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("payment.scanQR") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "icon",
                    className: "h-7 w-7 -mr-1",
                    onClick: handleClose,
                    "aria-label": t("payment.scanQR"),
                    "data-ocid": "payment.qr_scanner_close_button",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative bg-black aspect-square w-full overflow-hidden", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "video",
                  {
                    ref: videoRef,
                    className: "w-full h-full object-cover",
                    muted: true,
                    playsInline: true,
                    "aria-label": t("payment.scanInstructions")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, className: "hidden" }),
                scanState === "scanning" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-48 h-48", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/80 rounded-tl" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/80 rounded-tr" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/80 rounded-bl" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/80 rounded-br" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-x-0 top-1/2 h-0.5 bg-primary/70 animate-pulse" })
                ] }) }),
                scanState === "requesting" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: t("payment.scanningAddress") })
                ] }),
                scanState === "denied" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 text-white px-6 text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "h-8 w-8 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-relaxed", children: t("payment.cameraPermissionDenied") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "secondary",
                      size: "sm",
                      onClick: handleClose,
                      "data-ocid": "payment.qr_permission_close_button",
                      children: t("payment.scanQR")
                    }
                  )
                ] }),
                scanState === "scanning" && !hasBarcodeDetector && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs text-center py-2 px-3 leading-snug", children: t("payment.qrNotSupported") })
              ] }),
              scanState === "scanning" && hasBarcodeDetector && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-muted-foreground py-3 px-4", children: t("payment.scanInstructions") })
            ]
          }
        )
      }
    )
  ] });
}
function AddressInputWithHints({
  value,
  onChange,
  selectedToken,
  onTokenChange
}) {
  const { t } = useLocale();
  const inputRef = reactExports.useRef(null);
  const hint = NETWORK_HINTS[selectedToken];
  const isValid = hint ? hint.validate(value) : false;
  const isEmpty = value.trim() === "";
  const handlePaste = reactExports.useCallback(
    (e) => {
      const pasted = e.clipboardData.getData("text").trim();
      if (!pasted) return;
      const detected = detectAddressNetwork(pasted);
      if (detected) {
        setTimeout(() => {
          onTokenChange(detected.token);
          ue.success(
            t("payment.detectedNetwork").replace("{label}", detected.label).replace("{token}", detected.token)
          );
        }, 0);
      }
    },
    [t, onTokenChange]
  );
  const handleQRDetected = reactExports.useCallback(
    (address) => {
      onChange(address);
      const detected = detectAddressNetwork(address);
      if (detected) {
        onTokenChange(detected.token);
        ue.success(
          t("payment.detectedNetwork").replace("{label}", detected.label).replace("{token}", detected.token)
        );
      }
    },
    [onChange, onTokenChange, t]
  );
  let hintColor = "text-muted-foreground";
  if (!isEmpty) {
    hintColor = isValid ? "text-green-600 dark:text-green-400" : "text-destructive";
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "payment-token-select", children: t("payment.selectToken") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedToken, onValueChange: onTokenChange, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectTrigger,
          {
            id: "payment-token-select",
            className: "w-full",
            "data-ocid": "payment.token_select",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("payment.selectToken") })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: SUPPORTED_TOKENS.map((token) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectItem,
          {
            value: token,
            "data-ocid": `payment.token_option.${token}`,
            children: TOKEN_LABELS[token]
          },
          token
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "payment-address-input", children: t("payment.addressLabel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              ref: inputRef,
              id: "payment-address-input",
              type: "text",
              value,
              onChange: (e) => onChange(e.target.value),
              onPaste: handlePaste,
              placeholder: (hint == null ? void 0 : hint.hint) ?? t("payment.addressLabel"),
              className: [
                "font-mono text-sm pr-8",
                !isEmpty && isValid ? "border-green-500 focus-visible:ring-green-500/30" : "",
                !isEmpty && !isValid ? "border-destructive focus-visible:ring-destructive/30" : ""
              ].join(" "),
              "aria-describedby": "payment-address-hint",
              "aria-invalid": !isEmpty && !isValid,
              "data-ocid": "payment.address_input",
              spellCheck: false,
              autoComplete: "off",
              autoCorrect: "off"
            }
          ),
          !isEmpty && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none",
              "aria-hidden": "true",
              children: isValid ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-destructive" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          WalletQRScanner,
          {
            onAddressDetected: handleQRDetected,
            onClose: () => {
            }
          }
        )
      ] }),
      hint && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          id: "payment-address-hint",
          className: `text-xs leading-snug transition-colors ${hintColor}`,
          "data-ocid": "payment.address_hint",
          children: !isEmpty && !isValid ? t("payment.invalidAddress") : !isEmpty && isValid ? t("payment.validAddress") : hint.hint
        }
      )
    ] })
  ] });
}
const STORAGE_KEY = "seller_payment_methods";
function loadLegacyMethods() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function truncateAddress(addr) {
  if (addr.length <= 20) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`;
}
function VerificationBadge({
  verification
}) {
  const { t } = useLocale();
  if (!verification) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        className: "inline-flex items-center gap-1 text-xs text-muted-foreground",
        title: t("payment.badge.unverified"),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3.5 w-3.5" }),
          t("payment.badge.unverified")
        ]
      }
    );
  }
  if (verification.active && Number(verification.txCount) > 0) {
    const verifiedDate = new Date(
      Number(verification.verifiedAt) / 1e6
    ).toLocaleDateString();
    const expiresDate = new Date(
      Number(verification.expiresAt) / 1e6
    ).toLocaleDateString();
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        className: "inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400",
        title: `Level ${Number(verification.level)} · ${Number(verification.txCount)} tx · verified ${verifiedDate} · expires ${expiresDate}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3.5 w-3.5 fill-green-500/20" }),
          t("payment.badge.level2")
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: "inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400",
      title: t("payment.badge.formatValid"),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3.5 w-3.5" }),
        t("payment.badge.formatValid")
      ]
    }
  );
}
function AddPaymentMethodPage() {
  const { t } = useLocale();
  const { isAuthenticated, isInitializing, login } = useAuth();
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [address, setAddress] = reactExports.useState("");
  const [selectedToken, setSelectedToken] = reactExports.useState("USDT_TRC20");
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const [verifyState, setVerifyState] = reactExports.useState({
    status: "idle"
  });
  const addressRef = reactExports.useRef(address);
  const tokenRef = reactExports.useRef(selectedToken);
  reactExports.useEffect(() => {
    addressRef.current = address;
    tokenRef.current = selectedToken;
    setVerifyState({ status: "idle" });
  }, [address, selectedToken]);
  const { data: backendMethods, isLoading: methodsLoading } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => getPaymentMethodsFromBackend(actor),
    enabled: !!actor && isAuthenticated
  });
  const [legacyMethods] = reactExports.useState(
    () => loadLegacyMethods()
  );
  const displayMethods = isAuthenticated && backendMethods ? backendMethods : legacyMethods.map((m) => ({
    token: m.token,
    address: m.address,
    addedAt: BigInt(0),
    verification: void 0
  }));
  const hint = NETWORK_HINTS[selectedToken];
  const isAddressValid = hint ? hint.validate(address.trim()) : false;
  if (isInitializing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto px-4 py-10 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-56" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-32" })
    ] });
  }
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-[60vh] items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-sm space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-12 w-12 mx-auto text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-foreground", children: t("vault.signInRequired") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("vault.signInDesc") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: login,
          className: "w-full",
          "data-ocid": "payment.sign_in_button",
          children: t("nav.connect")
        }
      )
    ] }) });
  }
  const handleVerify = async () => {
    if (!actor || !isAddressValid) return;
    setVerifyState({ status: "loading" });
    const result = await verifyAddress(
      actor,
      tokenRef.current,
      addressRef.current
    );
    if (!result) {
      setVerifyState({ status: "failed" });
      return;
    }
    if (result.txCount > 0 && result.active) {
      setVerifyState({ status: "active", txCount: result.txCount });
    } else {
      setVerifyState({ status: "inactive" });
    }
  };
  const handleSave = async () => {
    const trimmed = address.trim();
    if (!trimmed || !actor) return;
    const isDuplicate = displayMethods.some(
      (m) => m.token === selectedToken && m.address === trimmed
    );
    if (isDuplicate) {
      ue.error(t("payment.save"));
      return;
    }
    setIsSaving(true);
    try {
      const saved = await addPaymentMethodToBackend(
        actor,
        selectedToken,
        trimmed,
        false
      );
      if (!saved) {
        ue.error(t("payment.verificationFailed"));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      setAddress("");
      setVerifyState({ status: "idle" });
      ue.success(t("payment.saved"), { duration: 4e3 });
    } finally {
      setIsSaving(false);
    }
  };
  const handleRemove = async (method) => {
    queryClient.setQueryData(
      ["paymentMethods"],
      (old) => (old ?? []).filter(
        (m) => !(m.token === method.token && m.address === method.address)
      )
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-6 w-6 text-primary" }),
        t("payment.title")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("payment.savedMethods") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "payment.add_form_card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-base", children: t("payment.title") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AddressInputWithHints,
          {
            value: address,
            onChange: setAddress,
            selectedToken,
            onTokenChange: setSelectedToken
          }
        ),
        isAddressValid && address.trim() && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: handleVerify,
              disabled: verifyState.status === "loading",
              className: "gap-1.5",
              "data-ocid": "payment.verify_button",
              children: verifyState.status === "loading" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }),
                t("payment.verifying")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-3.5 w-3.5" }),
                t("payment.verifyButton")
              ] })
            }
          ),
          verifyState.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              className: "text-xs text-green-600 dark:text-green-400 flex items-center gap-1",
              "data-ocid": "payment.verify_success_state",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 shrink-0" }),
                t("payment.verifiedActive").replace(
                  "{{count}}",
                  String(verifyState.txCount)
                )
              ]
            }
          ),
          verifyState.status === "inactive" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              className: "text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1",
              "data-ocid": "payment.verify_inactive_state",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5 shrink-0" }),
                t("payment.verifiedInactive")
              ]
            }
          ),
          verifyState.status === "failed" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              className: "text-xs text-muted-foreground flex items-center gap-1",
              "data-ocid": "payment.verify_error_state",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5 shrink-0" }),
                t("payment.verificationFailed")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            onClick: handleSave,
            disabled: !address.trim() || isSaving,
            className: "w-full sm:w-auto",
            "data-ocid": "payment.save_button",
            children: isSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1.5" }),
              t("payment.save")
            ] }) : t("payment.save")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-foreground", children: t("payment.savedMethods") }),
      methodsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "space-y-2",
          "data-ocid": "payment.methods_loading_state",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-14 w-full rounded-lg" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-14 w-full rounded-lg" })
          ]
        }
      ) : displayMethods.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-border gap-3 text-muted-foreground",
          "data-ocid": "payment.methods_empty_state",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-8 w-8 opacity-40" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: t("payment.noPaymentMethods") })
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "divide-y divide-border rounded-lg border border-border overflow-hidden",
          "data-ocid": "payment.methods_list",
          children: displayMethods.map((method, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors",
              "data-ocid": `payment.method_item.${index + 1}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground truncate", children: TOKEN_LABELS[method.token] ?? method.token }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs text-muted-foreground font-mono truncate block", children: truncateAddress(method.address) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(VerificationBadge, { verification: method.verification })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "icon",
                    className: "h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive",
                    onClick: () => handleRemove(method),
                    "aria-label": t("payment.remove"),
                    "data-ocid": `payment.remove_button.${index + 1}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                  }
                )
              ]
            },
            `${method.token}-${method.address}-${method.addedAt.toString()}`
          ))
        }
      )
    ] })
  ] }) });
}
export {
  AddPaymentMethodPage as default
};
