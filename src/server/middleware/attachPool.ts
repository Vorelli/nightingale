import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { NodePgDatabase } from "drizzle-orm/node-postgres/driver.js";

export const attachPgPool = function (pool: Pool, db: NodePgDatabase) {
  const attach = (req: Request, res: Response, next: NextFunction) => {
    res.locals.pool = pool;
    res.locals.db = db;
    next();
  };

  return attach;
};
