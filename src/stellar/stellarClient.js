/**
 * Stellar Client - Utilities for interacting with Stellar Testnet
 * 
 * This module provides functions to:
 * - Connect to Stellar Testnet via Horizon API
 * - Fetch account balances
 * - Build and submit payment transactions
 * - Integrate with Freighter wallet for signing
 */

import * as StellarSdk from "@stellar/stellar-sdk";

// Stellar Testnet Horizon server URL
// Horizon is the API gateway to the Stellar network
const HORIZON_URL = "https://horizon-testnet.stellar.org";

// Network passphrase identifies which Stellar network we're using
// This prevents transactions from being replayed on other networks
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Create a Horizon server instance for making API calls
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Fetches the XLM balance for a given Stellar account
 * 
 * @param {string} publicKey - The Stellar public key (starts with 'G')
 * @returns {Promise<string>} - The XLM balance as a string
 * @throws {Error} - If account not found or network error
 */
export async function getBalance(publicKey) {
  try {
    // Load the account from Horizon
    // This returns account details including all asset balances
    const account = await server.loadAccount(publicKey);
    
    // Find the native XLM balance
    // Stellar accounts can hold multiple assets, but XLM is the native asset
    const nativeBalance = account.balances.find(
      (balance) => balance.asset_type === "native"
    );
    
    // Return the balance, or "0" if somehow not found
    return nativeBalance ? nativeBalance.balance : "0";
  } catch (error) {
    // Handle specific Stellar errors
    if (error.response && error.response.status === 404) {
      throw new Error("Account not found. Make sure the account is funded on testnet.");
    }
    throw error;
  }
}

/**
 * Builds a payment transaction for sending XLM
 * 
 * @param {string} sourcePublicKey - Sender's public key
 * @param {string} destinationPublicKey - Recipient's public key
 * @param {string} amount - Amount of XLM to send
 * @returns {Promise<string>} - The transaction XDR (base64 encoded transaction)
 */
export async function buildPaymentTransaction(sourcePublicKey, destinationPublicKey, amount) {
  try {
    // Validate destination address format
    // Stellar public keys are 56 characters starting with 'G'
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(destinationPublicKey)) {
      throw new Error("Invalid destination address format");
    }
    
    // Validate amount is a positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Amount must be a positive number");
    }
    
    // Load the source account to get the current sequence number
    // Sequence numbers prevent transaction replay attacks
    const sourceAccount = await server.loadAccount(sourcePublicKey);
    
    // Check if destination account exists
    let destinationExists = true;
    try {
      await server.loadAccount(destinationPublicKey);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        destinationExists = false;
      } else {
        throw error;
      }
    }
    
    // Build the transaction
    const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      // Fee is in stroops (1 XLM = 10,000,000 stroops)
      // Base fee is typically 100 stroops
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    
    if (destinationExists) {
      // Standard payment operation for existing accounts
      transactionBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          // Asset.native() represents XLM
          asset: StellarSdk.Asset.native(),
          amount: amount,
        })
      );
    } else {
      // For new accounts, we need to use createAccount operation
      // This requires a minimum of 1 XLM to create the account
      if (numAmount < 1) {
        throw new Error("Minimum 1 XLM required to create a new account");
      }
      transactionBuilder.addOperation(
        StellarSdk.Operation.createAccount({
          destination: destinationPublicKey,
          startingBalance: amount,
        })
      );
    }
    
    // Set a timeout for the transaction (300 seconds = 5 minutes)
    // After this time, the transaction will be invalid
    const transaction = transactionBuilder.setTimeout(300).build();
    
    // Return the transaction as XDR (External Data Representation)
    // This is the format Freighter uses for signing
    return transaction.toXDR();
  } catch (error) {
    throw error;
  }
}

/**
 * Submits a signed transaction to the Stellar network
 * 
 * @param {string} signedXDR - The signed transaction XDR from Freighter
 * @returns {Promise<object>} - The transaction result from Horizon
 */
export async function submitTransaction(signedXDR) {
  try {
    // Reconstruct the transaction from the signed XDR
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXDR,
      NETWORK_PASSPHRASE
    );
    
    // Submit to the Stellar network via Horizon
    const result = await server.submitTransaction(transaction);
    
    return result;
  } catch (error) {
    // Parse Stellar-specific errors for better user feedback
    if (error.response && error.response.data && error.response.data.extras) {
      const extras = error.response.data.extras;
      const resultCodes = extras.result_codes;
      
      if (resultCodes.operations) {
        const opError = resultCodes.operations[0];
        switch (opError) {
          case "op_underfunded":
            throw new Error("Insufficient balance for this transaction");
          case "op_no_destination":
            throw new Error("Destination account does not exist");
          case "op_low_reserve":
            throw new Error("Transaction would leave account below minimum reserve");
          default:
            throw new Error(`Transaction failed: ${opError}`);
        }
      }
    }
    throw error;
  }
}

/**
 * Validates a Stellar public key format
 * 
 * @param {string} publicKey - The public key to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidPublicKey(publicKey) {
  return StellarSdk.StrKey.isValidEd25519PublicKey(publicKey);
}

/**
 * Gets the Stellar Explorer URL for a transaction
 * 
 * @param {string} hash - The transaction hash
 * @returns {string} - The explorer URL
 */
export function getExplorerUrl(hash) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

/**
 * Gets the Stellar Explorer URL for an account
 * 
 * @param {string} publicKey - The account public key
 * @returns {string} - The explorer URL
 */
export function getAccountExplorerUrl(publicKey) {
  return `https://stellar.expert/explorer/testnet/account/${publicKey}`;
}

/**
 * Fetches transaction history for an account
 * Returns payment and create_account operations (XLM transfers)
 * 
 * @param {string} publicKey - The account public key
 * @param {number} limit - Maximum number of transactions to fetch (default: 20)
 * @returns {Promise<Array>} - Array of transaction records
 */
export async function getTransactionHistory(publicKey, limit = 20) {
  try {
    // Fetch operations for the account
    // We filter for payment and create_account operations
    const operations = await server
      .operations()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .call();

    // Process and format the operations
    const transactions = await Promise.all(
      operations.records
        .filter((op) => {
          // Only include payment and create_account operations
          return op.type === "payment" || op.type === "create_account";
        })
        .map(async (op) => {
          // Determine if this was a sent or received transaction
          const isSent = op.source_account === publicKey;
          
          // Get the other party's address
          let otherParty;
          let amount;
          
          if (op.type === "payment") {
            otherParty = isSent ? op.to : op.from;
            amount = op.amount;
          } else if (op.type === "create_account") {
            otherParty = isSent ? op.account : op.source_account;
            amount = op.starting_balance;
          }

          // Fetch transaction details for timestamp and hash
          let txDetails = null;
          try {
            const response = await fetch(op._links.transaction.href);
            txDetails = await response.json();
          } catch (e) {
            console.error("Error fetching tx details:", e);
          }

          return {
            id: op.id,
            type: op.type,
            direction: isSent ? "sent" : "received",
            amount: amount,
            otherParty: otherParty,
            timestamp: txDetails?.created_at || op.created_at,
            hash: txDetails?.hash || null,
            successful: op.transaction_successful,
            memo: txDetails?.memo || null,
          };
        })
    );

    return transactions;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return []; // No transactions for this account
    }
    throw error;
  }
}

/**
 * Extracts unique addresses from transaction history
 * Useful for building an address book / suggestions
 * 
 * @param {Array} transactions - Array of transaction records
 * @param {string} ownAddress - The user's own address (to exclude)
 * @returns {Array} - Array of unique addresses with metadata
 */
export function getUniqueAddresses(transactions, ownAddress) {
  const addressMap = new Map();

  transactions.forEach((tx) => {
    if (tx.otherParty && tx.otherParty !== ownAddress) {
      const existing = addressMap.get(tx.otherParty);
      if (!existing || new Date(tx.timestamp) > new Date(existing.lastUsed)) {
        addressMap.set(tx.otherParty, {
          address: tx.otherParty,
          lastUsed: tx.timestamp,
          transactionCount: (existing?.transactionCount || 0) + 1,
        });
      } else {
        existing.transactionCount += 1;
      }
    }
  });

  // Sort by most recently used
  return Array.from(addressMap.values()).sort(
    (a, b) => new Date(b.lastUsed) - new Date(a.lastUsed)
  );
}

export { HORIZON_URL, NETWORK_PASSPHRASE, server };
