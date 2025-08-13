# Verity zkTLS Demo on the Internet Computer

This demo is based on a fork of [icp.ninja/editor?s=Pxl8V](https://icp.ninja/editor?s=Pxl8V).

This project demonstrates integrating Verity zkTLS proofs with an Internet Computer canister using a small Bun/Express service to fetch data and return a signed, redaction-capable proof. It also shows verifying that proof on-chain via the Verity Managed General Purpose TLS Verifier canister.

## Verity zkTLS

Read more: [https://docs.verity.usher.so/](https://docs.verity.usher.so/)

## Prerequisites

- Bun (>= 1.0.0)
- Node.js (for type defs during development)
- dfx (Internet Computer SDK)
- ngrok (IPv6-enabled tunnel for local development)

## Quick start

0. Copy environment template

   ```bash
   cp config.env.example .env
   ```

1. Start the Bun server (local off-chain service)

   ```bash
   bun install
   bun start
   ```

2. Start an ngrok tunnel to the Bun server

   ```bash
   ngrok http http://localhost:8080
   ```

3. Copy the HTTPS forwarding URL from ngrok and set it as the target your canister calls. In this repo, update `LOCAL_PROXY_URL` in [`canister/lib.rs`](./canister/lib.rs) to the ngrok URL, then rebuild/redeploy. If the ngrok URL changes, redeploy again.

4. Start a local IC node

   ```bash
   dfx start --background
   ```

5. Pull dependencies (Managed Verity TLS Verifier canister)

   ```bash
   dfx deps pull
   ```

6. Init Verity Verifier dependency

   ```bash
   dfx deps init verity_verifier
   ```

7. Deploy Verity Verifier dependency

   ```bash
   dfx deps deploy
   ```
   
   **Note**: If this step fails, please refer to the [Verity Managed Verifier](https://github.com/usherlabs/verity-dp/tree/main/ic/managed/verifier) to build and deploy it on your local IC node (which should be running via `dfx start`).

8. Deploy the demo canister

   ```bash
   dfx deploy canister
   ```

9. Invoke the demo method to perform the HTTP outcall and on-chain verification

   ```bash
   dfx canister call canister canister_http
   ```

## About the local service (merged from PROXY_README)

The local service is a lightweight Express app optimised for Bun. In this demo it fetches a random integer from `random.org` via Verity, redacts a response header, and returns:

```json
{
  "data": <number>,
  "proof": "<verity_proof_string>"
}
```

The canister then verifies the proof via the Managed Verity TLS Verifier canister (declared in `dfx.json` as a pull dependency) and asserts the returned data matches the verified body.

### Configuration

Environment variables are read from `.env`:

- `PORT` (default: 8080)
- Optional: `VERITY_API_KEY` for managed prover access when required

Example:

```bash
PORT=8080
# VERITY_API_KEY=your_key_if_applicable
```

Health and config endpoints are available at:

- `GET /health`
- `GET /config`

### Notes

- `dfx deps pull` ensures the Verity Managed General Purpose TLS Verifier canister (defined in `dfx.json`) is available locally before building/deploying.
- When tunnelling with ngrok, always use the HTTPS URL and remember to update `LOCAL_PROXY_URL` if the tunnel changes.
- If you encounter a candid extraction error during build, install `candid-extractor` and retry.
- `data: "Error: Server too busy right now, please back off\n",` may occur due to random.org rate limits conflicting with the MPC connection.