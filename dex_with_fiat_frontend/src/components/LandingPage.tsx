'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, Globe, CheckCircle, Play, Lock, Smartphone, Code, Mail, MapPin, Phone, Github, Twitter, Linkedin, Star, BarChart3, Network, Cpu, FileText, HelpCircle, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FeatureCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, delay }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:bg-gray-800/70 backdrop-blur-sm">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{description}</p>
            </div>
        </div>
    );
};

interface StepProps {
    number: number;
    title: string;
    description: string;
    delay: number;
}

const Step: React.FC<StepProps> = ({ number, title, description, delay }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div className={`transform transition-all duration-700 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                    <span className="text-white font-bold">{number}</span>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
                    <p className="text-gray-300">{description}</p>
                </div>
            </div>
        </div>
    );
};

export default function LandingPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);

    useEffect(() => {
        setHeroVisible(true);
    }, []);

    const handleGetStarted = () => {
        router.push('/chat');
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        // Here you would typically send the email to your backend
        setTimeout(() => {
            router.push('/chat');
        }, 1500);
    };

    const features = [
        {
            icon: Shield,
            title: "Bank-Grade Security",
            description: "Multi-signature smart contracts with formal verification, hardware security modules, and real-time fraud detection systems.",
            delay: 200
        },
        {
            icon: Zap,
            title: "Lightning Processing",
            description: "Sub-30 second transaction processing with automatic market making and dynamic liquidity optimization across multiple DEXs.",
            delay: 400
        },
        {
            icon: Globe,
            title: "Global Infrastructure",
            description: "Integrated with 200+ banking networks across 50+ countries with regulatory compliance and local currency support.",
            delay: 600
        },
        {
            icon: Lock,
            title: "Zero-Knowledge Privacy",
            description: "Advanced cryptographic protocols ensure transaction privacy while maintaining full regulatory compliance and audit trails.",
            delay: 800
        },
        {
            icon: Smartphone,
            title: "Mobile-First Design",
            description: "Progressive web app with offline capabilities, biometric authentication, and seamless cross-device synchronization.",
            delay: 1000
        },
        {
            icon: Code,
            title: "Open Source",
            description: "Fully audited smart contracts with transparent fee structures and community-driven governance mechanisms.",
            delay: 1200
        }
    ];

    const steps = [
        {
            number: 1,
            title: "Connect & Verify",
            description: "Link your MetaMask wallet or any Web3-compatible wallet. Complete KYC verification for regulatory compliance and enhanced security features.",
            delay: 800
        },
        {
            number: 2,
            title: "Select & Configure",
            description: "Choose from 15+ supported cryptocurrencies on Morph network including ETH, USDC, USDT. Set conversion parameters and slippage tolerance.",
            delay: 1000
        },
        {
            number: 3,
            title: "Execute & Receive",
            description: "Smart contracts automatically execute conversion at optimal rates. Funds arrive in your bank account within 30 seconds to 24 hours depending on your bank.",
            delay: 1200
        },
        {
            number: 4,
            title: "Track & Manage",
            description: "Real-time transaction monitoring with detailed analytics, tax reporting tools, and automated compliance documentation.",
            delay: 1400
        }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className={`relative z-10 text-center max-w-4xl mx-auto transform transition-all duration-1000 ${heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        Crypto to <span className="text-blue-400">Fiat</span><br />
                        <span className="text-gray-300">Simplified</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Convert your cryptocurrency to fiat currency instantly with our AI-powered chat interface.
                        Secure, fast, and completely decentralized.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <button
                            onClick={handleGetStarted}
                            className="group flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                        >
                            <Play className="w-5 h-5" />
                            <span>Start Converting</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>

                        <div className="text-sm text-gray-400 flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>No registration required</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-2">99.8%</div>
                            <div className="text-sm text-gray-400">Success Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-2">&lt;30s</div>
                            <div className="text-sm text-gray-400">Avg Processing</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
                            <div className="text-sm text-gray-400">Available</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-2">$50M+</div>
                            <div className="text-sm text-gray-400">Volume Processed</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Why Choose Our Platform</h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Built for the future of finance with cutting-edge blockchain technology
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Technology Stack */}
            <section className="py-20 px-4 bg-gray-800/20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Built on Cutting-Edge Technology</h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Our platform leverages the latest in blockchain infrastructure and financial technology
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
                            <Network className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Morph L2</h3>
                            <p className="text-gray-300 text-sm">High-throughput Layer 2 solution with minimal gas fees</p>
                        </div>
                        <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
                            <Cpu className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
                            <p className="text-gray-300 text-sm">Machine learning for optimal routing and pricing</p>
                        </div>
                        <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
                            <Lock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Zero-Knowledge</h3>
                            <p className="text-gray-300 text-sm">Privacy-preserving transaction processing</p>
                        </div>
                        <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
                            <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Real-Time Analytics</h3>
                            <p className="text-gray-300 text-sm">Advanced monitoring and optimization systems</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Supported Assets */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Supported Assets & Networks</h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Convert from major cryptocurrencies to over 50 fiat currencies worldwide
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-2xl font-semibold mb-6">Cryptocurrencies</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {['ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'LINK', 'UNI', 'AAVE'].map((token) => (
                                    <div key={token} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
                                        <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                                            <span className="text-blue-400 font-bold text-sm">{token.slice(0, 2)}</span>
                                        </div>
                                        <span className="font-medium">{token}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold mb-6">Fiat Currencies</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { code: 'USD', name: 'US Dollar' },
                                    { code: 'EUR', name: 'Euro' },
                                    { code: 'GBP', name: 'British Pound' },
                                    { code: 'NGN', name: 'Nigerian Naira' },
                                    { code: 'JPY', name: 'Japanese Yen' },
                                    { code: 'CAD', name: 'Canadian Dollar' },
                                    { code: 'AUD', name: 'Australian Dollar' },
                                    { code: 'CHF', name: 'Swiss Franc' }
                                ].map((currency) => (
                                    <div key={currency.code} className="p-3 bg-gray-800/30 rounded-lg">
                                        <div className="font-medium">{currency.code}</div>
                                        <div className="text-gray-400 text-sm">{currency.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4 bg-gray-800/20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Trusted by DeFi Leaders</h2>
                        <p className="text-xl text-gray-300">
                            Join thousands of satisfied users who trust our platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "The fastest and most reliable crypto-to-fiat solution I've ever used. The AI chat interface makes it incredibly intuitive.",
                                author: "Sarah Chen",
                                title: "DeFi Portfolio Manager",
                                rating: 5
                            },
                            {
                                quote: "Outstanding security features and compliance. Perfect for institutional use with excellent customer support.",
                                author: "Marcus Rodriguez",
                                title: "Crypto Fund Manager",
                                rating: 5
                            },
                            {
                                quote: "Seamless integration with our existing systems. The API is well-documented and the transaction fees are very competitive.",
                                author: "Elena Vasquez",
                                title: "FinTech CTO",
                                rating: 5
                            }
                        ].map((testimonial, index) => (
                            <div key={index} className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
                                <div className="flex items-center mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <blockquote className="text-gray-300 mb-4 italic">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </blockquote>
                                <div>
                                    <div className="font-semibold">{testimonial.author}</div>
                                    <div className="text-gray-400 text-sm">{testimonial.title}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Why Choose Our Platform</h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Built for the future of finance with cutting-edge blockchain technology and enterprise-grade security
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4 bg-gray-800/30">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-xl text-gray-300">
                            Three simple steps to convert your crypto to fiat
                        </p>
                    </div>

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <Step key={index} {...step} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Early Access Form */}
            <section className="py-20 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-4">Get Early Access</h2>
                    <p className="text-xl text-gray-300 mb-8">
                        Join thousands of users already converting crypto to fiat seamlessly
                    </p>

                    {!isSubmitted ? (
                        <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="flex-1 px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap"
                            >
                                Get Started
                            </button>
                        </form>
                    ) : (
                        <div className="flex items-center justify-center space-x-2 text-green-400">
                            <CheckCircle className="w-6 h-6" />
                            <span className="text-lg">Welcome aboard! Redirecting to chat...</span>
                        </div>
                    )}

                    <p className="text-sm text-gray-400 mt-4">
                        By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-700">
                <div className="max-w-6xl mx-auto px-4 py-16">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Company Info */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center space-x-2 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
                                <span className="text-xl font-bold">DexFiat</span>
                            </div>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                The future of crypto-to-fiat conversion. Secure, fast, and compliant with global financial standards.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                    <Twitter className="w-5 h-5" />
                                </a>
                                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                    <Github className="w-5 h-5" />
                                </a>
                                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                    <MessageSquare className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        {/* Platform */}
                        <div>
                            <h3 className="text-lg font-semibold mb-6">Platform</h3>
                            <div className="space-y-3">
                                <a href="/chat" className="block text-gray-400 hover:text-white transition-colors">
                                    Convert Crypto
                                </a>
                                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                                    API Documentation
                                </a>
                                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                                    Supported Assets
                                </a>
                                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                                    Fee Structure
                                </a>
                                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                                    Status Page
                                </a>
                            </div>
                        </div>

                        {/* Resources */}
                        <div>
                            <h3 className="text-lg font-semibold mb-6">Resources</h3>
                            <div className="space-y-3">
                                <a href="#" className="flex items-center text-gray-400 hover:text-white transition-colors">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Documentation
                                </a>
                                <a href="#" className="flex items-center text-gray-400 hover:text-white transition-colors">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    Help Center
                                </a>
                                <a href="#" className="flex items-center text-gray-400 hover:text-white transition-colors">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Community
                                </a>
                                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                                    Blog
                                </a>
                                <a href="#" className="block text-gray-400 hover:text-white transition-colors">
                                    Security Audit
                                </a>
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-lg font-semibold mb-6">Contact</h3>
                            <div className="space-y-4">
                                <div className="flex items-center text-gray-400">
                                    <Mail className="w-4 h-4 mr-3" />
                                    <span>support@dexfiat.com</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <Phone className="w-4 h-4 mr-3" />
                                    <span>+1 (555) 123-4567</span>
                                </div>
                                <div className="flex items-start text-gray-400">
                                    <MapPin className="w-4 h-4 mr-3 mt-1" />
                                    <span>San Francisco, CA<br />United States</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="border-t border-gray-800 mt-12 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                                <p className="text-gray-400 text-sm">
                                    © 2024 DexFiat. All rights reserved.
                                </p>
                                <div className="flex space-x-4 text-sm">
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-gray-400 text-sm">Powered by</span>
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                                    <span className="text-sm font-semibold">Morph L2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
