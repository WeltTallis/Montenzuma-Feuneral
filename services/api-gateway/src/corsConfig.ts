// Enhanced version that reads from environment variables
const getEnvironmentOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim());
  }
  return [];
};

const defaultOrigins: string[] = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'www.restpoint.co.ke',
  'https://restpoint.co.ke',
  'https://paymontenzuma.restpoint.co.ke',
  ...getEnvironmentOrigins(),
];

// Production-specific origins
if (process.env.NODE_ENV === 'production') {
  // Add production-specific origins
  defaultOrigins.push(
    'https://restpoint.co.ke'
  );
}

// Development-specific origins
if (process.env.NODE_ENV === 'development') {

}
