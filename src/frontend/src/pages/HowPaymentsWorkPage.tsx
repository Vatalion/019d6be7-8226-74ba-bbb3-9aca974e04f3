import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Wallet } from "lucide-react";

export default function HowPaymentsWorkPage() {
  const { t } = useLocale();

  const phases = [
    {
      title: t("paymentsGuide.phase1.title"),
      body: t("paymentsGuide.phase1.body"),
      items: [
        t("paymentsGuide.phase1.item1"),
        t("paymentsGuide.phase1.item2"),
        t("paymentsGuide.phase1.item3"),
      ],
    },
    {
      title: t("paymentsGuide.phase2.title"),
      body: t("paymentsGuide.phase2.body"),
      items: [
        t("paymentsGuide.phase2.item1"),
        t("paymentsGuide.phase2.item2"),
      ],
    },
    {
      title: t("paymentsGuide.phase3.title"),
      body: t("paymentsGuide.phase3.body"),
      items: [t("paymentsGuide.phase3.item1")],
    },
  ];

  return (
    <div className="min-h-screen bg-background" data-ocid="how-payments-work-page">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <div>
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-4" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              {t("paymentsGuide.backHome")}
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {t("paymentsGuide.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("paymentsGuide.intro")}
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            {t("paymentsGuide.honestyBanner")}
          </p>
        </div>

        <div className="space-y-6">
          {phases.map((phase, idx) => (
            <section
              key={phase.title}
              className="card-elevated p-5 sm:p-6 space-y-3"
              data-ocid={`payments-guide-phase-${idx + 1}`}
            >
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {idx === 0 && <Wallet className="w-5 h-5 text-accent" />}
                {phase.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {phase.body}
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 marker:text-accent">
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button asChild className="flex-1">
            <Link to="/listings">{t("paymentsGuide.browseCta")}</Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link to="/trades">{t("paymentsGuide.tradesCta")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
