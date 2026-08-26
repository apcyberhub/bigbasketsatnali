import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  meta?: any
): Response {
  const responseBody: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  if (meta) {
    responseBody.meta = meta;
  }
  return res.status(statusCode).json(responseBody);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors: any[] = []
): Response {
  const responseBody: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(responseBody);
}
