import { Request, Response, NextFunction } from "express";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log("incoming", req.method, "at", req.path);
  next();
};
