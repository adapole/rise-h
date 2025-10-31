### 🧠 Python Dependencies

For testing and script automation:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/contracts/templates/requirements.txt
```

Or optionally:

```bash
chmod +x setup_py_env.sh
./setup_py_env.sh
```

## Generate tests

1. End to End Test for Voting

```bash
python3 generate_end_to_end_test.py > ../test/EndToEndTest.sol
```

2. LibUint Test

```bash
python3 generate_end_to_end_test.py > ../test/LibUint1024Test.sol
```

3. Verify Ballot Test

```bash
python3 generate_end_to_end_test.py > ../test/VerifyBallotTest.sol
```

4. Verify Solution Test

```bash
python3 generate_end_to_end_test.py > ../test/VerifySolutionTest.sol
```

## Running Solidity Tests

```bash
yarn hardhat test solidity
```
