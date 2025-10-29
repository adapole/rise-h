# Contracts

| Folder                               | Purpose                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **base/**                            | Core Semaphore primitives (Verifier, Groups, constants). These are low-level building blocks.                                  |
| **interfaces/**                      | Interface definitions (used by both internal and external contracts).                                                          |
| **lib/**                             | Pure math / cryptography libraries (Poseidon, big-int math, prime ops).                                                        |
| **voting/**                          | All voting-related logic (Cicada vote mechanics, Semaphore wrapper, mint controller). Keeps that entire domain self-contained. |
| **tokens/**                          | ERC-20/721 logic + minting/management contracts.                                                                               |
| Root contracts (e.g `Semaphore.sol`) | key entry-point or aggregator contracts here for convenience.                                                                  |

# Cicada: homomorphic time-lock puzzle with an anonymous voter eligibility

A private voting that works for less than 2^32, or about 4.3 million votes at a time. Which is far higher considering that Rise is built for interbank settlement.

And it doesn't have Tallying authoritie, which makes it fit perfectly for a Consortium of banks/fintechs.
