# `posql_db`

Example demonstrating an implementation of a simple csv-backed database with Proof of SQL capabilities.

## Install

Run `cargo install --example posql_db --path crates/proof-of-sql` to install the example.

> [!NOTE]
> To run this example without the `blitzar` (i.e CPU only )feature
>
> ```bash
> cargo install --example posql_db --path crates/proof-of-sql --no-default-features --features="cpu-perf"
> ```

## Quick Start Example

Run the following

```bash
posql_db create -t sxt.table -c a,b -d BIGINT,VARCHAR
posql_db append -t sxt.table -f hello_world.csv
posql_db prove -q "SELECT b FROM sxt.table WHERE a = 2" -f hello.proof
posql_db verify -q "SELECT b FROM sxt.table WHERE a = 2" -f hello.proof
```

### Total withdrawals from one Bank

```sql
SELECT SUM(amount_usd) AS total_withdrawn
FROM bank_ledger
WHERE account_id = 'A001' AND tx_type = 'WITHDRAW';
```

### Total USD removed within a Period

```sql
SELECT SUM(amount_usd) AS total_removed
FROM bank_ledger
WHERE tx_type IN ('WITHDRAW', 'TRANSFER_OUT')
  AND timestamp BETWEEN 1717286400 AND 1717459200;
```
