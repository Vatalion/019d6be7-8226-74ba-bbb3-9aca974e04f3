import { Actor, HttpAgent, type Identity } from "@icp-sdk/core/agent";
import { IDL, type IDL as IDLNamespace } from "@icp-sdk/core/candid";
import { Principal } from "@icp-sdk/core/principal";

const IC_MAINNET_HOST = "https://icp-api.io";

const icrcLedgerIdlFactory: IDLNamespace.InterfaceFactory = ({ IDL: I }) => {
  const transferFromErr = I.Variant({
    BadFee: I.Record({ expected_fee: I.Nat }),
    BadBurn: I.Record({ min_burn_amount: I.Nat }),
    InsufficientFunds: I.Record({ balance: I.Nat }),
    InsufficientAllowance: I.Record({ allowance: I.Nat }),
    TooOld: I.Null,
    CreatedInFuture: I.Record({ ledger_time: I.Nat64 }),
    Duplicate: I.Record({ duplicate_of: I.Nat }),
    TemporarilyUnavailable: I.Null,
    GenericError: I.Record({ error_code: I.Nat, message: I.Text }),
  });

  return I.Service({
    icrc1_fee: I.Func([], [I.Nat], ["query"]),
    icrc2_approve: I.Func(
      [
        I.Record({
          from_subaccount: I.Opt(I.Vec(I.Nat8)),
          spender: I.Record({
            owner: I.Principal,
            subaccount: I.Opt(I.Vec(I.Nat8)),
          }),
          amount: I.Nat,
          expires_at: I.Opt(I.Nat64),
          fee: I.Opt(I.Nat),
          memo: I.Opt(I.Vec(I.Nat8)),
          created_at_time: I.Opt(I.Nat64),
        }),
      ],
      [I.Variant({ Ok: I.Nat, Err: transferFromErr })],
      [],
    ),
  });
};

type IcrcLedgerActor = {
  icrc1_fee: () => Promise<bigint>;
  icrc2_approve: (args: {
    from_subaccount: [] | [Uint8Array];
    spender: { owner: Principal; subaccount: [] | [Uint8Array] };
    amount: bigint;
    expires_at: [] | [bigint];
    fee: [] | [bigint];
    memo: [] | [Uint8Array];
    created_at_time: [] | [bigint];
  }) => Promise<{ Ok: bigint } | { Err: Record<string, unknown> }>;
};

function mapIcrcApproveError(err: Record<string, unknown>): string {
  const key = Object.keys(err)[0];
  if (!key) return "ICRC-2 approve failed";
  if (key === "InsufficientFunds")
    return "Insufficient token balance for approve fee";
  if (key === "InsufficientAllowance") return "Insufficient allowance";
  if (key === "TemporarilyUnavailable")
    return "Ledger temporarily unavailable — retry";
  if (
    key === "GenericError" &&
    err.GenericError &&
    typeof err.GenericError === "object"
  ) {
    const ge = err.GenericError as { message?: string };
    return ge.message ?? "ICRC-2 approve failed";
  }
  return `ICRC-2 approve failed (${key})`;
}

async function createLedgerActor(
  ledgerCanisterId: string,
  identity: Identity,
  host = IC_MAINNET_HOST,
): Promise<IcrcLedgerActor> {
  const agent = new HttpAgent({ host, identity });
  return Actor.createActor<IcrcLedgerActor>(icrcLedgerIdlFactory, {
    agent,
    canisterId: ledgerCanisterId,
  });
}

/**
 * ICRC-2 approve so the marketplace backend can icrc2_transfer_from buyer → escrow.
 * Approves trade amount + one ledger transfer fee as buffer.
 */
export async function icrc2ApproveEscrowSpend(params: {
  ledgerCanisterId: string;
  backendCanisterId: string;
  amount: bigint;
  identity: Identity;
  host?: string;
}): Promise<void> {
  const ledger = await createLedgerActor(
    params.ledgerCanisterId,
    params.identity,
    params.host,
  );
  const fee = await ledger.icrc1_fee();
  const approveAmount = params.amount + fee;

  const result = await ledger.icrc2_approve({
    from_subaccount: [],
    spender: {
      owner: Principal.fromText(params.backendCanisterId),
      subaccount: [],
    },
    amount: approveAmount,
    expires_at: [],
    fee: [],
    memo: [],
    created_at_time: [],
  });

  if ("Err" in result) {
    throw new Error(mapIcrcApproveError(result.Err));
  }
}
