# Cicada

[Cicada](https://a16zcrypto.com/posts/article/building-cicada-private-on-chain-voting-using-time-lock-puzzles/) is a private on-chain voting protocol based on [homomorphic time-lock puzzles](https://eprint.iacr.org/2019/635.pdf).

## How it works

At a high-level, our implementation adapts the linearly-homomorphic time-lock puzzle scheme described in ([Malavolta and Thyagarajan, 2019](https://eprint.iacr.org/2019/635.pdf)), using exponential ElGamal instead of Paillier encryption.

Throughout the following descriptions, we take $\mathbb{Z}_N^* %$ to mean $\mathbb{Z}_N^* / \{\pm 1\}$, and we take $x \mod{N}$ to mean $\min\left(x \mod N, -x \mod N\right)$ –– see `LibUint1024.normalize`. We use $\mathbb{Z}_N^* / \{\pm 1\}$ to ensure the low-order assumption is not trivially false, as suggested in [Section 6](http://crypto.stanford.edu/~dabo/papers/VDFsurvey.pdf).

### Homomorphic time-lock puzzles

A [time-lock puzzle](https://people.csail.mit.edu/rivest/pubs/RSW96.pdf) is a cryptographic puzzle that encapsulates some secret which can be recovered by performing $\mathcal{T}$ steps of (non-parallelizable) computation.

Time-lock puzzles are useful for voting schemes because they allow users to post their votes as a puzzle, ensuring it can eventually be revealed while keeping it secret during the election, a property called _running-tally privacy_. The goal is that users can cast votes without being influenced by other votes already cast. Time-lock puzzles are rather unique in the field of private voting schemes in that they achieve running-tally privacy without relying on tallying authorities, threshold encryption or any other trusted parties: anybody can solve a time-lock puzzle to ensure votes are revealed after the election.

A [homomorphic time-lock puzzle](https://eprint.iacr.org/2019/635.pdf) is one which can be homomorphically manipulated without knowing the solution or backdoor. In particular, a linearly homomorphic time-lock puzzle allows one to add two puzzles, producing a new puzzle which encapsulates the sum of the the original two puzzles, or perform scalar multiplications on puzzles.

As the authors of the paper note, linearly homomorphic time-lock puzzles are particularly suitable primitive for private voting: ballots can be encoded as puzzles, and they can be homomorphically combined to obtain a puzzle encoding the final tally. This allows a single computation to recover the final tally, rather than solving a unique puzzle for every vote.

### Exponential ElGamal

In the original HTLP paper, the linearly-homomorphic scheme is presented using Paillier encryption for the time-lock puzzle:

$$u := g^r \mod{N}$$

$$v := h^{r \cdot N} \cdot (1 + N)^s \mod{N^2}$$

The structure of the Paillier cryptosystem provides additive homomorphism and fast decoding of the secret $s$ once the $\mathcal{T}$ sequential squarings have been computed. However, ballot verification requires large exponentiations modulo $N^2$, which are prohibitively expensive (millions of gas) on most EVM chains.

Instead, we use [exponential ElGamal](https://crypto.stackexchange.com/a/3630), as follows:

$$u := g^r \mod{N}$$

$$v := h^{r} \cdot y^s \mod{N}$$

Exponential ElGamal provides additive homomorphism, but decoding the final tally requires brute-forcing the discrete log of $v \cdot h^{-r}$ base $y$. As such, it is only suitable if the expected final tally is reasonably small (e.g. $< 2^{32}$). Of course, this brute-force can be performed offline and the answer provided as a hint which is efficiently verified on-chain.

### Public parameters

To instantiate an election, the following parameters are required:

- An RSA modulus $N$ (e.g. 1024-4096 bits). This could be a standard modulus, or one generated via multi-party computation. If someone knows the factorization of $N$, they would be able to quickly decrypt all ballots, undermining running-tally privacy. Future implementations could utilize class groups, removing the risk of this trapdoor. Our default implementation uses a 1024-bit modulus for efficiency. Note that, while this is well above the largest RSA modulus ever publicly factored (which was [829 bits](https://listserv.nodak.edu/cgi-bin/wa.exe?A2=NMBRTHRY;dc42ccd1.2002)) it is below the normally recommended size of 2048 bits for use with RSA encryption or signatures. However, we don't need long-term security in our application. Once an election is finished there is no risk if $N$ is factored in the future. Thus it is reasonable to use a relatively small modulus; this can be easily updated in the future if factoring algorithms improve.
- A "time" parameter $\mathcal{T}$, the number of sequential squarings required to reveal the contents of the time-lock puzzle. This parameter must be carefully chosen to ensure an adversary (potentially with hardware acceleration) can't decrypt votes during the ballot-casting period.
- Two randomly chosen generators $g$ and $y$ of $\mathbb{Z}_N^*$ with Jacobi symbol 1, and the precomputed value $h := g^{2^\mathcal{T}} \mod{N}$. It is possible to efficiently prove that $h$ was generated correctly using a [Wesolowski proof](https://eprint.iacr.org/2018/623.pdf) or [Pietrzak proof](https://eprint.iacr.org/2018/627.pdf).

In the `_createVote` function, the time-lock puzzle associated with the vote's running tally is initialized to a value encoding 0. This could be done by setting both $u$ and $v$ to 1, but we instead initialize them to $g$ and $h$, respectively, so that all eight storage slots are populated (saving gas for the first ballot cast).

$$\text{tally}_\text{ct}.u := g^1 = g \mod{N}$$

$$\text{tally}_\text{ct}.v := h^1 \cdot y^0 = h \mod{N}$$

Together, $N, \mathcal{T}, g, h, y,$ and $y^{-1}$ comprise the **public parameters** of the vote, denoted `pp` in the smart contract. Note that $y^{-1}$ is included for efficiency (i.e. avoiding the need to compute a modular inverse on-chain).

### Casting a ballot

The `_createVote` function takes the following parameters:

- `string description` (A human-readable description of the vote)
- `uint64 startTime` (When the voting period starts, as a Unix timestamp)
- `uint64 votingPeriod` (The length of the voting period, in seconds)

To cast a ballot, the voter provides a homomorphic time-lock puzzle encoding their choice (0 representing "no", 1 representing "yes"), and a zero-knowledge proof that the provided puzzle is a valid ballot.

Proving that the ballot is a valid is equivalent to the disjunction of two $\Sigma$-protocols of discrete-log equality, i.e. there exists some value $r$ such that:

$$(u = g^r \texttt{ AND } v = h^r) \texttt{ OR } (u = g^r \texttt{ AND } v \cdot y^{-1} = h^r)$$

where the former case represents a "no" ballot and the
latter case represents a "yes" ballot. [Protocol 1](https://medium.com/@loveshharchandani/zero-knowledge-proofs-with-sigma-protocols-91e94858a1fb) describes the $\Sigma$-protocol for proving discrete-log equality, and [Section 4](https://www.cs.au.dk/~ivan/Sigma.pdf) describes the standard construction for $\texttt{OR}$-composition of $\Sigma$-protocols.

A proof of ballot validity consists of eight values: $(a_0, b_0, t_0, c_0, a_1, b_1, t_1, c_1)$. Given a ballot puzzle $(u,v)$ and its proof of validity, the contract performs the $\Sigma$-protocol verification as follows:

$$c := \text{hash}(a_0, b_0, a_1, b_1, pp)$$

$$c_0 + c_1 \stackrel{?}{=} c \mod{2^{256}}$$

$$g^{t_0} \stackrel{?}{=} a_0 \cdot u^{c_0} \mod{N}$$

$$h^{t_0} \stackrel{?}{=} b_0 \cdot v^{c_0} \mod{N}$$

$$g^{t_1} \stackrel{?}{=} a_1 \cdot u^{c_1} \mod{N}$$

$$h^{t_1} \stackrel{?}{=} b_1 \cdot (v \cdot y^{-1})^{c_1} \mod{N}$$

Note that the protocol is made non-interactive using the Fiat-Shamir heuristic (the challenge $c$ is computed as the hash of the prover's first message).

If the proof of validity is successfully verified, the running tally is updated, leveraging the additive homomorphism of the time-lock puzzles:

$$\text{tally}_\text{ct}.u = \text{tally}\_\text{ct}.u \cdot Z.u \mod{N}$$

$$\text{tally}_\text{ct}.v = \text{tally}\_\text{ct}.v \cdot Z.v \mod{N}$$

### Finalizing a vote

To finalize the result of a vote, someone needs to

1. perform the sequential squarings: $w := u^{2^T}$,
2. brute-force the discrete-log to recover the tally value: $\text{tally}_\text{pt} := \text{dlog}_y(v \cdot w^{-1})$, and
3. call the `_finalizeVote` function with the solution and associated proof of exponentiation.

For the proof of exponentiation, we will need a 256-bit prime. To make finalization non-interactive, we use the Fiat-Shamir heuristic. –– the prime must be a valid hash-to-prime output, as follows:

$$\text{hash}(\text{tally}_\text{ct}.u, w, pp, j)\mathbin{|}2^{255} \stackrel{?}{=} \ell$$

$$\text{Baillie-PSW}(\ell)  \stackrel{?}{=} \text{true}$$

The primality test is instantiated using [Baillie-PSW](https://en.wikipedia.org/wiki/Baillie%E2%80%93PSW_primality_test), but can be replaced with another probabilistic primality test (or e.g. [Pocklington primality certificates](https://en.wikipedia.org/wiki/Primality_certificate#Pocklington_Based_Certificates)).

The contract then verifies the [Wesolowski](https://eprint.iacr.org/2018/623.pdf) proof of exponentiation as follows:

$$r := 2^\mathcal{T} \mod{\ell}$$

$$w \stackrel{?}{=} \pi^\ell \cdot u^r \mod{N}$$

Finally, the contract checks that the relation between $v, w,$ and the plaintext tally value (denoted $\text{tally}_\text{pt}$) holds:

$$v \stackrel{?}{=} w \cdot y^{\text{tally}_\text{pt}} \mod{N}$$

If all the checks pass, the vote is marked as finalized.

### Anonymity via ZK set membership

The construction described above provides tally privacy –– the time-lock puzzle property keeps the tally private for the time paramter $\mathcal{T}$.
However, each individual ballot is also a time-lock puzzle, encrypted under the same public parameters.
This means that just as the tally can be decrypted (by sequential squaring and brute-forcing the secret), so can each individual ballot.

For Consortium members **vote on Peg updates** this is not enough; while we are satisfied with _temporary_ tally privacy, we want _indefinite_ ballot privacy.
To accomplish this, we can combine the homomorphic time-lock puzzle scheme with an anonymous voter eligibility protocol, instantiated by zero-knowledge set membership proofs.
This way, even if a ballot is decrypted, all it would reveal is that _someone/somebank_ voted that way –– which is already known from the tally.

We provide an example contract using [Semaphore](https://semaphore.appliedzkp.org/) for anonymity.

## Integration with Rise
