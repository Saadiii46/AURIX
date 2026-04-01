export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const API_BASE_URL = IS_PRODUCTION
  ? "https://aurix-api.vercel.app"
  : "http://localhost:3000";
