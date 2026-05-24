import { Check, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Free Preview',
    price: '$0',
    highlight: false,
    features: [
      '30-second AI preview',
      'Unlimited generations',
      'Share preview link',
      'Basic mood analysis',
    ],
    cta: 'Try for free',
    ctaAction: 'free',
  },
  {
    name: 'Full Download',
    price: '$1.99',
    sub: 'per song',
    highlight: true,
    features: [
      'Full-length song (2-3 min)',
      'High quality 320kbps MP3',
      'No watermark',
      'Commercial use rights',
      'AI album art included',
      'Share link forever',
    ],
    cta: 'Get full song',
    ctaAction: 'paid',
    badge: 'Most popular',
  },
];

export default function PricingCard({ onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`relative rounded-2xl p-6 transition-all duration-300 ${
            plan.highlight
              ? 'glow-purple-sm'
              : 'glass hover:bg-white/[0.05]'
          }`}
          style={plan.highlight ? {
            background: 'linear-gradient(135deg, rgba(184,78,241,0.12), rgba(99,60,180,0.10))',
            border: '1px solid rgba(184,78,241,0.30)',
          } : {}}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(90deg, #b84ef1, #7c3aed)' }}>
              {plan.badge}
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-white/80 font-medium text-sm">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-3xl font-black ${plan.highlight ? 'gradient-text' : 'text-white'}`}>
                {plan.price}
              </span>
              {plan.sub && <span className="text-white/40 text-sm">{plan.sub}</span>}
            </div>
          </div>

          <ul className="space-y-2.5 mb-6">
            {plan.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check size={15} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-brand-400' : 'text-white/40'}`} />
                <span className={plan.highlight ? 'text-white/80' : 'text-white/55'}>{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onSelect && onSelect(plan.ctaAction)}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.03] ${
              plan.highlight
                ? 'btn-primary'
                : 'bg-white/[0.07] hover:bg-white/[0.12] text-white/70'
            }`}
          >
            {plan.highlight && <Zap size={14} className="inline mr-1.5 -mt-0.5" />}
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
