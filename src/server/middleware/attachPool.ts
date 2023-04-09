import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";

export const attachPool = function (pool: Pool) {
  const attach = (req: Request, res: Response, next: NextFunction) => {
    res.locals.pool = pool;
    next();
  };

  return attach;
};
