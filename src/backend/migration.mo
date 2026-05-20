import Map "mo:core/Map";
import Types "types";

/// Upgrade migration for Caffeine stable-memory compatibility.
///
/// Live canister (draft v98+) already stores `Types.Listing` with Phase B fields
/// (`categoryId`, `bumpedAt`, `promotedUntil`). Older migration shapes that used
/// `LegacyListing` without those fields fail the stable check (M0170).
module {

  type OldActor = {
    listings     : Map.Map<Types.ListingId, Types.Listing>;
    nextReportId : { var value : Nat };
    reports      : Map.Map<Nat, Types.ListingReport>;
  };

  type NewActor = {
    listings     : Map.Map<Types.ListingId, Types.Listing>;
    nextReportId : { var value : Nat };
    reports      : Map.Map<Nat, Types.ListingReport>;
  };

  /// Identity on listings/reports when the deployed shape already matches `Types`.
  public func run(old : OldActor) : NewActor {
    {
      listings = old.listings;
      nextReportId = old.nextReportId;
      reports = old.reports;
    }
  };

};
