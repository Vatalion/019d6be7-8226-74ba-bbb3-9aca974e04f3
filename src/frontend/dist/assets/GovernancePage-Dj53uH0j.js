import { c as createLucideIcon, b as useLocale, k as useBackend, r as reactExports, j as jsxRuntimeExports, t, B as Button, M as LoaderCircle, o as cn, S as Skeleton, ap as User, aq as Vote, f as useAuth } from "./index-B5zdxtVX.js";
import { D as Dialog, c as DialogContent, d as DialogHeader, e as DialogTitle, i as DialogFooter } from "./dialog-CK1oAFS1.js";
import { L as Label } from "./label-BtVhwz-T.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CLWV2fSS.js";
import { T as Textarea } from "./textarea-CO2VWUtE.js";
import { B as Badge } from "./badge-qfLaSFgU.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-Lbx6gWi8.js";
import { C as Clock } from "./clock-B0GElRQX.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-DcJy3Qed.js";
import "./index-BNCFcFUZ.js";
import "./index-B-Ax1TuK.js";
import "./Combination-BdycxqGU.js";
import "./index-Bd_GsmbO.js";
import "./index-BrewpA67.js";
import "./index-G6S72QUb.js";
import "./index-DR2cXKlE.js";
import "./chevron-up-Dv3EV01C.js";
import "./check-Ckd98-EH.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$5 = [
  ["path", { d: "M17 7 7 17", key: "15tmo1" }],
  ["path", { d: "M17 17H7V7", key: "1org7z" }]
];
const ArrowDownLeft = createLucideIcon("arrow-down-left", __iconNode$5);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$4 = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M12 7v5l4 2", key: "1fdv2h" }]
];
const History = createLucideIcon("history", __iconNode$4);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  ["path", { d: "M10 18v-7", key: "wt116b" }],
  [
    "path",
    {
      d: "M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z",
      key: "1m329m"
    }
  ],
  ["path", { d: "M14 18v-7", key: "vav6t3" }],
  ["path", { d: "M18 18v-7", key: "aexdmj" }],
  ["path", { d: "M3 22h18", key: "8prr45" }],
  ["path", { d: "M6 18v-7", key: "1ivflk" }]
];
const Landmark = createLucideIcon("landmark", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
const Plus = createLucideIcon("plus", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M17 14V2", key: "8ymqnk" }],
  [
    "path",
    {
      d: "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z",
      key: "m61m77"
    }
  ]
];
const ThumbsDown = createLucideIcon("thumbs-down", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M7 10v12", key: "1qc93n" }],
  [
    "path",
    {
      d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",
      key: "emmmcr"
    }
  ]
];
const ThumbsUp = createLucideIcon("thumbs-up", __iconNode);
const PROPOSAL_TYPES = [
  "ParameterChange",
  "TreasuryTransfer",
  "TextResolution"
];
function CreateProposalModal({
  onClose,
  onCreated
}) {
  const { locale } = useLocale();
  const { actor } = useBackend();
  const [proposalType, setProposalType] = reactExports.useState("TextResolution");
  const [description, setDescription] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const isValid = description.trim().length >= 20;
  async function handleSubmit() {
    if (!isValid || !actor) return;
    setLoading(true);
    setError("");
    const a = actor;
    try {
      const typeVariant = { [`#${proposalType}`]: null };
      await a.createProposal(typeVariant, description.trim());
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : t(locale, "gov.createError"));
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: true, onOpenChange: (open) => !open && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-lg", "data-ocid": "create-proposal-modal", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t(locale, "gov.createModalTitle") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "proposal-type", children: t(locale, "gov.proposalType") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: proposalType,
            onValueChange: (v) => setProposalType(v),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectTrigger,
                {
                  id: "proposal-type",
                  "data-ocid": "proposal-type-select",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PROPOSAL_TYPES.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: type, children: t(locale, `gov.type.${type}`) }, type)) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t(
          locale,
          `gov.typeDesc.${proposalType}`
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "proposal-desc", children: [
          t(locale, "gov.description"),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-destructive", children: "*" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "proposal-desc",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: t(locale, "gov.descriptionPlaceholder"),
            rows: 5,
            className: "resize-none",
            "data-ocid": "proposal-description-input"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t(locale, "gov.descriptionHint") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              className: `text-xs tabular-nums ${description.length < 20 ? "text-muted-foreground" : "text-green-600"}`,
              children: [
                description.length,
                " / 20+"
              ]
            }
          )
        ] })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20", children: error })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: onClose,
          disabled: loading,
          "data-ocid": "create-cancel-btn",
          children: t(locale, "gov.cancel")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleSubmit,
          disabled: !isValid || loading,
          className: "gap-2",
          "data-ocid": "create-submit-btn",
          children: [
            loading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
            loading ? t(locale, "gov.submitting") : t(locale, "gov.submitProposal")
          ]
        }
      )
    ] })
  ] }) });
}
function Table({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "table-container",
      className: "relative w-full overflow-x-auto",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function getStatusKey(status) {
  if ("active" in status) return "active";
  if ("passed" in status) return "passed";
  if ("rejected" in status) return "rejected";
  if ("executed" in status) return "executed";
  return "expired";
}
function getProposalTypeLabel(type) {
  if ("__kind" in type) {
    switch (type.__kind) {
      case "ParameterChange":
        return "ParameterChange";
      case "TreasuryTransfer":
        return "TreasuryTransfer";
      case "TextResolution":
        return "TextResolution";
    }
  }
  return "Unknown";
}
function formatDate$1(ns) {
  return new Date(Number(ns / 1000000n)).toLocaleDateString(void 0, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function ExecutionHistoryTable({
  proposals,
  loading
}) {
  const { locale } = useLocale();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border", "data-ocid": "execution-history-table", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-5 w-5 text-muted-foreground" }),
      t(locale, "gov.history.title")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-0 pb-0", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 pb-6 space-y-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, i)) }) : proposals.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-14 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "mb-2 h-8 w-8 text-muted-foreground/30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t(locale, "gov.history.empty") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-16", children: "#" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: t(locale, "gov.history.colType") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "max-w-xs", children: t(locale, "gov.history.colDescription") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: t(locale, "gov.history.colStatus") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: t(locale, "gov.history.colDate") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: proposals.map((proposal) => {
        const typeLabel = getProposalTypeLabel(proposal.proposalType);
        const isPassed = "passed" in proposal.status;
        const isExecuted = "executed" in proposal.status;
        const isRejected = "rejected" in proposal.status;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TableRow,
          {
            "data-ocid": `history-row-${String(proposal.id)}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs text-muted-foreground", children: [
                "#",
                String(proposal.id)
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: "outline",
                  className: "text-xs whitespace-nowrap",
                  children: t(
                    locale,
                    `gov.type.${typeLabel}`
                  )
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground line-clamp-2 max-w-xs", children: proposal.description }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: "outline",
                  className: `text-xs whitespace-nowrap ${isExecuted ? "bg-muted text-muted-foreground border-border" : isPassed ? "bg-green-500/10 text-green-700 dark:text-green-200 border-green-500/20" : isRejected ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 border-yellow-500/20"}`,
                  children: t(
                    locale,
                    `gov.status.${isExecuted ? "executed" : isPassed ? "passed" : isRejected ? "rejected" : "expired"}`
                  )
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground whitespace-nowrap", children: formatDate$1(proposal.deadline) })
            ]
          },
          String(proposal.id)
        );
      }) })
    ] }) }) })
  ] });
}
const statusStyles = {
  active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  passed: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  executed: "bg-muted text-muted-foreground border-border",
  expired: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
};
function formatCountdown(deadlineNs) {
  const nowMs = Date.now();
  const deadlineMs = Number(deadlineNs / 1000000n);
  const diffMs = deadlineMs - nowMs;
  if (diffMs <= 0) return "0h";
  const hours = Math.floor(diffMs / 36e5);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}
function VoteBar({ yes, no }) {
  const total = yes + no;
  const yesPct = total === 0n ? 50 : Math.round(Number(yes * 100n / total));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsUp, { className: "h-3 w-3 text-green-500" }),
        String(yes)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
        String(no),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsDown, { className: "h-3 w-3 text-destructive" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "h-full rounded-full bg-green-500 transition-all duration-500",
        style: { width: `${yesPct}%` },
        "aria-hidden": "true"
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        yesPct,
        "% Yes"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        100 - yesPct,
        "% No"
      ] })
    ] })
  ] });
}
function ProposalCard({
  proposal,
  onVote,
  isAuthenticated
}) {
  const { locale } = useLocale();
  const statusKey = getStatusKey(proposal.status);
  const isActive = statusKey === "active";
  const typeLabel = getProposalTypeLabel(proposal.proposalType);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: "transition-smooth hover:shadow-md border-border",
      "data-ocid": `proposal-card-${String(proposal.id)}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "font-mono text-xs shrink-0", children: [
                "#",
                String(proposal.id)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs shrink-0", children: t(locale, `gov.type.${typeLabel}`) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: "outline",
                  className: `text-xs font-semibold shrink-0 ${statusStyles[statusKey]}`,
                  children: t(locale, `gov.status.${statusKey}`)
                }
              )
            ] }),
            isActive && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-xs text-muted-foreground shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
              formatCountdown(proposal.deadline)
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-medium text-foreground leading-relaxed line-clamp-3", children: proposal.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-mono", children: proposal.proposer })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-0 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(VoteBar, { yes: proposal.yesVotes, no: proposal.noVotes }),
          isActive && isAuthenticated && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              className: "w-full gap-2",
              onClick: onVote,
              "data-ocid": `proposal-vote-btn-${String(proposal.id)}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Vote, { className: "h-4 w-4" }),
                t(locale, "gov.voteBtn")
              ]
            }
          ),
          isActive && !isAuthenticated && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-muted-foreground", children: t(locale, "gov.loginToVote") })
        ] })
      ]
    }
  );
}
function formatUSDT(amount) {
  const whole = amount / 1000000n;
  const frac = amount % 1000000n;
  const fracStr = String(frac).padStart(6, "0").slice(0, 2);
  return `${whole.toLocaleString("en-US")}.${fracStr}`;
}
function formatDate(ns) {
  return new Date(Number(ns / 1000000n)).toLocaleString();
}
function shortenId(id) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
function TreasuryPanel({
  balance,
  withdrawals,
  loading
}) {
  const { locale } = useLocale();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", "data-ocid": "treasury-panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border bg-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-5 w-5 text-primary" }),
        t(locale, "gov.treasury.title")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-48" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-display font-bold text-foreground tabular-nums", children: formatUSDT(balance) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "mb-1 text-xs", children: "USDT" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: t(locale, "gov.treasury.balanceNote") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownLeft, { className: "h-5 w-5 text-muted-foreground" }),
        t(locale, "gov.treasury.recentFees")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-0 pb-0", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 pb-6 space-y-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, i)) }) : withdrawals.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownLeft, { className: "mb-2 h-8 w-8 text-muted-foreground/30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t(locale, "gov.treasury.noFees") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: t(locale, "gov.treasury.colTradeId") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: t(locale, "gov.treasury.colAmount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: t(locale, "gov.treasury.colDate") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { "data-ocid": "treasury-withdrawals-table", children: withdrawals.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TableRow,
          {
            "data-ocid": `withdrawal-row-${String(w.id)}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs text-muted-foreground", children: shortenId(w.tradeId) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-mono text-sm font-medium text-foreground", children: [
                "+",
                formatUSDT(w.amount),
                " USDT"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: formatDate(w.timestamp) })
            ]
          },
          String(w.id)
        )) })
      ] }) }) })
    ] })
  ] });
}
function VotingModal({
  proposal,
  onClose,
  onVoted
}) {
  const { locale } = useLocale();
  const { actor } = useBackend();
  const [selected, setSelected] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const total = proposal.yesVotes + proposal.noVotes;
  const yesPct = total === 0n ? 50 : Math.round(Number(proposal.yesVotes * 100n / total));
  const statusKey = getStatusKey(proposal.status);
  async function handleSubmit() {
    if (selected === null || !actor) return;
    setLoading(true);
    setError("");
    const a = actor;
    try {
      await a.voteOnProposal(proposal.id, selected);
      onVoted();
    } catch (e) {
      setError(e instanceof Error ? e.message : t(locale, "gov.voteError"));
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: true, onOpenChange: (open) => !open && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", "data-ocid": "voting-modal", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t(locale, "gov.voteModalTitle") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/30 p-4 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "font-mono text-xs", children: [
            "#",
            String(proposal.id)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: `text-xs ${statusKey === "active" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : ""}`,
              children: t(
                locale,
                `gov.status.${statusKey}`
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground leading-relaxed", children: proposal.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: t(locale, "gov.currentTally") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-green-600", children: String(proposal.yesVotes) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-600/80 mt-0.5", children: [
              t(locale, "gov.voteYes"),
              " (",
              yesPct,
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-destructive", children: String(proposal.noVotes) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-destructive/80 mt-0.5", children: [
              t(locale, "gov.voteNo"),
              " (",
              100 - yesPct,
              "%)"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: t(locale, "gov.yourVote") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setSelected(true),
              className: `flex items-center justify-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-smooth
                  ${selected === true ? "border-green-500 bg-green-500/15 text-green-600" : "border-border bg-card text-foreground hover:border-green-500/50 hover:bg-green-500/5"}`,
              "data-ocid": "vote-yes-btn",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsUp, { className: "h-5 w-5" }),
                t(locale, "gov.voteYes")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setSelected(false),
              className: `flex items-center justify-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-smooth
                  ${selected === false ? "border-destructive bg-destructive/15 text-destructive" : "border-border bg-card text-foreground hover:border-destructive/50 hover:bg-destructive/5"}`,
              "data-ocid": "vote-no-btn",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsDown, { className: "h-5 w-5" }),
                t(locale, "gov.voteNo")
              ]
            }
          )
        ] })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20", children: error })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: onClose,
          disabled: loading,
          "data-ocid": "vote-cancel-btn",
          children: t(locale, "gov.cancel")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleSubmit,
          disabled: selected === null || loading,
          className: "gap-2",
          "data-ocid": "vote-submit-btn",
          children: [
            loading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
            loading ? t(locale, "gov.submitting") : t(locale, "gov.submitVote")
          ]
        }
      )
    ] })
  ] }) });
}
function GovernancePage() {
  const { locale } = useLocale();
  const { actor, isFetching } = useBackend();
  const { isAuthenticated } = useAuth();
  const [proposals, setProposals] = reactExports.useState([]);
  const [executedProposals, setExecutedProposals] = reactExports.useState([]);
  const [treasuryBalance, setTreasuryBalance] = reactExports.useState(0n);
  const [withdrawals, setWithdrawals] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showCreateModal, setShowCreateModal] = reactExports.useState(false);
  const [votingProposal, setVotingProposal] = reactExports.useState(null);
  const [activeTab, setActiveTab] = reactExports.useState("active");
  const fetchData = reactExports.useCallback(async () => {
    if (!actor) return;
    const a = actor;
    try {
      const [propsRes, historyRes, balanceRes, withdrawalsRes] = await Promise.all([
        a.getProposals(),
        a.getExecutionHistory(),
        a.getTreasuryBalance(),
        a.getTreasuryWithdrawals()
      ]);
      setProposals(propsRes);
      setExecutedProposals(historyRes);
      setTreasuryBalance(balanceRes);
      setWithdrawals(withdrawalsRes);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [actor]);
  reactExports.useEffect(() => {
    if (!actor || isFetching) return;
    fetchData();
    const interval = setInterval(fetchData, 3e4);
    return () => clearInterval(interval);
  }, [actor, isFetching, fetchData]);
  const activeProposals = proposals.filter((p) => "active" in p.status);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "main",
    {
      className: "mx-auto max-w-5xl px-4 py-8 space-y-6",
      "data-ocid": "governance-page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-display font-bold text-foreground", children: t(locale, "gov.pageTitle") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1 text-sm", children: t(locale, "gov.pageSubtitle") })
          ] }),
          isAuthenticated && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => setShowCreateModal(true),
              className: "gap-2 self-start sm:self-auto",
              "data-ocid": "gov-create-proposal-btn",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
                t(locale, "gov.createProposal")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, "data-ocid": "gov-tabs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "w-full sm:w-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TabsTrigger,
              {
                value: "active",
                className: "gap-2",
                "data-ocid": "gov-tab-active",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Vote, { className: "h-4 w-4" }),
                  t(locale, "gov.tab.active"),
                  activeProposals.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary", children: activeProposals.length })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TabsTrigger,
              {
                value: "history",
                className: "gap-2",
                "data-ocid": "gov-tab-history",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-4 w-4" }),
                  t(locale, "gov.tab.history")
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TabsTrigger,
              {
                value: "treasury",
                className: "gap-2",
                "data-ocid": "gov-tab-treasury",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "h-4 w-4" }),
                  t(locale, "gov.tab.treasury")
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "active", className: "mt-6", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-40 w-full rounded-xl" }, i)) }) : activeProposals.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center",
              "data-ocid": "gov-empty-state",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Vote, { className: "mb-3 h-10 w-10 text-muted-foreground/50" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-foreground", children: t(locale, "gov.noActive") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: t(locale, "gov.noActiveDesc") }),
                isAuthenticated && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    variant: "outline",
                    className: "mt-4 gap-2",
                    onClick: () => setShowCreateModal(true),
                    "data-ocid": "gov-empty-create-btn",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
                      t(locale, "gov.createProposal")
                    ]
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", "data-ocid": "gov-proposals-list", children: activeProposals.map((proposal) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            ProposalCard,
            {
              proposal,
              onVote: () => setVotingProposal(proposal),
              isAuthenticated
            },
            String(proposal.id)
          )) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            ExecutionHistoryTable,
            {
              proposals: executedProposals,
              loading
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "treasury", className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            TreasuryPanel,
            {
              balance: treasuryBalance,
              withdrawals,
              loading
            }
          ) })
        ] }),
        showCreateModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
          CreateProposalModal,
          {
            onClose: () => setShowCreateModal(false),
            onCreated: () => {
              setShowCreateModal(false);
              fetchData();
            }
          }
        ),
        votingProposal && /* @__PURE__ */ jsxRuntimeExports.jsx(
          VotingModal,
          {
            proposal: votingProposal,
            onClose: () => setVotingProposal(null),
            onVoted: () => {
              setVotingProposal(null);
              fetchData();
            }
          }
        )
      ]
    }
  );
}
export {
  GovernancePage as default
};
