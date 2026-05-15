import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";

export default function CreateListing() {
  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
      data-ocid="create-listing-page"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
          <Plus className="h-5 w-5 text-accent" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Create listing
        </h1>
      </div>
      <div className="card-elevated p-8 text-center space-y-3">
        <p className="text-muted-foreground">
          Listing creation form will be built here.
        </p>
        <Button asChild variant="outline">
          <Link to="/listings">Browse existing listings</Link>
        </Button>
      </div>
    </div>
  );
}
