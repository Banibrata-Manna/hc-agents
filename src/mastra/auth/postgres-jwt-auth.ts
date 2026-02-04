import { MastraJwtAuth } from '@mastra/auth';
import { PostgresStore } from '@mastra/pg';
import type { JwtPayload } from 'jsonwebtoken';
import type { MastraAuthProviderOptions } from '@mastra/core/server';

// Extend the base options to include standard auth provider options (like public/protected)
interface PostgresJwtAuthOptions extends MastraAuthProviderOptions<JwtPayload> {
  connectionString: string;
  jwtSecret?: string;
  schemaName?: string
  store: PostgresStore
}

export class PostgresJwtAuth extends MastraJwtAuth {
  store: PostgresStore;

  constructor(options: PostgresJwtAuthOptions) {
    super({
      name: 'postgres-jwt',
      secret: options.jwtSecret,
      // Pass through the public/protected options to the base class
      public: options.public,
      protected: options.protected,
    });

    this.store = options.store
  }

  async authenticateToken(token: string): Promise<JwtPayload & { maargOmsToken: string, apiKey: string }> {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    const payload = await super.authenticateToken(token);
    return { ...payload, maargOmsToken: token, apiKey: token } ;
  }

  async authorizeUser(user: JwtPayload) {
    if (!user || typeof user === 'string') {
      return false;
    }

    const { userLoginId, iss } = user;

    const normalizedSchemaName = iss.replace(/-/g, '_');

    const verifySchemaQuery = `
      SELECT 1
        FROM information_schema.schemata
        WHERE schema_name = $1;
    `;

    const schemaResult = await this.store.db.oneOrNone(verifySchemaQuery, [normalizedSchemaName]);

    if (!iss || normalizedSchemaName !== process.env.DATABASE_SCHEMA || !schemaResult) {
      throw `Invalid issuer ${iss}`
    }

    if (!userLoginId) {
      console.warn('JWT token missing userLoginId claim');
      return false;
    }

    try {
      const findUserQuery = `
        SELECT 1 
        FROM ${process.env.DATABASE_SCHEMA}.users 
        WHERE user_login_id = $1
      `;
      
      const result = await this.store.db.oneOrNone(findUserQuery, [userLoginId]);

      if (result) {
        return true;
      }

      console.warn(`User with loginId ${userLoginId} not found in database, syncing new user`);

      const insertQuery = `
        INSERT INTO ${process.env.DATABASE_SCHEMA}.users ("user_login_id")
        VALUES ($1);
      `;

      const userCreateResult = await this.store.db.tx(async (t) => {
        await t.none(insertQuery, [userLoginId]);
        return await t.any(findUserQuery, [userLoginId]);
      });

      if (!userCreateResult) {
        throw 'Failed to sync user in Database.'
      }

      return true;
    } catch (error) {
      console.error('Error verifying user in Postgres:', error);
      return false;
    }
  }
}
