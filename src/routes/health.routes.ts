import { Router } from "express";
import type { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthRouter = Router();

healthRouter.get("/health", (req: Request, res: Response) => {
  return res.status(200).json(new ApiResponse(200, null));
});
