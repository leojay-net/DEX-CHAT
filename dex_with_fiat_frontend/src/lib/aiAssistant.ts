import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAnalysisResult, TransactionData } from '@/types';



const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export class AIAssistant {
    private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    async analyzeUserMessage(message: string, context?: Record<string, unknown>): Promise<AIAnalysisResult> {
        try {
            const prompt = this.buildAnalysisPrompt(message, context);
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();

            return this.parseAIResponse(response);
        } catch (error) {
            console.error('AI Analysis Error:', error);
            return {
                intent: 'unknown',
                confidence: 0,
                extractedData: {},
                requiredQuestions: [],
                suggestedResponse: "I'm having trouble understanding your request. Could you please rephrase it?"
            };
        }
    }

    private buildAnalysisPrompt(message: string, context?: Record<string, unknown>): string {
        return `
You are a professional AI agent specializing in cryptocurrency-to-fiat conversions. You help users seamlessly convert their crypto assets to local currency through secure bank transfers.

PERSONALITY & TONE:
- Professional yet friendly and approachable
- Clear, concise communication
- Proactive in guiding users through the conversion process
- Confident and knowledgeable about DeFi and traditional finance

User Message: "${message}"
Context: ${context ? JSON.stringify(context) : 'None'}

CORE CAPABILITIES:
1. USDT to Fiat conversions (USDT → NGN, USD, EUR) - Primary Focus
2. Real-time USDT market rate analysis
3. Transaction tracking and receipt generation
4. Account setup and verification guidance
5. USDT portfolio balance management

CONVERSATION FLOW INTELLIGENCE:
- Greetings: Welcome users warmly, focus on USDT stablecoin conversions
- Conversion requests: Extract USDT details, provide rate quotes, guide through process
- Questions: Answer knowledgeably about USDT, stablecoins, DeFi, regulations, security
- Technical issues: Provide clear troubleshooting guidance
- Missing info: Ask targeted follow-up questions naturally

EXTRACTION GUIDELINES:
- Set intent to "fiat_conversion" only when user explicitly wants to convert USDT to fiat
- Set intent to "query" for questions, information requests, or casual conversation
- Set intent to "portfolio" for USDT balance checks, asset inquiries
- Set intent to "unknown" only if completely unclear
- Always assume USDT when referring to tokens (we only support USDT stablecoin)

Respond with a JSON object in this exact format:
{
  "intent": "fiat_conversion|query|portfolio|technical_support|unknown",
  "confidence": 0.8,
  "extractedData": {
    "type": "fiat_conversion",
    "tokenIn": "USDT",
    "amountIn": "1000",
    "fiatAmount": "1000",
    "fiatCurrency": "NGN",
    "urgency": "normal",
    "preferredMethod": "bank_transfer"
  },
  "requiredQuestions": ["What amount of USDT would you like to convert?"],
  "suggestedResponse": "I'd be happy to help you convert your USDT to Nigerian Naira! At current rates, 1000 USDT is approximately ₦1,650,000. To proceed with your conversion, I'll need to confirm a few details. What amount of USDT would you like to convert?"
}

EXAMPLE RESPONSES BY INTENT:

GREETING/WELCOME:
{
  "intent": "query",
  "confidence": 0.95,
  "extractedData": {},
  "requiredQuestions": [],
  "suggestedResponse": "Hello! I'm your personal USDT-to-fiat conversion specialist. I can help you seamlessly convert your USDT stablecoin to local currency (NGN, USD, EUR) through secure bank transfers. Whether you want to cash out a small amount or large holdings, I'll guide you through the entire process. What can I help you with today?"
}

GENERAL QUERY:
{
  "intent": "query", 
  "confidence": 0.85,
  "extractedData": {},
  "requiredQuestions": [],
  "suggestedResponse": "Great question! I'm here to help with that. [Provide helpful answer and naturally guide toward USDT conversion services]"
}

PORTFOLIO CHECK:
{
  "intent": "portfolio",
  "confidence": 0.9,
  "extractedData": {},
  "requiredQuestions": [],
  "suggestedResponse": "I can help you check your USDT balance and evaluate conversion opportunities. Let me connect to your wallet to provide real-time USDT balance information."
}

FIAT_CONVERSION EXAMPLE:
{
  "intent": "fiat_conversion",
  "confidence": 0.9,
  "extractedData": {
    "type": "fiat_conversion",
    "tokenIn": "USDT",
    "amountIn": "500",
    "fiatCurrency": "NGN"
  },
  "requiredQuestions": [],
  "suggestedResponse": "Perfect! I can help you convert 500 USDT to Nigerian Naira. At current rates, that's approximately ₦825,000. Let me prepare the conversion details for you to review and sign."
}

Be conversational and helpful. Ask clarifying questions when information is missing. Always focus on USDT stablecoin conversions.
`;
    }

    private parseAIResponse(response: string): AIAnalysisResult {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    intent: parsed.intent || 'unknown',
                    confidence: parsed.confidence || 0.5,
                    extractedData: parsed.extractedData || {},
                    requiredQuestions: parsed.requiredQuestions || [],
                    suggestedResponse: parsed.suggestedResponse || "How can I help you today?"
                };
            }
        } catch (error) {
            console.error('Failed to parse AI response:', error);
        }

        return {
            intent: 'unknown',
            confidence: 0,
            extractedData: {},
            requiredQuestions: [],
            suggestedResponse: response || "How can I help you with your DeFi needs today?"
        };
    }

    async generateFollowUpQuestion(intent: string, missingData: string[]): Promise<string> {
        const prompt = `
Generate a natural follow-up question for a DeFi trading assistant.

Intent: ${intent}
Missing Data: ${missingData.join(', ')}

Generate a single, conversational question to collect the missing information.
Be helpful and specific about what you need.
`;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('Failed to generate follow-up question:', error);
            return "Could you provide more details about your request?";
        }
    }

    async validateTransactionData(data: TransactionData): Promise<{
        isValid: boolean;
        errors: string[];
        suggestions: string[];
    }> {
        const errors: string[] = [];
        const suggestions: string[] = [];

        if (data.type === 'fiat_conversion') {
            if (!data.tokenIn) errors.push('Token to convert is required');
            if (!data.amountIn && !data.fiatAmount) {
                errors.push('Either token amount or fiat amount is required');
            }
            if (!data.fiatCurrency) {
                suggestions.push('Consider specifying the fiat currency (NGN, USD, etc.)');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            suggestions
        };
    }

    async generateConversionReceipt(transactionData: {
        transactionId?: string;
        txHash?: string;
        amount?: string;
        token?: string;
        fiatCurrency?: string;
        estimatedFiat?: string;
        status?: string;
    }): Promise<string> {
        const currentTime = new Date().toLocaleString();
        const estimatedCompletion = new Date(Date.now() + 15 * 60000).toLocaleString(); // 15 minutes from now

        return `
**CRYPTOCURRENCY CONVERSION RECEIPT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Transaction Details**
Transaction ID: ${transactionData.transactionId || 'TXN-' + Date.now()}
Blockchain Hash: ${transactionData.txHash || 'Pending...'}
Status: ${transactionData.status || 'Processing'}
Initiated: ${currentTime}
Est. Completion: ${estimatedCompletion}

**Conversion Summary**
From: ${transactionData.amount || 'N/A'} ${transactionData.token || 'ETH'}
To: ${transactionData.fiatCurrency || 'NGN'} ${transactionData.estimatedFiat || 'Calculating...'}
Exchange Rate: Market rate at execution
Platform Fee: 0.5% (Industry leading)

**Bank Transfer Details**
Method: Instant Bank Transfer
Network: ${transactionData.token === 'ETH' ? 'Ethereum Mainnet' : 'Multi-chain'}
Security: End-to-end encrypted
Compliance: Fully regulated & compliant

**Next Steps**
1. Transaction submitted to blockchain
2. Smart contract execution in progress
3. Bank transfer will be initiated upon confirmation
4. Funds typically arrive within 5-15 minutes

**Support Available 24/7**
Need assistance? I'm here to help track your transaction or answer any questions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for using our professional crypto-to-fiat conversion service! 
Your financial freedom is our priority.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();
    }

    async generateMarketUpdate(tokenSymbol: string = 'ETH'): Promise<string> {
        // In a real implementation, you'd fetch actual market data
        const mockPrice = tokenSymbol === 'ETH' ? 2850 : 1850;
        const mockChange = Math.random() > 0.5 ? '+' : '-';
        const mockPercent = (Math.random() * 5).toFixed(2);

        return `
**LIVE MARKET UPDATE - ${tokenSymbol.toUpperCase()}**

Current Price: $${mockPrice.toLocaleString()} USD
24h Change: ${mockChange}${mockPercent}%
Best Time to Convert: ${Math.random() > 0.5 ? 'Good opportunity' : 'Consider waiting'}

Our AI suggests: ${Math.random() > 0.5
                ? 'Market conditions are favorable for conversion'
                : 'Price trending upward - you might want to hold or convert partially'}

Ready to convert? I can help you get the best rates with minimal fees.
        `.trim();
    }
}
