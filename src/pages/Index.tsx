/**
 * Stellar Payment dApp - Main Application
 * 
 * A beginner-friendly dApp for the Stellar Testnet that:
 * - Connects to Freighter wallet
 * - Displays XLM balance
 * - Allows sending XLM payments
 * 
 * Built for the Stellar Journey to Mastery - Level 1 White Belt Challenge
 */

import { useState, useCallback } from "react";
import WalletConnect from "@/components/WalletConnect";
import Balance from "@/components/Balance";
import SendPayment from "@/components/SendPayment";
import { Sparkles, Github, BookOpen } from "lucide-react";

const Index = () => {
  // Store the connected wallet's public key
  // null means no wallet is connected
  const [publicKey, setPublicKey] = useState(null);
  
  // Counter to trigger balance refresh after transactions
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  /**
   * Called when wallet successfully connects
   */
  const handleConnect = useCallback((pubKey) => {
    setPublicKey(pubKey);
  }, []);

  /**
   * Called when wallet disconnects
   */
  const handleDisconnect = useCallback(() => {
    setPublicKey(null);
  }, []);

  /**
   * Called after a successful transaction to refresh balance
   */
  const handleTransactionComplete = useCallback(() => {
    // Increment key to trigger Balance component refresh
    setBalanceRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">
              Stellar<span className="text-primary">Pay</span>
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning font-medium ml-2">
              TESTNET
            </span>
          </div>
          
          <nav className="flex items-center gap-4">
            <a
              href="https://developers.stellar.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Docs</span>
            </a>
            <a
              href="https://github.com/stellar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple XLM Payments
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect your Freighter wallet to send XLM on the Stellar Testnet. 
            Perfect for learning blockchain development.
          </p>
        </div>

        {/* Cards grid */}
        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
          {/* Left column - Wallet and Balance */}
          <div className="space-y-6">
            <WalletConnect
              publicKey={publicKey}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
            <Balance 
              key={balanceRefreshKey}
              publicKey={publicKey} 
            />
          </div>

          {/* Right column - Send Payment */}
          <div>
            <SendPayment
              publicKey={publicKey}
              onTransactionComplete={handleTransactionComplete}
            />
          </div>
        </div>

        {/* Info cards */}
        <div className="max-w-4xl mx-auto mt-12 grid gap-4 sm:grid-cols-3">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-medium text-foreground mb-1">Fast & Cheap</h4>
            <p className="text-xs text-muted-foreground">
              Transactions settle in 3-5 seconds with minimal fees
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h4 className="font-medium text-foreground mb-1">Secure</h4>
            <p className="text-xs text-muted-foreground">
              Transactions are signed locally via Freighter wallet
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">🧪</div>
            <h4 className="font-medium text-foreground mb-1">Testnet Safe</h4>
            <p className="text-xs text-muted-foreground">
              Practice with test XLM - no real money at risk
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Built for the{" "}
            <span className="text-primary font-medium">
              Stellar Journey to Mastery
            </span>{" "}
            - Level 1 White Belt Challenge
          </p>
          <p className="mt-2 text-xs">
            Powered by{" "}
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stellar
            </a>{" "}
            &{" "}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Freighter
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
