use ic_cdk::management_canister::http_request as canister_http_outcall;
use ic_cdk::management_canister::HttpRequestArgs;
use ic_cdk::management_canister::HttpMethod;
use ic_cdk::management_canister::HttpRequestResult;
use serde::Deserialize;
use candid::Principal;
use candid::CandidType;
// use verity_ic::verify::types::ProofResponse;

// const VERITY_VERIFIER_CANISTER: &str = "yf57k-fyaaa-aaaaj-azw2a-cai";
const VERITY_VERIFIER_CANISTER: &str = "uxrrr-q7777-77774-qaaaq-cai"; /// ! Insert your local Verity Verifier Canister ID here
const VERITY_NOTARY_PUB_KEY: &str = "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9MsHbWBopn6RcLJU2g0cHtet6eJ5\nqWpNlRkhyuk6etCycIUYe7iv/khvHfOTOTwG8yfzGdQMJz9kehb7MUzCRg==\n-----END PUBLIC KEY-----";
// const LOCAL_PROXY_URL: &str = "http://localhost:8080";
const LOCAL_PROXY_URL: &str = "https://rnaew-58-111-92-108.a.free.pinggy.link"; ///! Insert your ngrok or pinggy link here...

#[derive(Deserialize)]
struct VerityResponse {
    data: u64,
    proof: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
enum ProofResponse {
    SessionProof(String),
    FullProof(String),
}


fn get_http_response_body(text: String) -> String {
    // Support both CRLF and LF header/body separators, and fall back sensibly
    let sep_pos = text
        .rfind("\r\n\r\n").map(|p| p + 4)
        .or_else(|| text.rfind("\n\n").map(|p| p + 2));

    let mut body = match sep_pos {
        Some(idx) => text[idx..].to_string(),
        None => text.clone(),
    };

    let trimmed = body.trim();
    if trimmed.is_empty() {
        // Fall back to the whole text trimmed if post-separator content is empty
        body = text.trim().to_string();
    } else {
        body = trimmed.to_string();
    }

    // If JSON appears embedded, extract the outermost object
    if let (Some(start), Some(end)) = (body.find('{'), body.rfind('}')) {
        if start < end {
            return body[start..=end].to_string();
        }
    }

    body
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[ic_cdk::update]
async fn canister_http() -> Result<HttpRequestResult, String> {
    let arg: HttpRequestArgs = HttpRequestArgs {
        // TOOD: Change to deployed serverless function URL in production.
        url: LOCAL_PROXY_URL.to_string(),
        max_response_bytes: None,
        method: HttpMethod::GET,
        headers: vec![],
        body: None,
        transform: None,
        is_replicated: Some(false),
    };

    let result = canister_http_outcall(&arg).await.map_err(|e| e.to_string())?;

    // Parse the response body to extract proof and data
    let response_body = String::from_utf8(result.body.clone()).map_err(|e| format!("Failed to parse response body: {}", e))?;

    println!("Response body: {}", response_body);

    // Parse the JSON response from the Verity service
    let verity_response: VerityResponse = serde_json::from_str(&response_body)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    // Verify the proof
    // make a request to the managed verifier canister
    // to get a response which would contain the verified/decrypted proofs sent

    let stringified_proofs = vec![verity_response.proof];

    // make a request to the managed verifier canister
    // to get a response which would contain the verified/decrypted proofs sent
    let call_response = ic_cdk::call::Call::unbounded_wait(
        Principal::from_text(VERITY_VERIFIER_CANISTER).unwrap(),
        "verify_proof_async",
    ).with_args(
        &(&stringified_proofs, VERITY_NOTARY_PUB_KEY),
    )
    .with_cycles(100_000_000_000)
    .await
    .expect("Failed to verify proof");

    let p_response: Vec<ProofResponse> = call_response.candid().unwrap();

    if p_response.is_empty() {
        return Err("Verifier returned empty response".to_string());
    }

    let proof_text: &str = match &p_response[0] {
        ProofResponse::SessionProof(s) => s,
        ProofResponse::FullProof(s) => s,
    };

    let p_response_body = get_http_response_body(proof_text.to_string());

    // Try direct parse first, then fallback to extracting digits only
    let p_response_int = match p_response_body.trim().parse::<u64>() {
        Ok(v) => v,
        Err(_) => {
            let digits: String = p_response_body.chars().filter(|c| c.is_ascii_digit()).collect();
            if digits.is_empty() {
                return Err(format!(
                    "Unable to parse number from verifier response body: '{}'",
                    p_response_body
                ));
            }
            digits.parse::<u64>().map_err(|e| format!("Failed to parse digits to u64: {}", e))?
        }
    };

    println!("p_response_int: {}", p_response_int);
    println!("verity_response.data: {}", verity_response.data);

    // Verify that the response data matches the verified data
    assert!(verity_response.data == p_response_int, "Response mismatch");

    Ok(HttpRequestResult {
        status: result.status,
        body: verity_response.data.to_le_bytes().to_vec(),
        headers: result.headers,
    })
}


// Export the interface for the smart contract.
ic_cdk::export_candid!();
