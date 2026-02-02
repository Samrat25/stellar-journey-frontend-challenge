/**
 * Balance Component
 * 
 * Displays the XLM balance for the connected wallet
 * Fetches balance from Stellar Horizon testnet API
 * Includes loading and error states
 */

import { useState, useEffect, useCallback } from "react";
import { getBalance } from "@/stellar/stellarClient";
import { Button } from "@/components/ui/button";
import { RefreshCw, Coins, AlertCircle, ExternalLink } from "lucide-react";

export default function Balance({ publicKey }) {
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetches the current XLM balance
   */
  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const xlmBalance = await getBalance(publicKey);
      setBalance(xlmBalance);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError(err.message || "Failed to fetch balance");
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Fetch balance when public key changes
  useEffect(() => {
    if (publicKey) {
      fetchBalance();
    } else {
      setBalance(null);
      setError(null);
    }
  }, [publicKey, fetchBalance]);

  /**
   * Formats balance for display
   * Shows up to 7 decimal places (Stellar precision)
   */
  const formatBalance = (bal) => {
    if (!bal) return "0";
    const num = parseFloat(bal);
    // Format with commas and limit decimal places
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 7,
    });
  };

  /**
   * Opens Stellar Laboratory to fund testnet account
   * Friendbot gives 10,000 XLM for testing
   */
  const openFriendbot = () => {
    window.open(
      `https://laboratory.stellar.org/#account-creator?network=test`,
      "_blank"
    );
  };

  // Wallet not connected
  if (!publicKey) {
    return (
      <div className="glass-card p-6 opacity-60">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-muted">
            <Coins className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">XLM Balance</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to view balance
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">XLM Balance</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchBalance}
          disabled={isLoading}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Refresh balance"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-sm text-destructive block">{error}</span>
              {error.includes("not found") && (
                <p className="text-xs text-muted-foreground mt-1">
                  New accounts need to be funded with XLM to be activated.
                </p>
              )}
            </div>
          </div>
          {error.includes("not found") && (
            <Button
              variant="outline"
              size="sm"
              onClick={openFriendbot}
              className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
            >
              <ExternalLink className="h-4 w-4" />
              Fund with Friendbot (10,000 XLM)
            </Button>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && !error && (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-muted-foreground">Loading balance...</span>
        </div>
      )}

      {/* Balance display */}
      {balance !== null && !isLoading && !error && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {formatBalance(balance)}
            </span>
            <span className="text-lg text-muted-foreground">XLM</span>
          </div>
          
          {/* Last updated timestamp */}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          
          {/* Low balance warning */}
          {parseFloat(balance) < 1 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-xs text-warning">
                Low balance. Minimum 1 XLM required for transactions.
              </span>
            </div>
          )}

          {/* Friendbot link for getting test XLM */}
          <Button
            variant="ghost"
            size="sm"
            onClick={openFriendbot}
            className="text-xs text-muted-foreground hover:text-primary gap-1 p-0 h-auto"
          >
            Need test XLM? Use Friendbot
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
