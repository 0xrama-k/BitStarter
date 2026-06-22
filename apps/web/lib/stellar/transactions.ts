export type TransactionResult = {
  hash: string;
};

export async function waitForTransaction(hash: string): Promise<TransactionResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { hash };
}
