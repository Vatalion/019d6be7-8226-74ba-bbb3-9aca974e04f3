import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-background" data-ocid="privacy-page">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            {t("privacy.backHome")}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("privacy.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("privacy.intro")}
        </p>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            {t("privacy.pseudonymousTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("privacy.pseudonymousBody")}
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            {t("privacy.weStoreTitle")}
          </h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>{t("privacy.weStore1")}</li>
            <li>{t("privacy.weStore2")}</li>
            <li>{t("privacy.weStore3")}</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            {t("privacy.weDoNotTitle")}
          </h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>{t("privacy.weDoNot1")}</li>
            <li>{t("privacy.weDoNot2")}</li>
            <li>{t("privacy.weDoNot3")}</li>
          </ul>
        </section>
        <p className="text-sm text-muted-foreground">
          <Link to="/how-payments-work" className="text-accent hover:underline">
            {t("privacy.paymentsLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
