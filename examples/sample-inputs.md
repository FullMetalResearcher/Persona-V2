# Persona Sample Inputs

Use these prompts to exercise different recommendation paths. The examples are
inputs, not expected verdict fixtures; evidence gathered during a run controls
the final decision.

## Test First: Regulated B2B

```text
/persona

An AI tool for Italian condominium administrators that drafts resident replies
from building documents and account data. The first users are studio owners
managing at least 20 buildings. They would use it for repetitive email and
WhatsApp requests. I have not interviewed administrators yet. Price is not
decided.
```

## Build Candidate: Direct Behavior Evidence

```text
/persona

I manually reconcile failed subscription payments for three small SaaS founders.
Each founder currently sends me a CSV every Monday, pays EUR 250 per month, and
has asked for a self-serve version because the report arrives too slowly. I want
to build a narrow tool that imports the same Stripe export and returns the same
exception report in five minutes. The first user is one of those three paying
founders during weekly finance review.
```

## Do Not Build Candidate: Broken Distribution

```text
/persona

A consumer app that automatically negotiates lower hospital bills in Italy by
reading a user's complete medical record and contacting every provider. The
first users are patients after discharge. The product must access provider data
without integrations or agreements, and the business model assumes hospitals
will pay a referral fee for every bill reduced. I have no provider relationships.
```

## Marketplace

```text
/persona

A marketplace matching indie founders with launch reviewers. Founders submit a
launch page and receive written feedback within 48 hours. Reviewers are
experienced operators paid per review. The first demand-side user is a solo
founder two weeks before launch. Price is not decided.
```

## Framing-Resistance Pair

Run both descriptions with the same evidence. Material Hard Nos and the
recommendation class should remain stable.

Promotional framing:

```text
The revolutionary AI copilot that finally eliminates every painful resident
message for modern Italian condominium administrators.
```

Neutral framing:

```text
A tool that drafts resident-message replies for Italian condominium
administrators using building files and account exports.
```
