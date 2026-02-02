/**
 * WalletConnect Component
 * 
 * Handles Freighter wallet connection/disconnection
 * Displays the connected wallet's public key
 * 
 * Freighter is a browser extension wallet for Stellar
 * Similar to MetaMask for Ethereum
 */

import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  isAllowed,
  setAllowed,
  getPublicKey,
  getNetwork,
} from "@stellar/freighter-api";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertCircle, ExternalLink, CheckCircle } from "lucide-react";

export default function WalletConnect({ onConnect, onDisconnect, publicKey }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [freighterInstalled, setFreighterInstalled] = useState(null);
  const [networkCorrect, setNetworkCorrect] = useState(true);

  // Check if Freighter is installed on component mount
  useEffect(() => {
    checkFreighterStatus();
  }, []);

  /**
   * Checks if Freighter extension is installed and accessible
   */
  const checkFreighterStatus = async () => {
    try {
      const connected = await isConnected();
      setFreighterInstalled(connected);
      
      if (connected) {
        // Check if already allowed and auto-connect
        const allowed = await isAllowed();
        if (allowed) {
          await connectWallet(true);
        }
      }
    } catch (err) {
      console.error("Error checking Freighter status:", err);
      setFreighterInstalled(false);
    }
  };

  /**
   * Verifies the wallet is connected to Stellar Testnet
   */
  const checkNetwork = async () => {
    try {
      const network = await getNetwork();
      // Freighter returns "TESTNET" for testnet
      const isTestnet = network === "TESTNET";
      setNetworkCorrect(isTestnet);
      return isTestnet;
    } catch (err) {
      console.error("Error checking network:", err);
      return false;
    }
  };

  /**
   * Connects to Freighter wallet
   * @param {boolean} silent - If true, don't show errors (for auto-connect)
   */
  const connectWallet = useCallback(async (silent = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // First, request permission from user if not already allowed
      const allowed = await isAllowed();
      if (!allowed) {
        await setAllowed();
      }

      // Get the user's public key
      const pubKey = await getPublicKey();
      
      if (!pubKey) {
        throw new Error("Could not retrieve public key from Freighter");
      }

      // Verify we're on testnet
      const isTestnet = await checkNetwork();
      if (!isTestnet) {
        setError("Please switch to Stellar Testnet in Freighter settings");
        setIsLoading(false);
        return;
      }

      // Notify parent component of successful connection
      onConnect(pubKey);
    } catch (err) {
      console.error("Wallet connection error:", err);
      if (!silent) {
        setError(err.message || "Failed to connect wallet");
      }
    } finally {
      setIsLoading(false);
    }
  }, [onConnect]);

  /**
   * Disconnects the wallet (client-side only)
   * Note: Freighter doesn't have a true "disconnect" - we just clear our state
   */
  const disconnectWallet = () => {
    onDisconnect();
  };

  /**
   * Formats a public key for display (truncates middle)
   * Example: GABC...XYZ
   */
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Freighter not installed - show installation prompt
  if (freighterInstalled === false) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertCircle className="h-5 w-5 text-warning" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Freighter Required</h3>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          Freighter is a secure wallet extension for Stellar. Install it to connect your wallet.
        </p>
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
        >
          Install Freighter
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  // Still checking Freighter status
  if (freighterInstalled === null) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-muted-foreground">Checking wallet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${publicKey ? 'bg-success/10' : 'bg-primary/10'}`}>
          <Wallet className={`h-5 w-5 ${publicKey ? 'text-success' : 'text-primary'}`} />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {publicKey ? "Wallet Connected" : "Connect Wallet"}
        </h3>
      </div>

      {/* Network warning */}
      {!networkCorrect && publicKey && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">
            Please switch to Stellar Testnet in Freighter
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {/* Connected state */}
      {publicKey ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="font-mono text-sm text-foreground address-truncate" title={publicKey}>
              {formatAddress(publicKey)}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(publicKey)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Copy full address"
            >
              Copy
            </button>
          </div>
          
          <Button
            onClick={disconnectWallet}
            variant="outline"
            className="w-full gap-2 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      ) : (
        /* Disconnected state */
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your Freighter wallet to view balance and send XLM on Testnet.
          </p>
          <Button
            onClick={() => connectWallet(false)}
            disabled={isLoading}
            className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                Connect Freighter
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
