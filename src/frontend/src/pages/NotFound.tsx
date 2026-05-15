import { Link } from "@tanstack/react-router";
import { Home, Search } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center"
      data-ocid="not-found-page"
    >
      <div className="font-mono text-8xl font-bold text-gray-500 select-none">
        404
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="text-muted-foreground max-w-sm">
          This page doesn't exist or has been removed.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          asChild
          className="button-primary gap-2"
          data-ocid="btn-go-home"
        >
          <Link to="/">
            <Home className="h-4 w-4" />
            Go home
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="gap-2"
          data-ocid="btn-browse-listings"
        >
          <Link to="/listings">
            <Search className="h-4 w-4" />
            Browse listings
          </Link>
        </Button>
      </div>
    </div>
  );
}
