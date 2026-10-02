## Approach

1. **Locate the source payload** at the given `INPUT_PATH`. It may be annotated JSONC (`//` and `/* */` comments) — strip comments before parsing, never reject it as malformed.
2. **Resolve identifiers**: for `VIN`, `CapCode`, `MBV` and `Vehicle Registration Number`, reuse the source value when present; generate only when absent.
3. **Apply cross-field consistency**: `New` implies `mileage = 0` and `registrationDate = today`; `Used` keeps the supplied first-registration date and actual mileage.
4. **Compute grounded limits** from the dataset's own `priceTotal` and the stated caps.
5. **Emit fixtures**: one valid baseline, boundary pairs for every stated limit, negative cases per validation rule, the 7 VIN classes (valid, missing, too short, too long, invalid characters, bad check digit, duplicate pair).
6. **Record provenance** for every identifier in `_meta`.
7. **Report** unresolved conflicts (CapCode format, productId format) as data gaps rather than guessing.

## Fixture Naming

`validFinanceCalculationRequest` · `boundary_<field>At{Min,Max}` · `boundary_<field>{Above,Below}{Max,Min}` · `negative_<condition>` · `duplicate_<condition>{First,Second}`

Names must be stable across runs so builders and step definitions can reference them by key.

## Constraints

- **SOURCE DATA IS IMMUTABLE**: never alter, reformat or "correct" a supplied value
- **NO UNGROUNDED LIMITS**: emit a boundary fixture ONLY for a limit explicitly stated in the source payload contract or the requirement analysis. Never invent a cap for `annualMileage`, `customerRate`, `settlementAmount` or `outlet.code` — none is stated. Log them as gaps instead
- **NO FABRICATED CREDENTIALS**: never generate an API key, token, password or base URL. Those are configuration, not test data
- **DETERMINISM**: identical seed + identical source ⇒ identical output
- **FLOW ISOLATION**: read ONLY the `INPUT_PATH` files for the CURRENT flow. Never reuse another epic's/BRD's source payload or test data
- **TIER 1 RESPECT**: never silently overwrite `Input/TestData.json`; never touch `appsettings.json`
- **TOKEN MINIMIZATION**: output the single JSON deliverable. No README, no data dictionary, no summary markdown
- **ESCALATE CONFLICTS**: where the annotation and the sample disagree (CapCode, productId), report both readings and STOP generating for that field — do not pick one silently

## Quality Standards

- Every supplied identifier appears in the output byte-identical to the source
- Every generated VIN is exactly 17 characters, free of `I`/`O`/`Q`, and carries a correct position-9 check digit
- Every generated registration matches the DVLA `AA00AAA` pattern
- Every boundary fixture cites the stated limit it exercises, computed from the dataset's own values
- Every fixture is independently loadable and complete — no partial payloads except where absence is the condition under test
- `_meta.identifierProvenance` states `source (used as-is)` or `generated (UK-compliant)` for all four identifier types
