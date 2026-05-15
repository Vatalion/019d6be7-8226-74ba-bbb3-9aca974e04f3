import type { Feedback } from "@/backend.d";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimestamp } from "@/lib/format";
import { ChevronLeft, ChevronRight, MessageSquare, Star } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 8;
const STAR_KEYS = ["s1", "s2", "s3", "s4", "s5"] as const;
const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4"] as const;

interface FeedbackListProps {
  items: Feedback[];
  isLoading?: boolean;
}

function StarRating({ value }: { value: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${value} out of 5 stars`}
    >
      {STAR_KEYS.map((key, i) => (
        <Star
          key={key}
          className={`h-3 w-3 ${
            i < value ? "fill-accent text-accent" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function principalInitials(p: string): string {
  return p.slice(0, 2).toUpperCase();
}

function truncatePrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 6)}…${p.slice(-4)}`;
}

function FeedbackItemSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b border-border last:border-0">
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full max-w-sm" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function FeedbackList({ items, isLoading }: FeedbackListProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="card-elevated overflow-hidden">
        {SKELETON_KEYS.map((key) => (
          <FeedbackItemSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        data-ocid="feedback-empty"
        className="card-elevated flex flex-col items-center justify-center py-16 text-center px-4"
      >
        <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-foreground font-semibold mb-1">No reviews yet</h3>
        <p className="text-sm text-muted-foreground">
          Completed trades leave a review trail here
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card-elevated overflow-hidden" data-ocid="feedback-list">
        {pageItems.map((fb) => {
          const reviewerStr = fb.reviewer.toString();
          const rating = Number(fb.rating);
          const date = formatTimestamp(fb.createdAt);

          // trade token: derive label from trade id (best we can without full trade data)
          const tradeLabel = `Trade #${fb.trade.toString()}`;

          return (
            <div
              key={fb.id.toString()}
              data-ocid="feedback-item"
              className="flex gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
            >
              {/* Reviewer Avatar */}
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                  {principalInitials(reviewerStr)}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {/* Reviewer principal */}
                  <span
                    className="text-xs font-mono text-muted-foreground truncate"
                    title={reviewerStr}
                  >
                    {truncatePrincipal(reviewerStr)}
                  </span>

                  {/* Stars */}
                  <StarRating value={rating} />

                  {/* Trade chip */}
                  <span className="token-chip text-[10px] leading-none py-0.5 px-2">
                    {tradeLabel}
                  </span>
                </div>

                {/* Comment */}
                {fb.comment ? (
                  <p className="text-sm text-foreground/90 leading-snug break-words line-clamp-3">
                    {fb.comment}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No comment left
                  </p>
                )}

                {/* Date */}
                <p className="text-xs text-muted-foreground mt-1">
                  {date.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between mt-4 px-1"
          data-ocid="feedback-pagination"
        >
          <p className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, items.length)} of {items.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              aria-label="Previous page"
              data-ocid="feedback-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-1">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
              data-ocid="feedback-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
