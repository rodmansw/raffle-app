// Environment Configuration for Raffle Admin App

export const ENV = {
  // API Configuration
  API_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/admin",
  ADMIN_EMAIL: process.env.EXPO_PUBLIC_ADMIN_EMAIL || "test@test.com",

  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};

// Helper function to get API URL
export const getApiUrl = (endpoint: string): string => {
  return `${ENV.API_URL}${endpoint}`;
};

// Helper function to get admin email
export const getAdminEmail = (): string => {
  return ENV.ADMIN_EMAIL;
};
