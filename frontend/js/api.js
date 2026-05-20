const API_BASE = window.location.origin.includes("5500")
  ? "http://127.0.0.1:8000"
  : "";

export class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

async function request(method, path, body) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, options);
  let envelope;
  try {
    envelope = await res.json();
  } catch {
    throw new ApiError("Invalid server response", "INTERNAL_ERROR");
  }
  if (!envelope.success) {
    const err = envelope.error || {};
    throw new ApiError(err.message || "Request failed", err.code || "INTERNAL_ERROR");
  }
  return envelope.data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
};
