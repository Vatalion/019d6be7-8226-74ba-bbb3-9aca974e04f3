import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ProfileGuard } from "./components/ProfileGuard";
import Layout from "./components/layout/Layout";
import { NotificationProvider } from "./contexts/NotificationContext";
import { LocaleProvider } from "./hooks/useLocale";
import { validateCreateListingSearch } from "./lib/createListingSearch";
import { validateListingsSearch } from "./lib/listingsSearch";

// Lazy page imports
import { Suspense, lazy } from "react";
import LoadingSpinner from "./components/shared/LoadingSpinner";

const Home = lazy(() => import("./pages/Home"));
const Listings = lazy(() => import("./pages/Listings"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const CreateListing = lazy(() => import("./pages/CreateListingPage"));
const Trades = lazy(() => import("./pages/Trades"));
const TradeDetail = lazy(() => import("./pages/TradeDetailPage"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const Admin = lazy(() => import("./pages/Admin"));
const JurorDashboard = lazy(() => import("./pages/JurorDashboardPage"));
const GovernancePage = lazy(() => import("./pages/GovernancePage"));
const VaultPage = lazy(() => import("./pages/VaultPage"));
const AddPaymentMethod = lazy(() => import("./pages/AddPaymentMethodPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const HowPaymentsWork = lazy(() => import("./pages/HowPaymentsWorkPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

/** Wraps a lazy page in both Suspense and ProfileGuard */
function GuardedPage({ children }: { children: React.ReactNode }) {
  return (
    <PageSuspense>
      <ProfileGuard>{children}</ProfileGuard>
    </PageSuspense>
  );
}

/**
 * Root layout component — wraps Outlet with NotificationProvider so that
 * polling starts once the user is authenticated and navigates into the app.
 * NotificationProvider must live inside RouterProvider to use useNavigate().
 */
function RootLayout() {
  return (
    <NotificationProvider>
      <Layout />
    </NotificationProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <PageSuspense>
      <Home />
    </PageSuspense>
  ),
});

const howPaymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/how-payments-work",
  component: () => (
    <PageSuspense>
      <HowPaymentsWork />
    </PageSuspense>
  ),
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: () => (
    <PageSuspense>
      <PrivacyPage />
    </PageSuspense>
  ),
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: () => (
    <PageSuspense>
      <OnboardingPage />
    </PageSuspense>
  ),
});

export const listingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listings",
  validateSearch: validateListingsSearch,
  component: () => (
    <PageSuspense>
      <Listings />
    </PageSuspense>
  ),
});

const listingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listings/$id",
  component: () => (
    <PageSuspense>
      <ListingDetail />
    </PageSuspense>
  ),
});

export const createListingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listings/create",
  validateSearch: validateCreateListingSearch,
  component: () => (
    <GuardedPage>
      <CreateListing />
    </GuardedPage>
  ),
});

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/favorites",
  component: () => (
    <GuardedPage>
      <FavoritesPage />
    </GuardedPage>
  ),
});

const tradesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trades",
  component: () => (
    <GuardedPage>
      <Trades />
    </GuardedPage>
  ),
});

const tradeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trades/$id",
  component: () => (
    <GuardedPage>
      <TradeDetail />
    </GuardedPage>
  ),
});

const sellerProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$id",
  component: () => (
    <PageSuspense>
      <SellerProfile />
    </PageSuspense>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <GuardedPage>
      <Admin />
    </GuardedPage>
  ),
});

const jurorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jurors",
  component: () => (
    <GuardedPage>
      <JurorDashboard />
    </GuardedPage>
  ),
});

const governanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/governance",
  component: () => (
    <GuardedPage>
      <GovernancePage />
    </GuardedPage>
  ),
});

const vaultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vault",
  component: () => (
    <GuardedPage>
      <VaultPage />
    </GuardedPage>
  ),
});

const addPaymentMethodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add-payment-method",
  component: () => (
    <GuardedPage>
      <AddPaymentMethod />
    </GuardedPage>
  ),
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/not-found",
  component: () => (
    <PageSuspense>
      <NotFound />
    </PageSuspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  howPaymentsRoute,
  privacyRoute,
  onboardingRoute,
  createListingRoute,
  listingDetailRoute,
  listingsRoute,
  favoritesRoute,
  tradeDetailRoute,
  tradesRoute,
  sellerProfileRoute,
  adminRoute,
  jurorRoute,
  governanceRoute,
  vaultRoute,
  addPaymentMethodRoute,
  notFoundRoute,
]);

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => (
    <PageSuspense>
      <NotFound />
    </PageSuspense>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <LocaleProvider>
      <RouterProvider router={router} />
    </LocaleProvider>
  );
}

// Re-export Outlet for RootLayout usage (avoids the unused import warning)
export { Outlet };
