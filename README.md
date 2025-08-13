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
   
   **Note**: If this step fails with the error outlined below, please continue using the Local Managed Verifier Canister as detailed below.

8. Deploy the demo canister

   ```bash
   dfx deploy canister
   ```

9. Invoke the demo method to perform the HTTP outcall and on-chain verification

   ```bash
   dfx canister call canister canister_http
   ```

## (Optional) Deploy Local Verity TLS Verifier Canister

1. `dfx deploy local_verity_verifier`
2. Replace the `VERITY_VERIFIER_CANISTER` in [`canister/lib.rs`](./canister/lib.rs) with the Canister ID of the newly deployed Verifier Cansister
3. `dfx deploy canister`

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

### `dfx deps deploy` Failure

```
~/dev/ic-verity-demo main +3 !5 ?1 ❯ dfx deps deploy verity_verifier                                                                                                                                                               ✘ 255 09:08:13 AM
Error: Failed to create and install canister yf57k-fyaaa-aaaaj-azw2a-cai
Caused by: Failed to create canister yf57k-fyaaa-aaaaj-azw2a-cai
Caused by: Failed to read controllers of canister yf57k-fyaaa-aaaaj-azw2a-cai.
Caused by: The replica returned an HTTP Error: Http Error: status 400 Bad Request, content type "text/plain", content: Canister yf57k-fyaaa-aaaaj-azw2a-cai does not belong to any subnet.
```

As per Kappa AI via [Internet Computer Docs](https://internetcomputer.org/docs/):

```plaintext
The error you are seeing occurs because when you use `dfx deps deploy` to deploy a dependency with a mainnet canister ID (e.g., `yf57k-fyaaa-aaaaj-azw2a-cai`) to your local replica, the local replica does not recognize this canister ID as belonging to any subnet. By default, the local replica only knows about canisters it has created itself, and it manages its own canister ID space. Mainnet canister IDs are not automatically mapped to local subnets.

However, the new `dfx deps` workflow is designed to allow you to pull a mainnet canister (including its Wasm and Candid interface) and deploy it locally with the same canister ID, so you can test your code against a local instance that matches the mainnet interface and behavior. The process is as follows:

1. **Declare the dependency in your `dfx.json`** with `"type": "pull"` and the mainnet canister ID.
2. **Run `dfx deps pull`** to fetch the Wasm and Candid from the mainnet.
3. **Run `dfx deps init`** to set any required init arguments.
4. **Run `dfx deps deploy`** to deploy the dependency locally.

If you have successfully pulled and initialized the dependency, but get the "does not belong to any subnet" error on deploy, it usually means the local replica is not able to create a canister with the specified mainnet ID. This can happen if:

- The local replica is not configured to allow creation of canisters with arbitrary IDs.
- There is a mismatch between the canister ID space of the local replica and the mainnet.

**According to the official documentation,** `dfx deps deploy` should create the dependency in your local environment with the same mainnet canister ID, and then install the downloaded Wasm. If this fails, it may be due to a limitation or bug in your current version of `dfx`, or a misconfiguration in your local environment. The documentation does not specify additional steps if this error occurs, but the intended workflow is as described above [Using dfx deps to pull third-party canisters](https://internetcomputer.org/docs/building-apps/advanced/using-third-party-canisters#pulling-a-third-party-canister-into-your-project) [Blog: Introducing dfx deps!](https://internetcomputer.org/blog/features/dfx-deps#service-consumer).

**In summary:**  
- The error means your local replica cannot create a canister with the mainnet ID.
- The intended workflow is for `dfx deps deploy` to handle this, but it may not always work depending on your setup.
- If you continue to have issues, ensure you are using the latest version of `dfx`, and consider restarting your local replica or removing any stale state.

If the problem persists, the knowledge sources do not provide a direct solution for this specific error, and you may need to seek further support or check for updates to the `dfx` tool.
```