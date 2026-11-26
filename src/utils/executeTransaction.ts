import mongoose from "mongoose";
import { MongoErrorLabel, MongoServerError } from "mongodb";

export async function executeTransaction<T>(
  transactionFn: (session: mongoose.ClientSession) => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
  }
) {
  const { maxRetries = 3, retryDelay = 1000 } = options || {};

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await mongoose.connection.transaction(
        (session) => transactionFn(session),
        {
          readPreference: "primary",
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
        }
      );
      return result;
    } catch (error: unknown) {
      lastError = error;
      if (
        error instanceof MongoServerError &&
        isRetryableError(error) &&
        attempt < maxRetries
      ) {
        console.error(
          `Transaction attempt ${attempt} failed, reason: ${error.message}, Retrying...`
        );
        await delay(retryDelay * attempt);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function isRetryableError(error: MongoServerError): boolean {
  if (error.hasErrorLabel(MongoErrorLabel.TransientTransactionError)) {
    return true;
  }

  const retryableCodes = [
    112, // WriteConflict
    251, // TransactionAborted
    11600, // InterruptedAtShutdown
    11602, // InterruptedDueToReplStateChange
  ];
  return retryableCodes.includes(Number(error.code));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
