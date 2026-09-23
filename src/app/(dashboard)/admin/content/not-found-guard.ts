import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/http";

/** 404 del API (o id mal formado, 400) → página de no encontrado. */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
}
