import { AnimatedTestimonials } from '@/components/ui/animated-testimonials'

function TestiMonials() {
  const testimonials = [
    {
      quote:
        'Integrating this into our AI pipeline has streamlined our model deployment process. It’s an indispensable tool for our research team.',
      name: 'Sarah Chen',
      designation: 'AI Research Scientist at DeepMind Lab',
      src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      quote:
        'The integration with decentralized infrastructure is seamless. It’s become core to our Web3 analytics stack.',
      name: 'Michael Rodriguez',
      designation: 'Blockchain Developer at ChainVerse Labs',
      src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      quote:
        'This has dramatically improved how we visualize large model training runs. The UI is intuitive and powerful for debugging and insights.',
      name: 'Emily Watson',
      designation: 'ML Ops Engineer at NeuralGrid AI',
      src: 'https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      quote:
        'We use this tool to orchestrate smart contract testing and on-chain simulations. It’s reliable and scales with our development.',
      name: 'James Kim',
      designation: 'Lead Solidity Engineer at DLT Labs',
      src: 'https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      quote:
        'The performance benchmarks in our AI inference engine saw a huge boost after adopting this. Perfect fit for scaling decentralized AI.',
      name: 'Lisa Thompson',
      designation: 'CTO at Synapse Protocol',
      src: 'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ]
  return <AnimatedTestimonials testimonials={testimonials} />
}

export { TestiMonials }
