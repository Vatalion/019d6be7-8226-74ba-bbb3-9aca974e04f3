import {
  ListingCard,
  ListingCardSkeleton,
} from "@/components/marketplace/ListingCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import { useLocale } from "@/hooks/useLocale";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  FileText,
  LogIn,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { CategoryGrid } from "@/components/marketplace/CategoryGrid";
import { searchListingsWithCategory } from "@/lib/marketplaceActor";
import { motion } from "motion/react";

// ─── featured listings hook ─────────────────────────────────────────────────

function useFeaturedListings() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["listings", "featured"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await searchListingsWithCategory(actor, {
          query: null,
          category: null,
          categoryId: null,
          priceMin: null,
          priceMax: null,
          location: null,
          condition: null,
          shippingCarrier: null,
          offset: 0n,
          limit: 6n,
          priceToken: null,
        });
      } catch (err) {
        console.warn("[useFeaturedListings] searchListings failed:", err);
        return [];
      }
    },
    enabled: !isFetching,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });
}

// ─── hero section ───────────────────────────────────────────────────────────

function HeroSection() {
  const { identity, isAuthenticated, isLoggingIn, login } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  return (
    <section
      data-ocid="hero"
      className="relative w-full flex items-center justify-center overflow-hidden min-h-[180px] sm:min-h-[420px]"
      style={{
        background:
          "linear-gradient(135deg, #0f0f1a 0%, #1a1040 40%, #0d1b2a 100%)",
      }}
    >
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 text-center py-6 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Badge: hidden on mobile */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {t("hero.badge")}
          </div>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-2 sm:mb-5">
            {t("hero.title")}{" "}
            <span
              className="text-accent"
              style={{ textShadow: "0 0 40px oklch(0.72 0.18 145 / 0.5)" }}
            >
              {t("hero.titleHighlight")}
            </span>
          </h1>

          {/* Subtitle: hidden on mobile */}
          <p className="hidden sm:block text-lg text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">
            {t("hero.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
        >
          {/* Primary CTA — full-width on mobile */}
          <Button
            data-ocid="hero-browse-cta"
            size="lg"
            className="button-primary group gap-2 text-sm sm:text-base px-5 sm:px-8 py-2.5 sm:py-3 h-auto w-full sm:w-auto"
            onClick={() => navigate({ to: "/listings" })}
          >
            {t("hero.browseCta")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          {/* Secondary: hidden on mobile */}
          <div className="hidden sm:block">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-card/60 backdrop-blur-sm border border-border text-sm text-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="font-medium">{t("hero.welcomeBack")}</span>
                <span className="text-muted-foreground font-mono text-xs truncate max-w-[120px]">
                  {identity?.getPrincipal().toText().slice(0, 8)}…
                </span>
              </div>
            ) : (
              <Button
                data-ocid="hero-login-cta"
                variant="outline"
                size="lg"
                className="gap-2 text-base px-6 py-3 h-auto bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-md border border-gray-200"
                onClick={login}
                disabled={isLoggingIn}
              >
                <LogIn className="w-4 h-4" />
                {isLoggingIn ? t("nav.connecting") : t("hero.loginCta")}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Token chips: only on lg+ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="hidden lg:flex flex-wrap justify-center gap-2 mt-8"
          aria-label="Supported payment tokens"
        >
          {["USDT · TRC20", "USDT · BEP20", "USDT · ERC20", "USDC · ERC20"].map(
            (token) => (
              <span
                key={token}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs text-white font-medium border border-white/40 bg-white/20 backdrop-blur-sm"
              >
                {token}
              </span>
            ),
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ─── featured listings section ───────────────────────────────────────────────

function FeaturedListings() {
  const { data: listings, isLoading, isError } = useFeaturedListings();
  const { t } = useLocale();
  const navigate = useNavigate();

  return (
    <section
      data-ocid="featured-listings"
      className="bg-background py-6 sm:py-16"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div>
            <h2 className="text-base sm:text-2xl font-display font-semibold sm:font-bold text-foreground">
              {t("listings.featured")}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              {t("listings.featuredSub")}
            </p>
          </div>
          <Button
            data-ocid="view-all-listings"
            variant="outline"
            size="sm"
            className="gap-2 hidden sm:flex"
            onClick={() => navigate({ to: "/listings" })}
          >
            {t("listings.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {isLoading && (
          <div
            data-ocid="listings-loading"
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div
            data-ocid="listings-error"
            className="text-center py-12 text-muted-foreground"
          >
            {t("listings.loadFailed")}
          </div>
        )}

        {!isLoading && !isError && listings && listings.length === 0 && (
          <div
            data-ocid="listings-empty"
            className="text-center py-12 flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {t("listings.noListings")}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("listings.noListingsFirst")}
              </p>
            </div>
            <Button
              data-ocid="create-first-listing"
              onClick={() => navigate({ to: "/listings/create" })}
            >
              {t("listings.postFirst")}
            </Button>
          </div>
        )}

        {!isLoading && !isError && listings && listings.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {listings.map((listing) => (
                <motion.div
                  key={listing.id.toString()}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35 }}
                >
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-5 sm:hidden">
              <Button
                data-ocid="view-all-listings-mobile"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate({ to: "/listings" })}
              >
                {t("listings.viewAllListings")}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── how it works section ────────────────────────────────────────────────────

function HowItWorks() {
  const { t } = useLocale();

  const HOW_IT_WORKS = [
    {
      icon: FileText,
      step: "01",
      title: t("hiw.step1.title"),
      desc: t("hiw.step1.desc"),
    },
    {
      icon: Wallet,
      step: "02",
      title: t("hiw.step2.title"),
      desc: t("hiw.step2.desc"),
    },
    {
      icon: ShieldCheck,
      step: "03",
      title: t("hiw.step3.title"),
      desc: t("hiw.step3.desc"),
    },
  ];

  return (
    <section
      data-ocid="how-it-works"
      className="py-8 sm:py-16"
      style={{ background: "oklch(0.18 0 0)" }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Desktop: full heading + subtitle */}
        <div className="hidden sm:block text-center mb-12">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            {t("hiw.title")}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            {t("hiw.subtitle")}
          </p>
          <p className="mt-3">
            <Link
              to="/"
              hash="how-payments-work"
              className="text-sm text-accent hover:underline"
              data-ocid="hiw-payments-guide-link"
            >
              {t("paymentsGuide.learnMore")} →
            </Link>
          </p>
        </div>

        {/* Mobile: compact horizontal strip */}
        <div className="sm:hidden flex items-center justify-around gap-1 mb-1">
          {HOW_IT_WORKS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                data-ocid={`how-it-works-step-mobile-${idx + 1}`}
                className="flex flex-col items-center gap-1.5 flex-1 px-1"
              >
                <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[11px] text-center text-muted-foreground font-medium leading-tight">
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Desktop: full cards */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {HOW_IT_WORKS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                data-ocid={`how-it-works-step-${idx + 1}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="relative flex flex-col items-start gap-4 p-6 rounded-xl border border-border bg-card hover:border-accent/30 transition-smooth group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-smooth">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="font-mono text-3xl font-bold text-muted/30 select-none">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── payments guide (hash target for footer / pre-route deploy) ─────────────

function PaymentsGuideSection() {
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
  ];

  return (
    <section
      id="how-payments-work"
      data-ocid="how-payments-work"
      className="bg-background py-8 sm:py-14 border-t border-border scroll-mt-20"
    >
      <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            {t("paymentsGuide.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {t("paymentsGuide.intro")}
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-4 text-sm leading-relaxed">
          {t("paymentsGuide.honestyBanner")}
        </div>
        {phases.map((phase, idx) => (
          <div
            key={phase.title}
            className="card-elevated p-5 space-y-2"
            data-ocid={`payments-guide-phase-${idx + 1}`}
          >
            <h3 className="font-semibold text-foreground">{phase.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {phase.body}
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              {phase.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <Link
          to="/how-payments-work"
          className="text-sm text-accent hover:underline inline-block"
          data-ocid="payments-guide-full-page-link"
        >
          {t("paymentsGuide.learnMore")} (full page) →
        </Link>
      </div>
    </section>
  );
}

// ─── trust banner ────────────────────────────────────────────────────────────

function TrustBanner() {
  const { t } = useLocale();
  return (
    <section className="bg-background py-6 sm:py-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Mobile: compact stacked */}
        <div className="flex flex-col sm:hidden gap-2">
          {[
            { labelKey: "trust.escrow" as const, icon: ShieldCheck },
            { labelKey: "trust.identity" as const, icon: LogIn },
            { labelKey: "trust.multiToken" as const, icon: Wallet },
          ].map(({ labelKey, icon: Icon }) => (
            <div
              key={labelKey}
              className="flex items-center gap-2 text-muted-foreground text-xs"
            >
              <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>{t(labelKey)}</span>
            </div>
          ))}
        </div>

        {/* Desktop: horizontal */}
        <div className="hidden sm:flex flex-wrap justify-center gap-8 text-center">
          {[
            { labelKey: "trust.escrow" as const, icon: ShieldCheck },
            { labelKey: "trust.identity" as const, icon: LogIn },
            { labelKey: "trust.multiToken" as const, icon: Wallet },
          ].map(({ labelKey, icon: Icon }) => (
            <div
              key={labelKey}
              className="flex items-center gap-2 text-muted-foreground text-sm"
            >
              <Icon className="w-4 h-4 text-accent flex-shrink-0" />
              <span>{t(labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <section className="bg-background py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <CategoryGrid />
        </div>
      </section>
      <FeaturedListings />
      <Separator className="bg-border/50" />
      <HowItWorks />
      <PaymentsGuideSection />
      <TrustBanner />
    </div>
  );
}
