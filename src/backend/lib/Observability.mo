import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Cycles "mo:core/Cycles";
import Float "mo:core/Float";
import Prim "mo:⛔";
import Types "../types";

/// Observability — error ring buffer, module-level metrics, cycles tracking.
/// All functions are pure (state injected). No side effects.
module {

  // ─── Error types ──────────────────────────────────────────────────────────

  public type ErrorSeverity = {
    #info;
    #warning;
    #error;
    #critical;
  };

  public type ErrorLogEntry = {
    id            : Nat;
    timestamp     : Int;
    moduleName    : Text;
    functionName  : Text;
    errorMessage  : Text;
    userPrincipal : ?Principal;
    severity      : ErrorSeverity;
  };

  // ─── Module metrics types ─────────────────────────────────────────────────

  public type ModuleMetrics = {
    moduleName          : Text;
    var requestCount    : Nat;
    var errorCount      : Nat;
    var cyclesConsumed  : Nat;
    var memoryUsedBytes : Nat;
    var lastUpdated     : Int;
  };

  /// Immutable view — safe for Candid serialization.
  public type ModuleMetricsView = {
    moduleName      : Text;
    requestCount    : Nat;
    errorCount      : Nat;
    cyclesConsumed  : Nat;
    memoryUsedBytes : Nat;
    lastUpdated     : Int;
  };

  // ─── Phase 2 platform metrics ─────────────────────────────────────────────

  public type PlatformMetrics = {
    swapSuccessRate      : Float;
    avgSettlementTimeMin : Float;
    disputeRate          : Float;
    activeUsersLast24h   : Nat;
    monthlyActiveUsers   : Nat;
    totalTrades          : Nat;
    completedTrades      : Nat;
    totalVolume          : Float;
  };

  // ─── Cycles status ────────────────────────────────────────────────────────

  public type CyclesStatus = {
    currentBalance     : Nat;
    estimatedDailyBurn : Nat;
    warningThreshold   : Nat;
    isWarning          : Bool;
  };

  // ─── Ring buffer constants ────────────────────────────────────────────────

  let RING_CAPACITY     : Nat = 1000;
  let REQ_RING_CAPACITY : Nat = 10_000;

  // ─── Request metrics types ────────────────────────────────────────────────

  public type Timestamp = Int;

  public type RequestMetric = {
    endpoint   : Text;
    durationMs : Nat;
    timestamp  : Timestamp;
    status     : Nat;
  };

  // ─── Phase 2 admin metrics summary ───────────────────────────────────────

  public type MetricsSummary = {
    totalTrades    : Nat;
    activeTrades   : Nat;
    totalVolume    : Nat;
    totalRevenue   : Nat;
    avgTradeValue  : Nat;
    disputeRate    : Float;
    p95LatencyMs   : Nat;
    errorRate      : Float;
    cyclesBalance  : Nat;
    memoryUsage    : Nat;
  };

  // ─── Ring buffer helpers ──────────────────────────────────────────────────

  /// Remove the first element of the list (oldest entry) in-place by shifting.
  func _dropFirst(buf : List.List<ErrorLogEntry>) : () {
    let size = buf.size();
    if (size == 0) return;
    var i : Nat = 0;
    while (i + 1 < size) {
      buf.put(i, buf.at(i + 1));
      i += 1;
    };
    // size >= 1 is guaranteed by the guard above
    ignore buf.removeLast();
  };

  /// Push an entry into the bounded list (ring buffer semantics).
  /// When at capacity, drops the oldest entry first.
  public func pushEntry(
    buf   : List.List<ErrorLogEntry>,
    entry : ErrorLogEntry,
  ) : () {
    if (buf.size() >= RING_CAPACITY) {
      _dropFirst(buf);
    };
    buf.add(entry);
  };

  // ─── logError ─────────────────────────────────────────────────────────────

  /// Append a structured log entry to the ring buffer. Returns incremented nextId.
  public func logError(
    buf          : List.List<ErrorLogEntry>,
    nextId       : Nat,
    moduleName   : Text,
    functionName : Text,
    message      : Text,
    severity     : ErrorSeverity,
    caller       : ?Principal,
  ) : Nat {
    let entry : ErrorLogEntry = {
      id            = nextId;
      timestamp     = Time.now();
      moduleName    = moduleName;
      functionName  = functionName;
      errorMessage  = message;
      userPrincipal = caller;
      severity      = severity;
    };
    pushEntry(buf, entry);
    nextId + 1
  };

  /// Read up to `limit` most-recent entries (newest-first),
  /// optionally filtered by severity text ("info"|"warning"|"error"|"critical").
  public func readEntries(
    buf            : List.List<ErrorLogEntry>,
    limit          : Nat,
    severityFilter : ?Text,
  ) : [ErrorLogEntry] {
    let result = List.empty<ErrorLogEntry>();
    let size   = buf.size();
    var i : Nat = 0;
    while (i < size and result.size() < limit) {
      // Access from newest (size-1) down to oldest (0)
      // i goes 0..size-1; revIdx = size-1-i, but we avoid Nat underflow:
      let safeSize = if (size > 0) size else 1;
      let revIdx : Nat = safeSize - 1 - i;
      let entry = buf.at(revIdx);
      let matches = switch (severityFilter) {
        case null  true;
        case (?f)  severityToText(entry.severity) == f;
      };
      if (matches) result.add(entry);
      i += 1;
    };
    result.toArray()
  };

  public func severityToText(s : ErrorSeverity) : Text {
    switch s {
      case (#info)     "info";
      case (#warning)  "warning";
      case (#error)    "error";
      case (#critical) "critical";
    }
  };

  // ─── Module metrics ───────────────────────────────────────────────────────

  /// Record one call to a named module.
  public func recordModuleCall(
    metrics    : Map.Map<Text, ModuleMetrics>,
    moduleName : Text,
  ) : () {
    let m = _getOrCreateMetrics(metrics, moduleName);
    m.requestCount += 1;
    m.lastUpdated  := Time.now();
  };

  /// Record one error in a named module.
  public func recordModuleError(
    metrics    : Map.Map<Text, ModuleMetrics>,
    moduleName : Text,
  ) : () {
    let m = _getOrCreateMetrics(metrics, moduleName);
    m.errorCount  += 1;
    m.lastUpdated := Time.now();
  };

  func _getOrCreateMetrics(
    metrics    : Map.Map<Text, ModuleMetrics>,
    moduleName : Text,
  ) : ModuleMetrics {
    switch (metrics.get(moduleName)) {
      case (?m) m;
      case null {
        let m : ModuleMetrics = {
          moduleName          = moduleName;
          var requestCount    = 0;
          var errorCount      = 0;
          var cyclesConsumed  = 0;
          var memoryUsedBytes = 0;
          var lastUpdated     = Time.now();
        };
        metrics.add(moduleName, m);
        m
      };
    }
  };

  /// Return all module metrics as immutable views.
  public func getAllModuleMetrics(
    metrics : Map.Map<Text, ModuleMetrics>,
  ) : [ModuleMetricsView] {
    metrics.values().map(toMetricsView).toArray()
  };

  public func toMetricsView(m : ModuleMetrics) : ModuleMetricsView {
    {
      moduleName      = m.moduleName;
      requestCount    = m.requestCount;
      errorCount      = m.errorCount;
      cyclesConsumed  = m.cyclesConsumed;
      memoryUsedBytes = m.memoryUsedBytes;
      lastUpdated     = m.lastUpdated;
    }
  };

  // ─── Platform metrics (Phase 2) ───────────────────────────────────────────

  /// Compute Phase 2 KPI metrics from current stable state.
  public func calculatePlatformMetrics(
    trades   : Map.Map<Types.TradeId, Types.Trade>,
    disputes : Map.Map<Types.DisputeId, Types.Dispute>,
  ) : PlatformMetrics {
    let now            = Time.now();
    let oneDayNs  : Int  = 86_400_000_000_000;
    let thirtyDayNs : Int = 30 * oneDayNs;
    let cutoff24h    = now - oneDayNs;
    let cutoff30d    = now - thirtyDayNs;

    let totalTrades     = trades.size();
    var completedTrades   : Nat = 0;
    var totalSettlementNs : Int = 0;
    var totalVolume       : Float = 0.0;
    let activeUsers24h = Set.empty<Principal>();
    let activeUsers30d = Set.empty<Principal>();

    trades.forEach(func(_id, t : Types.Trade) {
      switch (t.status) {
        case (#complete) {
          completedTrades += 1;
          switch (t.completedAt) {
            case (?done) { totalSettlementNs += done - t.createdAt };
            case null    {};
          };
          totalVolume += t.amount.toFloat();
        };
        case _ {};
      };

      if (t.createdAt >= cutoff24h) {
        activeUsers24h.add(t.buyer);
        activeUsers24h.add(t.seller);
      };

      if (t.createdAt >= cutoff30d) {
        activeUsers30d.add(t.buyer);
        activeUsers30d.add(t.seller);
      };
    });

    let swapSuccessRate : Float =
      if (totalTrades == 0) 0.0
      else completedTrades.toFloat() / totalTrades.toFloat();

    let avgSettlementTimeMin : Float =
      if (completedTrades == 0) 0.0
      else {
        let avgNs : Int = totalSettlementNs / completedTrades.toInt();
        avgNs.toFloat() / 60_000_000_000.0
      };

    let totalDisputes = disputes.size();
    let disputeRate : Float =
      if (totalTrades == 0) 0.0
      else totalDisputes.toFloat() / totalTrades.toFloat();

    {
      swapSuccessRate;
      avgSettlementTimeMin;
      disputeRate;
      activeUsersLast24h   = activeUsers24h.size();
      monthlyActiveUsers   = activeUsers30d.size();
      totalTrades;
      completedTrades;
      totalVolume;
    }
  };

  // ─── Cycles ───────────────────────────────────────────────────────────────

  /// Returns current canister cycle balance.
  public func getCyclesBalance() : Nat {
    Cycles.balance()
  };

  /// Returns cycle status including warning flag (balance < 20% of max budget).
  public func getCyclesStatus() : CyclesStatus {
    let balance          = Cycles.balance();
    // Conservative max budget: 5 trillion cycles
    let maxBudget        : Nat = 5_000_000_000_000;
    let warningThreshold : Nat = maxBudget / 5;         // 20%
    // Rough estimate: ~1 billion cycles/month → ~33M/day
    let estimatedDailyBurn : Nat = 33_000_000;
    {
      currentBalance     = balance;
      estimatedDailyBurn = estimatedDailyBurn;
      warningThreshold   = warningThreshold;
      isWarning          = balance < warningThreshold;
    }
  };

  /// Returns true when canister cycles balance is below 20% of the 5T max budget.
  public func getCyclesWarning() : Bool {
    Cycles.balance() < 1_000_000_000_000
  };

  // ─── Request metrics ring buffer ─────────────────────────────────────────

  /// Record one request into the rolling request log (FIFO, cap 10 000).
  public func recordRequest(
    buf        : List.List<RequestMetric>,
    endpoint   : Text,
    durationMs : Nat,
    status     : Nat,
  ) : () {
    if (buf.size() >= REQ_RING_CAPACITY) {
      _dropFirstReq(buf);
    };
    buf.add({
      endpoint;
      durationMs;
      timestamp = Time.now();
      status;
    });
  };

  func _dropFirstReq(buf : List.List<RequestMetric>) : () {
    let size = buf.size();
    if (size == 0) return;
    var i : Nat = 0;
    while (i + 1 < size) {
      buf.put(i, buf.at(i + 1));
      i += 1;
    };
    ignore buf.removeLast();
  };

  // ─── P95 latency ──────────────────────────────────────────────────────────

  /// Returns P95 latency (ms) for `endpoint` within the last `windowHours`.
  /// Returns 0 when no matching entries exist.
  public func getP95Latency(
    buf         : List.List<RequestMetric>,
    endpoint    : Text,
    windowHours : Nat,
  ) : Nat {
    if (windowHours == 0) return 0;
    let windowNs : Int = windowHours.toInt() * 3_600_000_000_000;
    let cutoff   : Int = Time.now() - windowNs;
    // Collect durations for matching entries
    let durations = List.empty<Nat>();
    buf.forEach(func(m) {
      if (m.endpoint == endpoint and m.timestamp >= cutoff) {
        durations.add(m.durationMs);
      };
    });
    let count = durations.size();
    if (count == 0) return 0;
    // Insertion sort ascending (small arrays in practice)
    let arr = durations.toVarArray();
    _insertionSort(arr);
    let p95idx = (count * 95) / 100;
    let idx = if (p95idx >= count) count - 1 else p95idx;
    arr[idx]
  };

  func _insertionSort(arr : [var Nat]) : () {
    let n = arr.size();
    var i : Nat = 1;
    while (i < n) {
      let key = arr[i];
      var j : Nat = i;
      while (j > 0 and arr[j - 1] > key) {
        arr[j] := arr[j - 1];
        j -= 1;
      };
      arr[j] := key;
      i += 1;
    };
  };

  // ─── Request rate ─────────────────────────────────────────────────────────

  /// Returns requests per hour for `endpoint` within the last `windowHours`.
  public func getRequestRate(
    buf         : List.List<RequestMetric>,
    endpoint    : Text,
    windowHours : Nat,
  ) : Nat {
    if (windowHours == 0) return 0;
    let windowNs : Int = windowHours.toInt() * 3_600_000_000_000;
    let cutoff   : Int = Time.now() - windowNs;
    var count : Nat = 0;
    buf.forEach(func(m) {
      if (m.endpoint == endpoint and m.timestamp >= cutoff) {
        count += 1;
      };
    });
    count / windowHours
  };

  // ─── Error rate ───────────────────────────────────────────────────────────

  /// Returns percentage of non-200 responses for `endpoint` within `windowHours`.
  /// Returns 0.0 when no entries exist.
  public func getErrorRate(
    buf         : List.List<RequestMetric>,
    endpoint    : Text,
    windowHours : Nat,
  ) : Float {
    if (windowHours == 0) return 0.0;
    let windowNs : Int = windowHours.toInt() * 3_600_000_000_000;
    let cutoff   : Int = Time.now() - windowNs;
    var total    : Nat = 0;
    var errCount : Nat = 0;
    buf.forEach(func(m) {
      if (m.endpoint == endpoint and m.timestamp >= cutoff) {
        total += 1;
        if (m.status != 200) errCount += 1;
      };
    });
    if (total == 0) return 0.0;
    errCount.toFloat() / total.toFloat() * 100.0
  };

  // ─── Request log size ─────────────────────────────────────────────────────

  public func getRequestLogSize(buf : List.List<RequestMetric>) : Nat {
    buf.size()
  };

  // ─── Metrics summary (admin dashboard) ───────────────────────────────────

  /// Compute the full admin metrics summary used by the dashboard.
  public func getMetricsSummary(
    trades      : Map.Map<Types.TradeId, Types.Trade>,
    disputes    : Map.Map<Types.DisputeId, Types.Dispute>,
    requestLog  : List.List<RequestMetric>,
  ) : MetricsSummary {
    let totalTrades  : Nat   = trades.size();
    var activeTrades : Nat   = 0;
    var totalVolume  : Nat   = 0;
    var totalRevenue : Nat   = 0;   // 1% platform fee approximation

    trades.forEach(func(_id, t : Types.Trade) {
      switch (t.status) {
        case (#complete) {
          totalVolume  += t.amount;
          totalRevenue += t.amount / 100;   // ~1% fee
        };
        case (#pending or #funded or #buyer_confirmed or #payment_verified) {
          activeTrades += 1;
        };
        case _ {};
      };
    });

    let avgTradeValue : Nat =
      if (totalTrades == 0) 0
      else totalVolume / totalTrades;

    let totalDisputes = disputes.size();
    let disputeRate : Float =
      if (totalTrades == 0) 0.0
      else totalDisputes.toFloat() / totalTrades.toFloat() * 100.0;

    // P95 across ALL endpoints for the last hour
    let p95LatencyMs = _globalP95Latency(requestLog, 1);

    // Error rate across ALL endpoints for the last hour
    let errorRate    = _globalErrorRate(requestLog, 1);

    {
      totalTrades;
      activeTrades;
      totalVolume;
      totalRevenue;
      avgTradeValue;
      disputeRate;
      p95LatencyMs;
      errorRate;
      cyclesBalance = Cycles.balance();
      memoryUsage   = Prim.rts_heap_size();
    }
  };

  /// P95 latency across ALL endpoints within windowHours.
  func _globalP95Latency(buf : List.List<RequestMetric>, windowHours : Nat) : Nat {
    if (windowHours == 0) return 0;
    let windowNs : Int = windowHours.toInt() * 3_600_000_000_000;
    let cutoff   : Int = Time.now() - windowNs;
    let durations = List.empty<Nat>();
    buf.forEach(func(m) {
      if (m.timestamp >= cutoff) {
        durations.add(m.durationMs);
      };
    });
    let count = durations.size();
    if (count == 0) return 0;
    let arr = durations.toVarArray();
    _insertionSort(arr);
    let p95idx = (count * 95) / 100;
    let idx = if (p95idx >= count) count - 1 else p95idx;
    arr[idx]
  };

  /// Error rate across ALL endpoints within windowHours.
  func _globalErrorRate(buf : List.List<RequestMetric>, windowHours : Nat) : Float {
    if (windowHours == 0) return 0.0;
    let windowNs : Int = windowHours.toInt() * 3_600_000_000_000;
    let cutoff   : Int = Time.now() - windowNs;
    var total    : Nat = 0;
    var errCount : Nat = 0;
    buf.forEach(func(m) {
      if (m.timestamp >= cutoff) {
        total += 1;
        if (m.status != 200) errCount += 1;
      };
    });
    if (total == 0) return 0.0;
    errCount.toFloat() / total.toFloat() * 100.0
  };

}
