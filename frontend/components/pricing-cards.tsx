'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface PricingPlan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: 'Free',
    price: 0,
    period: 'Forever',
    description: 'Perfect for getting started with AI observability',
    features: [
      'Up to 3 services',
      '7-day data retention',
      'Basic dashboards',
      'Email support',
      'Community access',
      'Single workspace',
    ],
  },
  {
    name: 'Pro',
    price: 299,
    period: '/month',
    description: 'For teams scaling their operations',
    features: [
      'Unlimited services',
      '90-day data retention',
      'Advanced analytics',
      'AI Agent automation (Plan mode)',
      'Priority email support',
      'Team collaboration (up to 5 users)',
      'Custom alerts & workflows',
      'API access',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 0,
    period: 'Custom',
    description: 'For large-scale deployments',
    features: [
      'Everything in Pro',
      'Unlimited data retention',
      'AI Agent YOLO mode (full auto)',
      '24/7 phone & email support',
      'Unlimited team members',
      'SSO & advanced security',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee (99.99%)',
    ],
  },
];

export function PricingCards() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your team. Scale as you grow.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? 'glass card-glow border-purple-500/50 dark:border-purple-500/50 shadow-2xl shadow-purple-500/20 md:scale-105'
                  : 'glass border-gray-200 dark:border-white/10'
              }`}
            >
              {/* Highlighted Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 h-full flex flex-col">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                {/* Pricing */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 mb-8 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  Get Started
                </button>

                {/* Features */}
                <div className="flex-1 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    What&apos;s included
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-foreground"
                      >
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Note */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Need a custom solution?{' '}
            <a href="/contact" className="text-primary hover:underline font-semibold">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
