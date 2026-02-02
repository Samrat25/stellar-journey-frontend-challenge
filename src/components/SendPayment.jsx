/**
 * SendPayment Component
 * 
 * Handles the XLM payment flow:
 * 1. User enters destination address and amount
 * 2. Transaction is built using stellar-sdk
 * 3. Transaction is signed via Freighter
 * 4. Transaction is submitted to Stellar Testnet
 * 5. User sees success/failure feedback with transaction hash
 */

import { useState, useEffect } from "react";
import { signTransaction } from "@stellar/freighter-api";
import {
  buildPaymentTransaction,
  submitTransaction,
  isValidPublicKey,
  getExplorerUrl,
  NETWORK_PASSPHRASE,
} from "@/stellar/stellarClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Send,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function SendPayment({ publicKey, onTransactionComplete, prefilledDestination }) {
  const [destination, setDestination] = useState(prefilledDestination || "");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState("input"); // input, signing, submitting

  // Update destination when prefilledDestination changes
  useEffect(() => {
    if (prefilledDestination) {
      setDestination(prefilledDestination);
    }
  }, [prefilledDestination]);

  /**
   * Validates the form inputs
   */
  const validateInputs = () => {
    // Check destination format
    if (!destination.trim()) {
      throw new Error("Destination address is required");
    }
    
    if (!isValidPublicKey(destination.trim())) {
      throw new Error("Invalid Stellar address format. Must start with 'G' and be 56 characters.");
    }

    // Check if sending to self
    if (destination.trim() === publicKey) {
      throw new Error("Cannot send to your own address");
    }

    // Check amount
    if (!amount.trim()) {
      throw new Error("Amount is required");
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Amount must be a positive number");
    }

    // Stellar has a minimum transaction amount
    if (numAmount < 0.0000001) {
      throw new Error("Amount is below minimum (0.0000001 XLM)");
    }

    return true;
  };

  /**
   * Handles the send payment flow
   */
  const handleSendPayment = async () => {
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Validate inputs
      validateInputs();

      setIsLoading(true);
      setStep("signing");

      // Step 2: Build the transaction
      const transactionXDR = await buildPaymentTransaction(
        publicKey,
        destination.trim(),
        amount.trim()
      );

      // Step 3: Sign with Freighter
      // This will open a popup in the Freighter extension
      const signedXDR = await signTransaction(transactionXDR, {
        network: "TESTNET",
        networkPassphrase: NETWORK_PASSPHRASE,
        accountToSign: publicKey,
      });

      // Check if user cancelled the signature
      if (!signedXDR) {
        throw new Error("Transaction signing was cancelled");
      }

      // Step 4: Submit to Stellar network
      setStep("submitting");
      const result = await submitTransaction(signedXDR);

      // Step 5: Success!
      setSuccess({
        hash: result.hash,
        explorerUrl: getExplorerUrl(result.hash),
      });

      // Clear form
      setDestination("");
      setAmount("");

      // Notify parent to refresh balance
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
      setStep("input");
    }
  };

  /**
   * Gets the current step label for loading state
   */
  const getStepLabel = () => {
    switch (step) {
      case "signing":
        return "Waiting for signature...";
      case "submitting":
        return "Submitting transaction...";
      default:
        return "Processing...";
    }
  };

  // Wallet not connected
  if (!publicKey) {
    return (
      <div className="glass-card p-6 opacity-60">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-muted">
            <Send className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">Send XLM</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to send XLM
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Send XLM</h3>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20 success-pulse">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-success font-medium">Transaction Successful!</p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                Hash: {success.hash}
              </p>
              <a
                href={success.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="text-destructive font-medium">Transaction Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPayment();
        }}
        className="space-y-4"
      >
        {/* Destination input */}
        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sm text-foreground">
            Destination Address
          </Label>
          <Input
            id="destination"
            type="text"
            placeholder="GABC...XYZ (Stellar public key)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={isLoading}
            className="font-mono text-sm bg-muted/50 border-border/50 focus:border-primary placeholder:text-muted-foreground/50"
          />
          <p className="text-xs text-muted-foreground">
            Enter the recipient's Stellar public key (starts with 'G')
          </p>
        </div>

        {/* Amount input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm text-foreground">
            Amount (XLM)
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="0.0000001"
              min="0.0000001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              className="pr-14 bg-muted/50 border-border/50 focus:border-primary placeholder:text-muted-foreground/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              XLM
            </span>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading || !destination || !amount}
          className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity mt-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {getStepLabel()}
            </>
          ) : (
            <>
              Send Payment
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Testnet reminder */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        ⚠️ This is Stellar Testnet. Transactions use test XLM only.
      </p>
    </div>
  );
}
