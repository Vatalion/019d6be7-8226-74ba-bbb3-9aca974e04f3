/// LaunchGate — Wave 1 beta readiness gates (E13.S1 / COMPLIANCE-LAUNCH-GATE.md).
module {

  /// Public beta requires counsel sign-off AND green P0 technical tests (LG-17).
  public func isPublicBetaLaunchAllowed(
    complianceSignedOff : Bool,
    p0TestsGreen : Bool,
  ) : Bool {
    complianceSignedOff and p0TestsGreen
  };

}
