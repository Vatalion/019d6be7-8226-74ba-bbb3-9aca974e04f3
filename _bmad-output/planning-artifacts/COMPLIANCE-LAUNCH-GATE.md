# Compliance Launch Gate — CryptoMarket P2P

**Status:** Required implementation gate before public beta  
**Updated:** 2026-05-23  
**Scope:** Product documentation guardrail, not legal advice. Counsel sign-off is mandatory before launch claims or production onboarding.

---

## 1. Launch rule

CryptoMarket must not launch a public beta, paid marketplace, escrow wording, insurance wording, or broad stablecoin settlement flow until the checklist below is green and linked from E13.S1 launch evidence.

| Gate | Required decision | Story / evidence |
|------|-------------------|------------------|
| Jurisdiction scope | Allowed launch countries, blocked countries, and sanctions handling documented | E13.S1, admin policy record |
| Sanctions screening | User/wallet screening provider or manual process selected; fail-closed behavior defined | E4.S7, E3.S10 |
| AML/KYC tiers | Thresholds for anonymous, admin-verified, and blocked/high-risk trades documented | E12.S2, E3.S11 |
| Suspicious activity workflow | Moderator/admin workflow for suspicious tx, repeated abuse, and reporting escalation | E6.S9, E8.S1 |
| Travel-rule/legal assessment | Counsel decides whether the product is acting as CASP/VASP/MSB or marketplace coordinator in target jurisdictions | Counsel memo link |
| Privacy basis | Retention period, export/delete limits, wallet/transaction evidence retention, and user notice documented | E12.S1 |
| Marketing restrictions | No “trustless escrow”, “insured refund”, or “regulated” copy unless the corresponding wave gate is green | PHASE-1.5-LAUNCH-PROMISES |

---

## 2. Implementation defaults

- **Wave 1:** treat the platform as a marketplace coordinator with fail-closed explorer verification; do not claim custody, insurance, or full regulatory readiness.
- **Manual payment:** no `payment_verified` state without explorer match; seller confirmation alone is not sufficient.
- **Wallets:** wallet binding requires signed nonce and immutable PaymentIntent snapshot.
- **Limits:** default beta cap is 500 USDT unless counsel/product owner lowers it.
- **KYC:** admin manual verified tier may exist; external provider integration remains Wave 4+ until vendor/legal review.
- **Suspicious activity:** hold payout or block new trades rather than auto-completing when sanctions/AML evidence is unresolved.

---

## 3. External reference points for counsel

These references are not implementation instructions; they identify areas counsel must evaluate:

| Area | Official reference |
|------|--------------------|
| EU crypto-asset service provider framework | Regulation (EU) 2023/1114 / MiCA: https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32023R1114 |
| EU transfer information / travel rule | Regulation (EU) 2023/1113: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32023R1113 |
| EBA travel-rule guidance | https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/anti-money-laundering-and-countering-financing-terrorism/guidelines-information-requirements-relation-transfers-funds-and-certain-crypto-assets-transfers |
| Ukraine financial monitoring / AML-CFT | National Bank of Ukraine financial monitoring: https://bank.gov.ua/en/supervision/monitoring |

---

## 4. E13.S1 evidence requirement

For launch readiness, E13.S1 must include:

1. Compliance gate checklist with owner/counsel decision ID.
2. Screenshots or admin records showing sanctions/blocked-country behavior, if enabled.
3. Test evidence that blocked/high-risk flows do not advance trade state or payout.
4. Copy review proving user-facing promises match Wave 1/2/3 capabilities.
