/**
 * TransactionHistory Component
 * 
 * Displays the user's recent XLM transactions fetched from Horizon
 * Shows sent/received transactions with clickable addresses
 * Allows selecting an address to use as recipient
 */

import { useState, useEffect, useCallback } from "react";
import {
  getTransactionHistory,
  getExplorerUrl,
  getAccountExplorerUrl,
} from "@/stellar/stellarClient";
import { Button } from "@/components/ui/button";
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

export default function TransactionHistory({ publicKey, onSelectAddress, refreshTrigger }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  /**
   * Fetches transaction history from Horizon
   */
  const fetchHistory = useCallback(async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const history = await getTransactionHistory(publicKey, 20);
      setTransactions(history);
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      setError(err.message || "Failed to fetch transaction history");
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Fetch on mount and when publicKey or refreshTrigger changes
  useEffect(() => {
    if (publicKey) {
      fetchHistory();
    } else {
      setTransactions([]);
    }
  }, [publicKey, fetchHistory, refreshTrigger]);

  /**
   * Formats a public key for display
   */
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  /**
   * Formats the transaction date
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Copies address to clipboard
   */
  const copyAddress = async (address, txId) => {
    await navigator.clipboard.writeText(address);
    setCopiedId(txId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Wallet not connected
  if (!publicKey) {
    return (
      <div className="glass-card p-6 opacity-60">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-muted">
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">
            Transaction History
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to view transaction history
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <History className="h-5 w-5 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Transaction History
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchHistory}
          disabled={isLoading}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Refresh history"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && transactions.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && transactions.length === 0 && (
        <div className="text-center py-8">
          <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No transactions yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Your payment history will appear here
          </p>
        </div>
      )}

      {/* Transaction list */}
      {transactions.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className={`p-3 rounded-lg border transition-colors ${
                tx.successful
                  ? "bg-muted/30 border-border/50 hover:border-border"
                  : "bg-destructive/5 border-destructive/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Direction icon and amount */}
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      tx.direction === "sent"
                        ? "bg-destructive/10"
                        : "bg-success/10"
                    }`}
                  >
                    {tx.direction === "sent" ? (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-semibold ${
                          tx.direction === "sent"
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {tx.direction === "sent" ? "-" : "+"}
                        {parseFloat(tx.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 7,
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">XLM</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(tx.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Other party address */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {tx.direction === "sent" ? "To:" : "From:"}
                    </span>
                    <button
                      onClick={() => onSelectAddress?.(tx.otherParty)}
                      className="font-mono text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
                      title="Click to use this address"
                    >
                      {formatAddress(tx.otherParty)}
                    </button>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <button
                      onClick={() => copyAddress(tx.otherParty, tx.id)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy address"
                    >
                      {copiedId === tx.id ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    {tx.hash && (
                      <a
                        href={getExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="View on explorer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <a
                      href={getAccountExplorerUrl(tx.otherParty)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="View account on explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Memo if present */}
              {tx.memo && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Memo: <span className="text-foreground">{tx.memo}</span>
                  </p>
                </div>
              )}

              {/* Failed transaction indicator */}
              {!tx.successful && (
                <div className="mt-2 pt-2 border-t border-destructive/20">
                  <p className="text-xs text-destructive">Transaction failed</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {transactions.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          💡 Click an address to use it as recipient
        </p>
      )}
    </div>
  );
}
