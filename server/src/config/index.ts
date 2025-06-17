import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'mafstat_default_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  dbUrl: process.env.DATABASE_URL,
  dbUrlUnpooled: process.env.DATABASE_URL_UNPOOLED,
};
