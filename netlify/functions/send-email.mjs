const RESEND_URL = "https://api.resend.com/emails";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" } };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { message: "Method Not Allowed" });
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return json(500, { message: "Server email is not configured. Set RESEND_API_KEY in Netlify site environment variables." });
  }
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { message: "Invalid JSON body" });
  }
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Resend returned a non-JSON response" };
  }
  if (!res.ok) {
    const msg = data.message || data.name || `Resend error (${res.status})`;
    return json(res.status >= 500 ? res.status : 400, { message: msg, ...data });
  }
  return json(200, data);
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(body),
  };
}
