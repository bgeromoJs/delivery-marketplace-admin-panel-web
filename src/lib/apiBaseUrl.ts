// Browser requests should target the API Gateway, never an individual service.
// In local development the gateway listens on port 8080.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
