export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'alianza_jwt_secret_key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'alianza_jwt_refresh_secret_key',
  expiresIn: '1h',
  refreshExpiresIn: '30d',
  refreshExpiresInMs: 30 * 24 * 60 * 60 * 1000,
};
