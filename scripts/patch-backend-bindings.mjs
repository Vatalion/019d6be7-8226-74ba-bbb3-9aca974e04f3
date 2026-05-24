#!/usr/bin/env node
/**
 * icp-bindgen currently drops optional categoryId on listing APIs — restore after bindgen.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const src = path.resolve(import.meta.dirname, "../src/frontend/src");

function read(rel) {
  return readFileSync(path.join(src, rel), "utf8");
}
function write(rel, text) {
  writeFileSync(path.join(src, rel), text);
}

function replaceOnce(text, from, to, label) {
  if (text.includes(to)) return { text, changed: false };
  if (!text.includes(from)) return { text, changed: false };
  return { text: text.replace(from, to), changed: true, label };
}

let changedAny = false;

// ── Signatures (backend.d.ts + backend.ts interface block) ──
for (const file of ["backend.d.ts", "backend.ts"]) {
  let t = read(file);
  for (const [from, to, label] of [
    [
      "searchListings(query: string | null, category: ListingCategory | null, priceMin: bigint | null",
      "searchListings(query: string | null, category: ListingCategory | null, categoryId: bigint | null, priceMin: bigint | null",
      `${file} searchListings sig`,
    ],
    [
      "createListing(title: string, description: string, category: ListingCategory, priceAmount: bigint",
      "createListing(title: string, description: string, category: ListingCategory, categoryId: bigint | null, priceAmount: bigint",
      `${file} createListing sig`,
    ],
    [
      "updateListing(id: ListingId, title: string, description: string, category: ListingCategory, priceAmount: bigint",
      "updateListing(id: ListingId, title: string, description: string, category: ListingCategory, categoryId: bigint | null, priceAmount: bigint",
      `${file} updateListing sig`,
    ],
    [
      "createActor(canisterId: string, options: CreateActorOptions = {})",
      "createActor(canisterId: string, optionsOrUploadFile?: CreateActorOptions | unknown, downloadFile?: unknown, actorOptions?: CreateActorOptions)",
      `${file} createActor overload`,
    ],
  ]) {
    const r = replaceOnce(t, from, to, label);
    t = r.text;
    if (r.changed) {
      changedAny = true;
      console.log(`patched ${r.label}`);
    }
  }
  write(file, t);
}

// ── createActor implementation compatibility with @caffeineai/core-infrastructure ──
let backend = read("backend.ts");
const generatedCreateActor =
  "export function createActor(canisterId: string, options: CreateActorOptions = {}): Backend {\n    const agent = options.agent || HttpAgent.createSync({";
const compatibleCreateActor =
  "export function createActor(canisterId: string, optionsOrUploadFile: CreateActorOptions | unknown = {}, _downloadFile?: unknown, actorOptions?: CreateActorOptions): Backend {\n    const options = (actorOptions ?? (typeof optionsOrUploadFile === \"function\" ? {} : optionsOrUploadFile)) as CreateActorOptions;\n    const agent = options.agent || HttpAgent.createSync({";
if (backend.includes(generatedCreateActor)) {
  backend = backend.replace(generatedCreateActor, compatibleCreateActor);
  write("backend.ts", backend);
  changedAny = true;
  console.log("patched backend.ts createActor compatibility");
}
const halfPatchedCreateActor =
  "export function createActor(canisterId: string, optionsOrUploadFile?: CreateActorOptions | unknown, downloadFile?: unknown, actorOptions?: CreateActorOptions): Backend {\n    const agent = options.agent || HttpAgent.createSync({";
if (backend.includes(halfPatchedCreateActor)) {
  backend = backend.replace(halfPatchedCreateActor, compatibleCreateActor);
  write("backend.ts", backend);
  changedAny = true;
  console.log("patched backend.ts createActor compatibility");
}

// ── searchListings implementation ──
backend = read("backend.ts");
const brokenSearchSig =
  "async searchListings(arg0: string | null, arg1: ListingCategory | null, arg2: bigint | null, arg3: bigint | null, arg4: string | null, arg5: ItemCondition | null, arg6: ShippingCarrier | null, arg7: bigint, arg8: bigint, arg9: TradeToken | null)";
const fixedSearchSig =
  "async searchListings(arg0: string | null, arg1: ListingCategory | null, arg2: bigint | null, arg3: bigint | null, arg4: bigint | null, arg5: string | null, arg6: ItemCondition | null, arg7: ShippingCarrier | null, arg8: bigint, arg9: bigint, arg10: TradeToken | null)";

if (backend.includes(brokenSearchSig)) {
  backend = backend.replace(brokenSearchSig, fixedSearchSig);
  backend = backend.replace(
    /async searchListings\([\s\S]*?const tokenOpt = arg9 === null/g,
    (m) => m.replaceAll("arg9", "arg10"),
  );
  const brokenCall =
    "to_candid_opt_n241(this._uploadFile, this._downloadFile, arg1), to_candid_opt_n155(this._uploadFile, this._downloadFile, arg2), to_candid_opt_n155(this._uploadFile, this._downloadFile, arg3), to_candid_opt_n52(this._uploadFile, this._downloadFile, arg4), to_candid_opt_n242(this._uploadFile, this._downloadFile, arg5), to_candid_opt_n243(this._uploadFile, this._downloadFile, arg6), arg7, arg8, tokenOpt";
  const fixedCall =
    "to_candid_opt_n241(this._uploadFile, this._downloadFile, arg1), to_candid_opt_n155(this._uploadFile, this._downloadFile, arg2), to_candid_opt_n155(this._uploadFile, this._downloadFile, arg3), to_candid_opt_n155(this._uploadFile, this._downloadFile, arg4), to_candid_opt_n52(this._uploadFile, this._downloadFile, arg5), to_candid_opt_n242(this._uploadFile, this._downloadFile, arg6), to_candid_opt_n243(this._uploadFile, this._downloadFile, arg7), arg8, arg9, tokenOpt";
  if (backend.includes(brokenCall)) {
    backend = backend.replaceAll(brokenCall, fixedCall);
    changedAny = true;
    console.log("patched backend.ts searchListings impl");
  }
  write("backend.ts", backend);
}

// ── createListing / updateListing actor calls (categoryId candid) ──
backend = read("backend.ts");
const brokenCreateCall =
  "to_candid_ListingCategory_n43(this._uploadFile, this._downloadFile, arg2), arg3, to_candid_TradeToken_n5";
const fixedCreateCall =
  "to_candid_ListingCategory_n43(this._uploadFile, this._downloadFile, arg2), to_candid_opt_n155(this._uploadFile, this._downloadFile, arg3), arg4, to_candid_TradeToken_n5";
if (backend.includes(brokenCreateCall)) {
  backend = backend.replaceAll(brokenCreateCall, fixedCreateCall);
  changedAny = true;
  console.log("patched backend.ts createListing candid");
}
const brokenUpdateCall =
  "to_candid_ListingCategory_n43(this._uploadFile, this._downloadFile, arg3), arg4, to_candid_TradeToken_n5";
const fixedUpdateCall =
  "to_candid_ListingCategory_n43(this._uploadFile, this._downloadFile, arg3), to_candid_opt_n155(this._uploadFile, this._downloadFile, arg4), arg5, to_candid_TradeToken_n5";
if (backend.includes(brokenUpdateCall)) {
  backend = backend.replaceAll(brokenUpdateCall, fixedUpdateCall);
  changedAny = true;
  console.log("patched backend.ts updateListing candid");
}
write("backend.ts", backend);

// ── backend.did.js IDL ──
let did = read("declarations/backend.did.js");
const listingIdlBroken = "ListingCategory,\n        IDL.Nat,\n        TradeToken";
const listingIdlFixed = "ListingCategory,\n        IDL.Opt(IDL.Nat),\n        IDL.Nat,\n        TradeToken";
if (did.includes(listingIdlBroken)) {
  did = did.replaceAll(listingIdlBroken, listingIdlFixed);
  write("declarations/backend.did.js", did);
  changedAny = true;
  console.log("patched backend.did.js listing IDL");
}

if (!changedAny) console.log("patch-backend-bindings: already up to date");
