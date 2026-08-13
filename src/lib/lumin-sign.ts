export function isLuminSignConfigured() { return Boolean(process.env.LUMIN_API_KEY); }

type LuminSigner = { email: string; name: string };

export async function sendLuminSignatureRequest({ title, fileUrl, signers, expiresAt }: { title: string; fileUrl: string; signers: LuminSigner[]; expiresAt?: Date | null }) {
  if (!isLuminSignConfigured()) return { skipped: true as const, reason: "Lumin Sign n’est pas configuré" };
  if (!/^https:\/\//.test(fileUrl)) throw new Error("Le document doit être accessible à Lumin via une URL HTTPS.");
  const response = await fetch("https://api.luminpdf.com/v1/signature_request/send", {
    method: "POST",
    headers: { "X-API-Key": process.env.LUMIN_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ file_url: fileUrl, title, signers: signers.map((signer) => ({ email_address: signer.email, name: signer.name })), ...(expiresAt ? { expires_at: expiresAt.getTime() } : {}), signing_type: "SAME_TIME", use_text_tags: false }),
  });
  const payload = await response.json().catch(() => null) as { signature_request?: { signature_request_id?: string }; error_message?: string } | null;
  if (!response.ok || !payload?.signature_request?.signature_request_id) throw new Error(payload?.error_message || "Lumin Sign a refusé la demande de signature.");
  return { skipped: false as const, id: payload.signature_request.signature_request_id };
}
