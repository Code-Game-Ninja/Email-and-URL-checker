'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, ShieldAlert, Loader2, Shield, Search, AlertOctagon, ThumbsUp, ThumbsDown, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface AnalysisResult {
  overall_risk: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  url_analysis: {
    summary: string;
    confidence: 'High' | 'Medium' | 'Low';
  };
  fraud_text_analysis: {
    fraud_probability: number;
    category: string;
    signals_detected: string[];
    extracted_emails?: string[];
    email_risk_analysis?: {
      email: string;
      riskLevel: 'safe' | 'suspicious' | 'high_risk';
      reasons: string[];
      historical: {
        isFlagged: boolean;
        threatCount: number;
        safeCount: number;
      };
    }[];
  };
  user_warning_message: string;
  disclaimer: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to analyze
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input && !loading) {
        handleSubmit(e as any);
      }
      
      // Escape to clear input
      if (e.key === 'Escape') {
        setInput('');
        setResult(null);
        setFeedbackGiven(false);
        setShowEmailInput(false);
        setManualEmail('');
      }

      // S key for "Safe" feedback (when result is shown)
      if (e.key === 's' && result && !feedbackGiven && !loading) {
        handleFeedback('safe');
      }

      // T key for "Threat" feedback (when result is shown)
      if (e.key === 't' && result && !feedbackGiven && !loading) {
        handleFeedback('threat');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [input, loading, result, feedbackGiven]);

  const handleSeedDatabase = async () => {
    const toastId = toast.loading("Seeding database with threat intelligence...");
    
    try {
      const response = await axios.post('/api/seed');
      
      if (response.data.skipped) {
        toast.info(response.data.message, { id: toastId });
      } else {
        toast.success(`✅ ${response.data.message}\n📊 Added: ${response.data.stats?.highRisk} high-risk, ${response.data.stats?.suspicious} suspicious, ${response.data.stats?.safe} safe`, { 
          id: toastId,
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 503) {
        toast.error("Database not available. Please check MongoDB connection.", { id: toastId });
      } else {
        toast.error("Failed to seed database", { id: toastId });
      }
    }
  };

  const handleManualEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail) return;
    
    setCheckingEmail(true);
    const toastId = toast.loading("Checking email reputation...");
    
    try {
      // Analyze just the email
      const response = await axios.post('/api/analyze', { message: manualEmail });
      const emailResult = response.data;
      
      // Merge results
      if (result && emailResult.fraud_text_analysis.email_risk_analysis) {
        const newResult = { ...result };
        
        // Add the email analysis
        newResult.fraud_text_analysis.extracted_emails = [
          ...(newResult.fraud_text_analysis.extracted_emails || []),
          manualEmail
        ];
        
        newResult.fraud_text_analysis.email_risk_analysis = [
          ...(newResult.fraud_text_analysis.email_risk_analysis || []),
          ...emailResult.fraud_text_analysis.email_risk_analysis
        ];
        
        // Update overall risk if email is dangerous
        if (emailResult.overall_risk === 'DANGEROUS') {
            newResult.overall_risk = 'DANGEROUS';
            newResult.user_warning_message = "DANGER: The associated email is a known threat.";
        } else if (emailResult.overall_risk === 'CAUTION' && newResult.overall_risk === 'SAFE') {
            newResult.overall_risk = 'CAUTION';
             newResult.user_warning_message = "CAUTION: The associated email looks suspicious.";
        }
        
        setResult(newResult);
        setShowEmailInput(false); // Hide input after checking
        setManualEmail('');
        toast.success("Email checked and added to analysis", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to check email", { id: toastId });
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) {
      toast.error("Please enter a URL or message to analyze.");
      return;
    }

    setLoading(true);
    setResult(null);
    setFeedbackGiven(false);
    setShowEmailInput(false);
    const toastId = toast.loading("Analyzing content for threats...");

    try {
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(input);
      const payload = isUrl ? { url: input } : { message: input };

      const response = await axios.post('/api/analyze', payload);
      setResult(response.data);
      
      // Check if we should ask for email
      if (response.data.overall_risk !== 'SAFE' && 
          (!response.data.fraud_text_analysis.extracted_emails || 
           response.data.fraud_text_analysis.extracted_emails.length === 0)) {
        setShowEmailInput(true);
      }

      toast.success("Analysis complete", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while analyzing. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (userFeedback: 'safe' | 'threat') => {
    if (!result || !input) return;

    const toastId = toast.loading("Saving your feedback...");

    try {
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(input);
      
      const response = await axios.post('/api/feedback', {
        content: input,
        contentType: isUrl ? 'url' : 'message',
        userFeedback,
        aiPrediction: result.overall_risk,
        fraudProbability: result.fraud_text_analysis.fraud_probability,
        signals: result.fraud_text_analysis.signals_detected,
      });

      setFeedbackGiven(true);
      toast.success("Thank you! Your feedback helps improve our AI.", { id: toastId });
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 503) {
        toast.info("Feedback system is currently unavailable. Your analysis is complete.", { id: toastId });
      } else {
        toast.error("Failed to save feedback. Please try again.", { id: toastId });
      }
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full ring-1 ring-primary/20 mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Cybersecurity Risk AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced threat detection with AI learning from your feedback.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-secondary rounded border border-border">Ctrl+Enter</kbd> to Analyze
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-secondary rounded border border-border">Esc</kbd> to Clear
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="input" className="flex items-center text-sm font-medium text-foreground">
                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                Enter URL or Message Content
              </label>
              <textarea
                id="input"
                rows={4}
                className="flex min-h-30 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                placeholder="Paste a suspicious URL or message text here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !input}
              className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4 py-2 shadow-lg hover:shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                'Analyze Risk'
              )}
            </button>
          </form>
        </div>

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Eye-catching notification banner */}
            <div className={cn(
              "mb-6 px-6 py-5 rounded-xl shadow-lg border flex items-start gap-5 transition-all duration-300",
              result.overall_risk === 'SAFE' ? "bg-linear-to-r from-green-50 to-emerald-50 border-green-200 text-green-900 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800 dark:text-green-100" :
              result.overall_risk === 'CAUTION' ? "bg-linear-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800 dark:text-amber-100" :
              "bg-linear-to-r from-red-50 to-rose-50 border-red-200 text-red-900 dark:from-red-950/30 dark:to-rose-950/30 dark:border-red-800 dark:text-red-100"
            )}>
              <div className={cn("p-2 rounded-full shrink-0 mt-1",
                 result.overall_risk === 'SAFE' ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" :
                 result.overall_risk === 'CAUTION' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400" :
                 "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
              )}>
                {result.overall_risk === 'SAFE' ? <CheckCircle className="h-6 w-6" /> :
                 result.overall_risk === 'CAUTION' ? <AlertTriangle className="h-6 w-6" /> :
                 <AlertOctagon className="h-6 w-6" />}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg leading-tight">
                  {result.user_warning_message}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium opacity-80">Risk Level:</span>
                  <span className={cn("text-sm font-bold px-2 py-0.5 rounded-full border",
                    result.overall_risk === 'SAFE' ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300" :
                    result.overall_risk === 'CAUTION' ? "bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/50 dark:border-amber-800 dark:text-amber-300" :
                    "bg-red-100 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-800 dark:text-red-300"
                  )}>
                    {result.overall_risk}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              
              <div className="p-6 md:p-8 grid gap-8 md:grid-cols-2">
                
                {result.url_analysis.summary !== 'No significant threats detected.' && result.url_analysis.summary !== 'Plain-language explanation' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <Search className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">URL Analysis</h3>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</span>
                        <p className="text-sm mt-1">{result.url_analysis.summary}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn("h-2 w-2 rounded-full", 
                            result.url_analysis.confidence === 'High' ? "bg-green-500" : 
                            result.url_analysis.confidence === 'Medium' ? "bg-yellow-500" : "bg-red-500"
                          )} />
                          <span className="text-sm font-medium">{result.url_analysis.confidence}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {result.fraud_text_analysis.category !== 'unknown' && (
                  <div className="space-y-4 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <AlertOctagon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Content Analysis</h3>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fraud Probability</span>
                          <p className={cn("text-xl font-bold mt-1", 
                            result.fraud_text_analysis.fraud_probability > 0.7 ? "text-red-500" : 
                            result.fraud_text_analysis.fraud_probability > 0.3 ? "text-yellow-500" : "text-green-500"
                          )}>
                            {(result.fraud_text_analysis.fraud_probability * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</span>
                          <p className="text-sm font-medium mt-1 capitalize">{result.fraud_text_analysis.category}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Signals Detected</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {result.fraud_text_analysis.signals_detected.length > 0 ? (
                            result.fraud_text_analysis.signals_detected.map((signal, idx) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                <AlertOctagon className="w-3 h-3 mr-1" />
                                {signal}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground italic">No specific threat signals detected</span>
                          )}
                        </div>
                      </div>

                      {/* Email Risk Analysis */}
                      {result.fraud_text_analysis.extracted_emails && result.fraud_text_analysis.extracted_emails.length > 0 && (
                        <div className="border-t border-border pt-3 mt-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Addresses Detected</span>
                          <div className="mt-2 space-y-2">
                            {result.fraud_text_analysis.email_risk_analysis?.map((emailAnalysis, idx) => (
                              <div key={idx} className={cn(
                                "p-3 rounded-lg border",
                                emailAnalysis.riskLevel === 'high_risk' ? "bg-red-500/10 border-red-500/30" :
                                emailAnalysis.riskLevel === 'suspicious' ? "bg-yellow-500/10 border-yellow-500/30" :
                                "bg-green-500/10 border-green-500/30"
                              )}>
                                <div className="flex items-center justify-between">
                                  <code className="text-sm font-mono">{emailAnalysis.email}</code>
                                  <span className={cn(
                                    "text-xs font-bold uppercase px-2 py-1 rounded",
                                    emailAnalysis.riskLevel === 'high_risk' ? "bg-red-500 text-white" :
                                    emailAnalysis.riskLevel === 'suspicious' ? "bg-yellow-500 text-black" :
                                    "bg-green-500 text-white"
                                  )}>
                                    {emailAnalysis.riskLevel.replace('_', ' ')}
                                  </span>
                                </div>
                                {emailAnalysis.reasons.length > 0 && (
                                  <ul className="mt-2 text-xs space-y-1 list-disc list-inside opacity-80">
                                    {emailAnalysis.reasons.map((reason, rIdx) => (
                                      <li key={rIdx}>{reason}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Manual Email Check Input */}
                      {showEmailInput && (
                        <div className="border-t border-border pt-4 mt-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-full shrink-0">
                              <Search className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <h4 className="text-sm font-semibold">Check Sender Email</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  No email was found in the message. If you know the sender's email, check it for known threats.
                                </p>
                              </div>
                              <form onSubmit={handleManualEmailSubmit} className="flex gap-2">
                                <input
                                  type="email"
                                  placeholder="e.g. sender@example.com"
                                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                  value={manualEmail}
                                  onChange={(e) => setManualEmail(e.target.value)}
                                  required
                                />
                                <button
                                  type="submit"
                                  disabled={checkingEmail || !manualEmail}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                                >
                                  {checkingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>

              {/* Feedback Section */}
              <div className="bg-secondary/20 px-6 py-4 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Was this analysis accurate? Your feedback helps our AI learn.
                    <span className="block text-xs mt-1 opacity-75">Keyboard: Press <kbd className="px-1 py-0.5 bg-secondary rounded">S</kbd> for Safe, <kbd className="px-1 py-0.5 bg-secondary rounded">T</kbd> for Threat</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback('safe')}
                      disabled={feedbackGiven}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        feedbackGiven 
                          ? "bg-secondary text-muted-foreground cursor-not-allowed"
                          : "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 hover:scale-105 transform"
                      )}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      It's Safe
                      <kbd className="ml-1 px-1 py-0.5 text-xs bg-green-500/20 rounded">S</kbd>
                    </button>
                    <button
                      onClick={() => handleFeedback('threat')}
                      disabled={feedbackGiven}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        feedbackGiven 
                          ? "bg-secondary text-muted-foreground cursor-not-allowed"
                          : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:scale-105 transform"
                      )}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      It's a Threat
                      <kbd className="ml-1 px-1 py-0.5 text-xs bg-red-500/20 rounded">T</kbd>
                    </button>
                  </div>
                </div>
                {feedbackGiven && (
                  <p className="text-xs text-green-500 mt-2 text-center animate-in fade-in slide-in-from-bottom-2">✓ Feedback saved! Thank you for helping improve our AI.</p>
                )}
              </div>
              
              <div className="bg-secondary/30 px-6 py-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  {result.disclaimer}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
