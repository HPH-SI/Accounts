const DEFAULT_URL = "https://hkjdqiuvltlidwtbghtx.supabase.co";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, OPTIONS" } };
  }
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method Not Allowed" });
  }
  const url = (process.env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, "");
  const key = (process.env.SUPABASE_ANON_KEY || "").trim();
  if (!key) {
    return json(200, { configured: false, supabaseUrl: url, supabaseAnonKey: null, message: "Set SUPABASE_ANON_KEY in Netlify environment (Functions scope)." });
  }
  return json(200, { configured: true, supabaseUrl: url, supabaseAnonKey: key });
};
