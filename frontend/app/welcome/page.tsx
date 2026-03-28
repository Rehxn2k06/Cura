import Link from 'next/link';
import { ArrowRight, Zap, Shield, Gauge } from 'lucide-react';

export const metadata = {
  title: 'Null Pointer — AI Observability Platform',
  description: 'Enterprise-grade AI-powered incident management and observability',
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between pt-6 px-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Null Pointer
            </span>
          </h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-foreground hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-24 pb-32 px-4 max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <div>
              <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                AI-Powered
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Incident Management
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Automatically detect, analyze, and remediate infrastructure incidents with
                intelligent AI agents. Scale your operations without scaling your team.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 border border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="pb-32 px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-foreground text-center mb-16">
              Why Teams Choose Null Pointer
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glass card-glow border border-gray-200 dark:border-white/10 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">
                  Instant Automation
                </h4>
                <p className="text-muted-foreground">
                  Three operation modes: YOLO (full automation), Plan (suggestions), and Approval
                  (manual). Choose the right automation level for your needs.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass card-glow border border-gray-200 dark:border-white/10 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">
                  Enterprise Security
                </h4>
                <p className="text-muted-foreground">
                  Built-in safety mechanisms, dry-run testing, and risk level controls ensure your
                  infrastructure stays protected.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass card-glow border border-gray-200 dark:border-white/10 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">
                  Real-Time Monitoring
                </h4>
                <p className="text-muted-foreground">
                  Comprehensive dashboards showing CPU, latency, error rates, and service health
                  across all your microservices.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="pb-32 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">
                80%
              </p>
              <p className="text-muted-foreground mt-2">Faster incident resolution</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">
                50K+
              </p>
              <p className="text-muted-foreground mt-2">Incidents managed monthly</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">
                99.99%
              </p>
              <p className="text-muted-foreground mt-2">Platform uptime SLA</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pb-32 px-4">
          <div className="max-w-4xl mx-auto glass card-glow border border-gray-200 dark:border-white/10 p-12 rounded-2xl text-center">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Ready to transform your incident management?
            </h3>
            <p className="text-muted-foreground mb-8">
              Start with our free plan and scale as you grow. No credit card required.
            </p>
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all inline-flex items-center gap-2 group"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-4">
          <div className="max-w-7xl mx-auto text-center text-muted-foreground text-sm">
            <p>&copy; 2024 Null Pointer. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
