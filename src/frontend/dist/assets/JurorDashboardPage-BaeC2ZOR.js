import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, e as useLocale, b as useAuth, g as useBackend, w as useQueryClient, h as useQuery, a5 as Scale, B as Button, L as LogIn, S as Skeleton, z as ue } from "./index-BWWoZgQl.js";
import { B as Badge } from "./badge-BoDWZNmE.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, e as DialogDescription, d as DialogFooter } from "./dialog-Bmrqt2pJ.js";
import { T as Textarea } from "./textarea-NKb8Bdy0.js";
import { u as useMutation } from "./useMutation-Cr40ksX4.js";
import { T as TriangleAlert } from "./triangle-alert--rioHFet.js";
import { M as MotionConfigContext, i as isHTMLElement, u as useConstant, P as PresenceContext, a as usePresence, b as useIsomorphicLayoutEffect, L as LayoutGroupContext, m as motion } from "./proxy-DpDQb9_A.js";
import { C as CircleCheck } from "./circle-check-BhAvNT3V.js";
import { T as TrendingUp } from "./trending-up-CyE-KhlY.js";
import { S as ShieldAlert } from "./shield-alert-BasbPJt5.js";
import { C as Clock } from "./clock-BSHyx2Ng.js";
import { a as ChevronUp, C as ChevronDown } from "./chevron-up-DDm1bD-d.js";
import { G as Gavel } from "./gavel-B21Dw-6z.js";
import "./index-CKX98P69.js";
import "./index-C4j9Z2CH.js";
import "./index-DMxnWT8f.js";
import "./Combination-KjsUWUSh.js";
import "./index-ClPJ4lzh.js";
import "./x-RshHEse-.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m16 11 2 2 4-4", key: "9rsbq5" }],
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
];
const UserCheck = createLucideIcon("user-check", __iconNode);
function setRef(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== void 0) {
    ref.current = value;
  }
}
function composeRefs(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup === "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup === "function") {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }
  };
}
function useComposedRefs(...refs) {
  return reactExports.useCallback(composeRefs(...refs), refs);
}
class PopChildMeasure extends reactExports.Component {
  getSnapshotBeforeUpdate(prevProps) {
    const element = this.props.childRef.current;
    if (isHTMLElement(element) && prevProps.isPresent && !this.props.isPresent && this.props.pop !== false) {
      const parent = element.offsetParent;
      const parentWidth = isHTMLElement(parent) ? parent.offsetWidth || 0 : 0;
      const parentHeight = isHTMLElement(parent) ? parent.offsetHeight || 0 : 0;
      const computedStyle = getComputedStyle(element);
      const size = this.props.sizeRef.current;
      size.height = parseFloat(computedStyle.height);
      size.width = parseFloat(computedStyle.width);
      size.top = element.offsetTop;
      size.left = element.offsetLeft;
      size.right = parentWidth - size.width - size.left;
      size.bottom = parentHeight - size.height - size.top;
    }
    return null;
  }
  /**
   * Required with getSnapshotBeforeUpdate to stop React complaining.
   */
  componentDidUpdate() {
  }
  render() {
    return this.props.children;
  }
}
function PopChild({ children, isPresent, anchorX, anchorY, root, pop }) {
  var _a;
  const id = reactExports.useId();
  const ref = reactExports.useRef(null);
  const size = reactExports.useRef({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  });
  const { nonce } = reactExports.useContext(MotionConfigContext);
  const childRef = ((_a = children.props) == null ? void 0 : _a.ref) ?? (children == null ? void 0 : children.ref);
  const composedRef = useComposedRefs(ref, childRef);
  reactExports.useInsertionEffect(() => {
    const { width, height, top, left, right, bottom } = size.current;
    if (isPresent || pop === false || !ref.current || !width || !height)
      return;
    const x = anchorX === "left" ? `left: ${left}` : `right: ${right}`;
    const y = anchorY === "bottom" ? `bottom: ${bottom}` : `top: ${top}`;
    ref.current.dataset.motionPopId = id;
    const style = document.createElement("style");
    if (nonce)
      style.nonce = nonce;
    const parent = root ?? document.head;
    parent.appendChild(style);
    if (style.sheet) {
      style.sheet.insertRule(`
          [data-motion-pop-id="${id}"] {
            position: absolute !important;
            width: ${width}px !important;
            height: ${height}px !important;
            ${x}px !important;
            ${y}px !important;
          }
        `);
    }
    return () => {
      var _a2;
      (_a2 = ref.current) == null ? void 0 : _a2.removeAttribute("data-motion-pop-id");
      if (parent.contains(style)) {
        parent.removeChild(style);
      }
    };
  }, [isPresent]);
  return jsxRuntimeExports.jsx(PopChildMeasure, { isPresent, childRef: ref, sizeRef: size, pop, children: pop === false ? children : reactExports.cloneElement(children, { ref: composedRef }) });
}
const PresenceChild = ({ children, initial, isPresent, onExitComplete, custom, presenceAffectsLayout, mode, anchorX, anchorY, root }) => {
  const presenceChildren = useConstant(newChildrenMap);
  const id = reactExports.useId();
  let isReusedContext = true;
  let context = reactExports.useMemo(() => {
    isReusedContext = false;
    return {
      id,
      initial,
      isPresent,
      custom,
      onExitComplete: (childId) => {
        presenceChildren.set(childId, true);
        for (const isComplete of presenceChildren.values()) {
          if (!isComplete)
            return;
        }
        onExitComplete && onExitComplete();
      },
      register: (childId) => {
        presenceChildren.set(childId, false);
        return () => presenceChildren.delete(childId);
      }
    };
  }, [isPresent, presenceChildren, onExitComplete]);
  if (presenceAffectsLayout && isReusedContext) {
    context = { ...context };
  }
  reactExports.useMemo(() => {
    presenceChildren.forEach((_, key) => presenceChildren.set(key, false));
  }, [isPresent]);
  reactExports.useEffect(() => {
    !isPresent && !presenceChildren.size && onExitComplete && onExitComplete();
  }, [isPresent]);
  children = jsxRuntimeExports.jsx(PopChild, { pop: mode === "popLayout", isPresent, anchorX, anchorY, root, children });
  return jsxRuntimeExports.jsx(PresenceContext.Provider, { value: context, children });
};
function newChildrenMap() {
  return /* @__PURE__ */ new Map();
}
const getChildKey = (child) => child.key || "";
function onlyElements(children) {
  const filtered = [];
  reactExports.Children.forEach(children, (child) => {
    if (reactExports.isValidElement(child))
      filtered.push(child);
  });
  return filtered;
}
const AnimatePresence = ({ children, custom, initial = true, onExitComplete, presenceAffectsLayout = true, mode = "sync", propagate = false, anchorX = "left", anchorY = "top", root }) => {
  const [isParentPresent, safeToRemove] = usePresence(propagate);
  const presentChildren = reactExports.useMemo(() => onlyElements(children), [children]);
  const presentKeys = propagate && !isParentPresent ? [] : presentChildren.map(getChildKey);
  const isInitialRender = reactExports.useRef(true);
  const pendingPresentChildren = reactExports.useRef(presentChildren);
  const exitComplete = useConstant(() => /* @__PURE__ */ new Map());
  const exitingComponents = reactExports.useRef(/* @__PURE__ */ new Set());
  const [diffedChildren, setDiffedChildren] = reactExports.useState(presentChildren);
  const [renderedChildren, setRenderedChildren] = reactExports.useState(presentChildren);
  useIsomorphicLayoutEffect(() => {
    isInitialRender.current = false;
    pendingPresentChildren.current = presentChildren;
    for (let i = 0; i < renderedChildren.length; i++) {
      const key = getChildKey(renderedChildren[i]);
      if (!presentKeys.includes(key)) {
        if (exitComplete.get(key) !== true) {
          exitComplete.set(key, false);
        }
      } else {
        exitComplete.delete(key);
        exitingComponents.current.delete(key);
      }
    }
  }, [renderedChildren, presentKeys.length, presentKeys.join("-")]);
  const exitingChildren = [];
  if (presentChildren !== diffedChildren) {
    let nextChildren = [...presentChildren];
    for (let i = 0; i < renderedChildren.length; i++) {
      const child = renderedChildren[i];
      const key = getChildKey(child);
      if (!presentKeys.includes(key)) {
        nextChildren.splice(i, 0, child);
        exitingChildren.push(child);
      }
    }
    if (mode === "wait" && exitingChildren.length) {
      nextChildren = exitingChildren;
    }
    setRenderedChildren(onlyElements(nextChildren));
    setDiffedChildren(presentChildren);
    return null;
  }
  const { forceRender } = reactExports.useContext(LayoutGroupContext);
  return jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: renderedChildren.map((child) => {
    const key = getChildKey(child);
    const isPresent = propagate && !isParentPresent ? false : presentChildren === renderedChildren || presentKeys.includes(key);
    const onExit = () => {
      if (exitingComponents.current.has(key)) {
        return;
      }
      if (exitComplete.has(key)) {
        exitingComponents.current.add(key);
        exitComplete.set(key, true);
      } else {
        return;
      }
      let isEveryExitComplete = true;
      exitComplete.forEach((isExitComplete) => {
        if (!isExitComplete)
          isEveryExitComplete = false;
      });
      if (isEveryExitComplete) {
        forceRender == null ? void 0 : forceRender();
        setRenderedChildren(pendingPresentChildren.current);
        propagate && (safeToRemove == null ? void 0 : safeToRemove());
        onExitComplete && onExitComplete();
      }
    };
    return jsxRuntimeExports.jsx(PresenceChild, { isPresent, initial: !isInitialRender.current || initial ? void 0 : false, custom, presenceAffectsLayout, mode, root, onExitComplete: isPresent ? void 0 : onExit, anchorX, anchorY, children: child }, key);
  }) });
};
function formatCountdown(deadlineNs) {
  const nowMs = Date.now();
  const deadlineMs = Number(deadlineNs / 1000000n);
  const diffMs = deadlineMs - nowMs;
  if (diffMs <= 0) return { label: "", expired: true };
  const hours = Math.floor(diffMs / 36e5);
  const mins = Math.floor(diffMs % 36e5 / 6e4);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return { label: `${days}d ${hours % 24}h`, expired: false };
  }
  return { label: `${hours}h ${mins}m`, expired: false };
}
function VoteDialog({
  open,
  entry,
  onClose,
  onSubmit,
  isSubmitting,
  juryView
}) {
  const { t } = useLocale();
  const [selectedVote, setSelectedVote] = reactExports.useState(
    null
  );
  const [reasoning, setReasoning] = reactExports.useState("");
  const handleSubmit = () => {
    if (!entry || !selectedVote) return;
    onSubmit(entry.disputeId, selectedVote, reasoning);
  };
  const handleClose = () => {
    setSelectedVote(null);
    setReasoning("");
    onClose();
  };
  const totalJurors = (juryView == null ? void 0 : juryView.jurors.length) ?? 3;
  const votedCount = (juryView == null ? void 0 : juryView.votes.length) ?? 0;
  const buyerVotesInDialog = (juryView == null ? void 0 : juryView.votes.filter((v) => v.vote === "buyerWins").length) ?? 0;
  const sellerVotesInDialog = (juryView == null ? void 0 : juryView.votes.filter((v) => v.vote === "sellerWins").length) ?? 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (v) => !v && handleClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", "data-ocid": "vote-dialog", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Gavel, { className: "h-4 w-4 text-accent", "aria-hidden": "true" }),
        t("jurors.voteConfirmTitle")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("jurors.voteConfirmDesc") })
    ] }),
    entry && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-foreground", children: [
            t("jurors.caseDispute"),
            ":"
          ] }),
          " ",
          "#",
          entry.disputeId.toString()
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-foreground", children: [
            t("jurors.caseTrade"),
            ":"
          ] }),
          " ",
          "#",
          entry.tradeId.toString()
        ] }),
        juryView && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-foreground", children: [
              t("jurors.consensus"),
              ":"
            ] }),
            " ",
            votedCount,
            " / ",
            totalJurors
          ] }),
          (buyerVotesInDialog > 0 || sellerVotesInDialog > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: t("disputes.jury.voteTally").replace("{{buyer}}", String(buyerVotesInDialog)).replace("{{seller}}", String(sellerVotesInDialog)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { className: "sr-only", children: t("jurors.voteFor") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "data-ocid": "vote-btn-buyer",
              onClick: () => setSelectedVote("buyerWins"),
              "aria-pressed": selectedVote === "buyerWins",
              className: `jury-vote-card rounded-xl border-2 p-4 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedVote === "buyerWins" ? "jury-vote-card-active border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl mb-1", "aria-hidden": "true", children: "🧑‍💼" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm", children: t("jurors.voteBuyer") })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "data-ocid": "vote-btn-seller",
              onClick: () => setSelectedVote("sellerWins"),
              "aria-pressed": selectedVote === "sellerWins",
              className: `jury-vote-card rounded-xl border-2 p-4 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selectedVote === "sellerWins" ? "jury-vote-card-active border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-accent/40 hover:bg-accent/5 text-foreground"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl mb-1", "aria-hidden": "true", children: "🏪" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm", children: t("jurors.voteSeller") })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "label",
          {
            htmlFor: "vote-reasoning-input",
            className: "block text-sm font-medium text-foreground mb-1.5",
            children: [
              t("jurors.voteReasoning"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", "aria-hidden": "true", children: "*" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "vote-reasoning-input",
            "data-ocid": "vote-reasoning",
            placeholder: t("disputes.jury.reasoningPlaceholder"),
            value: reasoning,
            onChange: (e) => setReasoning(e.target.value),
            rows: 3,
            className: "resize-none",
            required: true
          }
        ),
        !reasoning.trim() && selectedVote && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: "text-xs text-destructive mt-1",
            "data-ocid": "vote-reasoning-error",
            children: t("disputes.jury.reasoningPlaceholder")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: handleClose,
          disabled: isSubmitting,
          children: t("detail.cancel")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          "data-ocid": "btn-submit-vote",
          onClick: handleSubmit,
          disabled: !selectedVote || !reasoning.trim() || isSubmitting,
          className: "button-primary gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Gavel, { className: "h-4 w-4", "aria-hidden": "true" }),
            isSubmitting ? t("jurors.submitting") : t("jurors.submitVote")
          ]
        }
      )
    ] })
  ] }) });
}
function CaseCard({ entry, onVote }) {
  const { t } = useLocale();
  const { actor, isFetching } = useBackend();
  const [expanded, setExpanded] = reactExports.useState(false);
  const { label, expired } = formatCountdown(entry.deadline);
  const { data: dispute } = useQuery({
    queryKey: ["dispute", entry.disputeId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDispute(entry.disputeId);
    },
    enabled: !!actor && !isFetching && expanded
  });
  const { data: juryView } = useQuery({
    queryKey: ["juryView", entry.disputeId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDisputeJurors(entry.disputeId);
    },
    enabled: !!actor && !isFetching
  });
  const votedCount = (juryView == null ? void 0 : juryView.votes.length) ?? 0;
  const totalJurors = (juryView == null ? void 0 : juryView.jurors.length) ?? 3;
  const buyerVotes = (juryView == null ? void 0 : juryView.votes.filter((v) => v.vote === "buyerWins").length) ?? 0;
  const sellerVotes = (juryView == null ? void 0 : juryView.votes.filter((v) => v.vote === "sellerWins").length) ?? 0;
  const expandLabel = expanded ? t("jurors.collapseCase") : t("jurors.expandCase");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `rounded-xl border bg-card transition-all ${entry.hasVoted ? "border-border opacity-80" : "border-border hover:border-primary/40"}`,
      "data-ocid": `case-card-${entry.disputeId}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: "flex items-center gap-3 p-4 cursor-pointer w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-t-xl",
            onClick: () => setExpanded((v) => !v),
            "aria-expanded": expanded,
            "aria-controls": `case-details-${entry.disputeId}`,
            "aria-label": `${expandLabel} — ${t("jurors.caseDispute")} #${entry.disputeId.toString()}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${entry.hasVoted ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`,
                  children: entry.hasVoted ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Scale, { className: "h-4 w-4", "aria-hidden": "true" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-foreground text-sm", children: [
                    t("jurors.caseDispute"),
                    " #",
                    entry.disputeId.toString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: entry.hasVoted ? "secondary" : "outline",
                      className: "text-[11px] shrink-0",
                      children: entry.hasVoted ? t("jurors.caseStatus.voted") : t("jurors.caseStatus.pending")
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
                  t("jurors.caseTrade"),
                  " #",
                  entry.tradeId.toString()
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex items-center gap-1 text-xs font-medium ${expired ? "text-destructive" : "text-muted-foreground"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5", "aria-hidden": "true" }),
                      expired ? t("jurors.expired") : label
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground hidden sm:block", children: [
                  votedCount,
                  "/",
                  totalJurors,
                  " ",
                  t("jurors.consensus")
                ] }),
                expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChevronUp,
                  {
                    className: "h-4 w-4 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ChevronDown,
                  {
                    className: "h-4 w-4 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: expanded && /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            id: `case-details-${entry.disputeId}`,
            initial: { height: 0, opacity: 0 },
            animate: { height: "auto", opacity: 1 },
            exit: { height: 0, opacity: 0 },
            transition: { duration: 0.2 },
            className: "overflow-hidden",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border px-4 pb-4 pt-3 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5", children: t("jurors.evidenceSummary") }),
                dispute ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 p-3 text-sm text-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2", children: dispute.description || t("jurors.noEvidence") }),
                  dispute.evidenceUrls.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5 mt-2", children: dispute.evidenceUrls.map((url) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "a",
                    {
                      href: url,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "text-xs text-accent underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded",
                      children: url.split("/").pop() ?? url
                    },
                    url
                  )) })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "rounded-lg bg-muted/40 p-3 h-12 animate-pulse",
                    "aria-hidden": "true"
                  }
                )
              ] }),
              !entry.hasVoted && !expired && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  "data-ocid": `btn-vote-${entry.disputeId}`,
                  onClick: (e) => {
                    e.stopPropagation();
                    onVote(entry);
                  },
                  className: "w-full button-primary gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Gavel, { className: "h-4 w-4", "aria-hidden": "true" }),
                    t("jurors.voteFor")
                  ]
                }
              ),
              juryView && (buyerVotes > 0 || sellerVotes > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex items-center gap-3 text-xs text-muted-foreground",
                  "data-ocid": `vote-tally-${entry.disputeId}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-medium", children: buyerVotes }),
                      " ",
                      t("jurors.voteBuyer").toLowerCase()
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-border", children: "·" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent font-medium", children: sellerVotes }),
                      " ",
                      t("jurors.voteSeller").toLowerCase()
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-border", children: "·" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      votedCount,
                      "/",
                      totalJurors
                    ] })
                  ]
                }
              ),
              entry.hasVoted && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex items-center gap-2 text-sm text-accent",
                  "data-ocid": `voted-badge-${entry.disputeId}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4", "aria-hidden": "true" }),
                    t("jurors.voteSubmitted")
                  ]
                }
              )
            ] })
          }
        ) })
      ]
    }
  );
}
function JoinJuryPoolCard() {
  const { t } = useLocale();
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.registerAsJuror(0);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
    },
    onSuccess: () => {
      ue.success(t("jurors.joinBtn"));
      queryClient.invalidateQueries({ queryKey: ["jurorDashboard"] });
    },
    onError: () => ue.error(t("jurors.registrationError"))
  });
  const FEATURES = [
    { icon: "⚖️", labelKey: "jurors.feature.fairVoting" },
    { icon: "🔒", labelKey: "jurors.feature.onChain" },
    { icon: "⭐", labelKey: "jurors.feature.reputation" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      className: "max-w-lg mx-auto",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 text-center space-y-5 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scale, { className: "h-8 w-8 text-accent", "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-display font-semibold text-foreground", children: t("jurors.joinTitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground leading-relaxed", children: t("jurors.joinDesc") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3 text-center py-2", children: FEATURES.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-lg bg-muted/40 py-3 px-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl mb-1", "aria-hidden": "true", children: item.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t(item.labelKey) })
            ]
          },
          item.labelKey
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            "data-ocid": "btn-register-juror",
            onClick: () => registerMutation.mutate(),
            disabled: registerMutation.isPending,
            className: "w-full button-primary gap-2",
            size: "lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "h-4 w-4", "aria-hidden": "true" }),
              registerMutation.isPending ? t("jurors.joining") : t("jurors.joinBtn")
            ]
          }
        )
      ] })
    }
  );
}
function JurorDashboardPage() {
  const { t } = useLocale();
  const { isAuthenticated, isInitializing, login } = useAuth();
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const liveRegionRef = reactExports.useRef(null);
  const [voteDialogEntry, setVoteDialogEntry] = reactExports.useState(null);
  const {
    data: dashboardResult,
    isLoading,
    error
  } = useQuery({
    queryKey: ["jurorDashboard"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyJurorDashboard();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 3e4
  });
  const { data: voteJuryView } = useQuery({
    queryKey: ["juryView", voteDialogEntry == null ? void 0 : voteDialogEntry.disputeId.toString()],
    queryFn: async () => {
      if (!actor || !voteDialogEntry) return null;
      return actor.getDisputeJurors(voteDialogEntry.disputeId);
    },
    enabled: !!actor && !isFetching && !!voteDialogEntry
  });
  const voteMutation = useMutation({
    mutationFn: async ({
      disputeId,
      vote,
      reasoning
    }) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.submitJurorVote(disputeId, vote, reasoning);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
    },
    onSuccess: () => {
      ue.success(t("jurors.voteSubmitted"));
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = t("jurors.voteSubmittedLive");
      }
      setVoteDialogEntry(null);
      queryClient.invalidateQueries({ queryKey: ["jurorDashboard"] });
    },
    onError: () => ue.error(t("jurors.voteError"))
  });
  const unregisterMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.unregisterJuror();
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
    },
    onSuccess: () => {
      ue.success(t("jurors.leavePool"));
      queryClient.invalidateQueries({ queryKey: ["jurorDashboard"] });
    },
    onError: () => ue.error(t("jurors.unregisterError"))
  });
  if (!isAuthenticated && !isInitializing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-center justify-center min-h-[60vh] px-4 py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-sm w-full text-center space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scale, { className: "h-7 w-7 text-primary", "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-display font-semibold text-foreground", children: t("jurors.signInRequired") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("jurors.signInDesc") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          "data-ocid": "btn-login-jurors",
          onClick: login,
          className: "w-full button-primary gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-4 w-4", "aria-hidden": "true" }),
            t("jurors.signIn")
          ]
        }
      )
    ] }) });
  }
  if (isLoading || isFetching) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-72" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3 mt-4", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 rounded-xl" }, i)) }),
      [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 rounded-xl" }, i))
    ] });
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center min-h-[40vh] gap-3 px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TriangleAlert,
        {
          className: "h-8 w-8 text-destructive",
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: t("jurors.loadError") })
    ] });
  }
  if (!dashboardResult || dashboardResult.__kind__ === "err") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-display font-bold text-foreground", children: t("jurors.pageTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-muted-foreground text-sm", children: t("jurors.pageSubtitle") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(JoinJuryPoolCard, {})
    ] });
  }
  const entries = dashboardResult.ok;
  const resolvedCount = entries.filter((e) => e.hasVoted).length;
  const pendingCount = entries.filter((e) => !e.hasVoted).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24 md:pb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: liveRegionRef,
        "aria-live": "polite",
        "aria-atomic": "true",
        className: "sr-only",
        "data-ocid": "vote-live-region"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        className: "flex items-start justify-between gap-4",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-display font-bold text-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Scale, { className: "h-6 w-6 text-accent", "aria-hidden": "true" }),
              t("jurors.pageTitle")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-sm text-muted-foreground", children: t("jurors.pageSubtitle") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              "data-ocid": "btn-leave-jury",
              onClick: () => unregisterMutation.mutate(),
              disabled: unregisterMutation.isPending,
              className: "shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive",
              children: unregisterMutation.isPending ? t("jurors.leaving") : t("jurors.leavePool")
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.05 },
        className: "grid grid-cols-3 gap-3",
        "data-ocid": "juror-stats",
        children: [
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(
              CircleCheck,
              {
                className: "h-4 w-4 text-accent",
                "aria-hidden": "true"
              }
            ),
            label: t("jurors.stats.resolved"),
            value: resolvedCount
          },
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Scale, { className: "h-4 w-4 text-primary", "aria-hidden": "true" }),
            label: t("jurors.stats.active"),
            value: pendingCount
          },
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-chart-1", "aria-hidden": "true" }),
            label: t("jurors.stats.successRate"),
            value: `${entries.length > 0 ? Math.round(resolvedCount / entries.length * 100) : 0}%`
          }
        ].map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-xl bg-card border border-border px-4 py-3 space-y-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                stat.icon,
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: stat.label })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-display font-bold text-foreground", children: stat.value })
            ]
          },
          stat.label
        ))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: t("jurors.activeCases") }),
      entries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center",
          "data-ocid": "empty-state-cases",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ShieldAlert,
              {
                className: "h-8 w-8 text-muted-foreground/40 mx-auto mb-2",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground text-sm", children: t("jurors.noCases") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("jurors.noCasesDesc") })
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: entries.map((entry, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0, x: -10 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: i * 0.06 },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CaseCard, { entry, onVote: setVoteDialogEntry })
        },
        entry.disputeId.toString()
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      VoteDialog,
      {
        open: !!voteDialogEntry,
        entry: voteDialogEntry,
        onClose: () => setVoteDialogEntry(null),
        juryView: voteJuryView ?? null,
        isSubmitting: voteMutation.isPending,
        onSubmit: (disputeId, vote, reasoning) => voteMutation.mutate({ disputeId, vote, reasoning })
      }
    )
  ] });
}
export {
  JurorDashboardPage as default
};
