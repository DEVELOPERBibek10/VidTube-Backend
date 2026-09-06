import mongoose, { startSession } from "mongoose";
import {
  MongoErrorLabel,
  MongoServerError,
  type TransactionOptions,
} from "mongodb";

export async function executeTransaction<T>(
  transactionFn: (session: mongoose.ClientSession) => Promise<T>,
  options?: {
    maxRetry?: number;
    retryDelay?: number;
    transactionOptions?: TransactionOptions;
  }
) {
  const {
    maxRetry = 3,
    retryDelay = 1000,
    transactionOptions = {},
  } = options || {};

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    const session = await startSession();
    try {
      const result = await session.withTransaction(
        () => transactionFn(session),
        {
          readPreference: "primary",
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          ...transactionOptions,
        }
      );
      return result;
    } catch (error) {
      lastError = error;
      if (error instanceof MongoServerError && isRetryableError(error)) {
        console.log(`Transaction attempt ${attempt} failed, retrying...`);
        await delay(retryDelay * attempt);
        continue;
      }
      throw error;
    } finally {
      await session.endSession();
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
