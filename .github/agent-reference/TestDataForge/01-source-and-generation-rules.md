## 🔑 PRIMARY DIRECTIVE — SOURCE DATA WINS

The shared source payload (the contract circulated by the business, e.g. `./input/{BASE_NAME}-SourcePayload.json`) is the **primary source for all vehicle and finance attributes**.

When `./input/{BASE_NAME}-PayloadSchema.json` also exists, it is the **authoritative constraint reference** and outranks anything inferred from the sample payload. Take field types, enums, formats and limits from it. Its `x-businessRules` entries marked `"boundary": true` are the ONLY grounded numeric limits for the epic — generate boundary fixtures against those and no others, and never invent a threshold the schema does not carry. Respect `x-openList: true` (non-exhaustive, so an unlisted value is not automatically invalid), carry `x-conflict` / `unresolved: true` values verbatim without picking a side, and never treat an `x-constraintSource: "derived"` rule as a stated requirement.

| Situation | Action |
|---|---|
| `VIN` present in source | **USE AS-IS** — never regenerate, never "correct" its check digit, never reformat |
| `CapCode` present in source | **USE AS-IS** |
| `MBV` present in source | **USE AS-IS** |
| `Vehicle Registration Number` present in source | **USE AS-IS** |
| Any of the above **missing** | **GENERATE** a valid UK-compliant value (rules below) |
| Any other attribute present in source | **USE AS-IS** |

- ❌ NEVER overwrite a supplied identifier, even if it does not match the generation rules. A supplied `ABCZZZ8V9JA123456` is used verbatim although `ABC` is not a VW-Group WMI — the business supplied it, so it is correct by definition.
- ✅ ALWAYS record, per identifier, whether the value came from source or was generated. This provenance is part of the deliverable and makes every dataset auditable.

---

## UK-Compliant Generation Rules (used ONLY for missing identifiers)

### VIN — 17 characters, ISO 3779

- Exactly 17 characters; letters `I`, `O` and `Q` are never valid
- Structure: positions 1-3 WMI · 4-8 VDS · 9 check digit · 10 model-year code · 11 assembly plant · 12-17 serial
- Check digit at position 9 is **computed**, not random: transliterate, weight by `[8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2]`, sum, mod 11, with `10 → X`
- WMI by manufacturer: `WVW` VW Passenger · `WVG` VW SUV/MPV · `WAU` Audi · `TMB` Skoda · `VSS` SEAT/CUPRA · `WV1` VW Commercial
- Model-year codes: `M`=2021 · `N`=2022 · `P`=2023 · `R`=2024 · `S`=2025 · `T`=2026
- The WMI must agree with `vehicle.manufacturer`, and the year code with `vehicle.year`, whenever those fields are present

### Vehicle Registration Number — DVLA current format

- `AA00AAA`: 2-letter local memory tag + 2-digit age identifier + 3-letter random sequence
- Age identifier: `YY` for March-August issues, `YY + 50` for September-February issues
- `I` and `Q` are excluded from the random sequence

### CapCode

- Written rule: 7-10 digit numeric, consistent across Make / Model / Derivative / Fuel / Transmission / Registration Year
- The same vehicle derivative must always yield the same CapCode within a dataset
- ⚠️ **UNRESOLVED CONFLICT — do not silently pick one**: the written rule says *"7-10 digit numeric"*, but the circulated samples (`ABC115XYZ5JKPY  2`) are alphanumeric, ~14 characters, and contain a double space. The generator exposes `--capcode-style numeric|alphanumeric` and defaults to `numeric` (the written rule). Escalate to the business before relying on generated CapCodes; a supplied CapCode is always used as-is and is unaffected by this conflict.

### MBV

- Alphanumeric, 6-15 characters (e.g. `MBV001245`, `ABCDGTI25A`, `AUDA42024S`)
- Unique per derivative/build combination

### productId

- ⚠️ **UNRESOLVED CONFLICT**: the payload annotation says *"6 digit numbers length"*, but the supplied sample is `FIN12345` (8 characters, alphanumeric). Use the supplied value as-is. Do NOT generate a `productId` from either interpretation until the business confirms which is authoritative; log it as a data gap instead.

---

