import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useBackend } from "../../hooks/useBackend";
import { useLocale } from "../../hooks/useLocale";
import { t } from "../../i18n";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface CreateProposalModalProps {
  onClose: () => void;
  onCreated: () => void;
}

type ProposalTypeKey =
  | "ParameterChange"
  | "TreasuryTransfer"
  | "TextResolution";

const PROPOSAL_TYPES: ProposalTypeKey[] = [
  "ParameterChange",
  "TreasuryTransfer",
  "TextResolution",
];

export default function CreateProposalModal({
  onClose,
  onCreated,
}: CreateProposalModalProps) {
  const { locale } = useLocale();
  const { actor } = useBackend();
  const [proposalType, setProposalType] =
    useState<ProposalTypeKey>("TextResolution");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = description.trim().length >= 20;

  async function handleSubmit() {
    if (!isValid || !actor) return;
    setLoading(true);
    setError("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = actor as unknown as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;
    try {
      const typeVariant = { [`#${proposalType}`]: null };
      await a.createProposal(typeVariant, description.trim());
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t(locale, "gov.createError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" data-ocid="create-proposal-modal">
        <DialogHeader>
          <DialogTitle>{t(locale, "gov.createModalTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Proposal type */}
          <div className="space-y-2">
            <Label htmlFor="proposal-type">
              {t(locale, "gov.proposalType")}
            </Label>
            <Select
              value={proposalType}
              onValueChange={(v) => setProposalType(v as ProposalTypeKey)}
            >
              <SelectTrigger
                id="proposal-type"
                data-ocid="proposal-type-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPOSAL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(locale, `gov.type.${type}` as Parameters<typeof t>[1])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              {t(
                locale,
                `gov.typeDesc.${proposalType}` as Parameters<typeof t>[1],
              )}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="proposal-desc">
              {t(locale, "gov.description")}
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Textarea
              id="proposal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(locale, "gov.descriptionPlaceholder")}
              rows={5}
              className="resize-none"
              data-ocid="proposal-description-input"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t(locale, "gov.descriptionHint")}
              </p>
              <span
                className={`text-xs tabular-nums ${
                  description.length < 20
                    ? "text-muted-foreground"
                    : "text-green-600"
                }`}
              >
                {description.length} / 20+
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            data-ocid="create-cancel-btn"
          >
            {t(locale, "gov.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="gap-2"
            data-ocid="create-submit-btn"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? t(locale, "gov.submitting")
              : t(locale, "gov.submitProposal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
