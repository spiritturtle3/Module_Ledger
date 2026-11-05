/* eslint-disable */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Github, Sparkles, ShoppingCart } from 'lucide-react'
import { containerVariants, fadeInUp, itemVariants } from '@/utils/motion'
import { AnimatedModalDemo } from '@/components/nft-update'
import { DevnetAlert } from '@/components/devnet-alert'
import { TestiMonials } from '@/components/ui/testimonial'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="relative z-10">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative flex items-center justify-center overflow-hidden py-24"
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 20%, rgba(80,0,255,0.15) 0%, transparent 70%)',
              zIndex: 0,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          />
          <div className="absolute w-80 h-80 bg-white/10 rounded-full blur-3xl top-[-6rem] left-[-6rem] animated-blob" />
          <div className="absolute w-72 h-72 bg-white/5 rounded-full blur-2xl bottom-[-6rem] right-[-6rem] animated-blob" />
          <div className="container mx-auto px-4 z-10">
            <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto">
              <motion.h1
                className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-white drop-shadow-lg font-sans animated-gradient-text"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                The decentralized marketplace for AI models
              </motion.h1>
              <motion.p
                className="text-2xl mb-8 font-semibold tracking-tight font-mono text-white drop-shadow-lg"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Discover, share, and own verifiable AI models through a Solana-native marketplace.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link href="/marketplace">
                  <Button
                    size="lg"
                    className="cursor-pointer group bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-black font-bold shadow-lg hover:scale-105 transition-transform"
                  >
                    Start exploring <Sparkles className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button
                    size="lg"
                    variant="outline"
                    className="cursor-pointer group border-[#a18cd1] text-white hover:bg-[#a18cd1]/10 hover:scale-105 transition-transform"
                  >
                    Explore models{' '}
                    <ShoppingCart className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="py-20 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute w-96 h-96 bg-gradient-to-r from-[#a18cd1]/20 to-[#fbc2eb]/20 rounded-full blur-3xl top-0 left-0 animated-blob" />
            <div className="absolute w-80 h-80 bg-gradient-to-l from-[#fbc2eb]/15 to-[#a18cd1]/15 rounded-full blur-2xl bottom-0 right-0 animated-blob" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                From model files to verifiable ownership
              </h2>
              <h3 className="text-2xl md:text-4xl font-bold text-white">In Just Three Steps</h3>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              <motion.div variants={itemVariants} whileHover={{ y: -10, scale: 1.02 }} className="relative group">
                <div className="bg-gradient-to-br from-[#18192a]/90 to-[#1a1b2e]/90 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl h-full">
                  <div className="mb-6">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-black font-bold rounded-full text-sm">
                      Step 1
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-white mb-4">Upload</h3>
                    <p className="text-gray-300 text-lg mb-6">
                      Upload your model package <span className="text-primary font-semibold">directly</span> and prepare
                      it for on-chain ownership.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#a18cd1] rounded-full"></div>
                      <span>Support any framework</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#a18cd1] rounded-full"></div>
                      <span>Secure file-handling through encrypted data transfer</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#a18cd1] rounded-full"></div>
                      <span>Clear validation before minting</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-sm">Upload your model package</span>
                      <span className="text-gray-500 text-xs">Cancel</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-gray-300 text-sm">AI_Model_v2.py</span>
                      <span className="text-gray-500 text-xs ml-auto">2.1MB</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} whileHover={{ y: -10, scale: 1.02 }} className="relative group">
                <div className="bg-gradient-to-br from-[#18192a]/90 to-[#1a1b2e]/90 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl h-full">
                  <div className="mb-6">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-black font-bold rounded-full text-sm">
                      Step 2
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-white mb-4">Build</h3>
                    <p className="text-gray-300 text-lg mb-6">
                      <span className="text-[#fbc2eb] font-semibold">Escape from package and version hell!</span> The
                      build box is like having a team of 10 ML engineers at your disposal.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#fbc2eb] rounded-full"></div>
                      <span>Model version and framework details</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#fbc2eb] rounded-full"></div>
                      <span>Built-in GPU/CUDA compatibility</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#fbc2eb] rounded-full"></div>
                      <span>Input-output validation and field mapping</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-sm">Python Project Settings</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                        <span className="text-blue-300 text-sm">main.py</span>
                      </div>
                      <div className="p-2 bg-green-600/10 rounded-lg border border-green-500/20">
                        <span className="text-green-300 text-xs">✓ Build config ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} whileHover={{ y: -10, scale: 1.02 }} className="relative group">
                <div className="bg-gradient-to-br from-[#18192a]/90 to-[#1a1b2e]/90 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl h-full">
                  <div className="mb-6">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-black font-bold rounded-full text-sm">
                      Step 3
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-white mb-4">Prepare metadata</h3>
                    <p className="text-gray-300 text-lg mb-6">
                      Prepare your AI model for{' '}
                      <span className="text-[#a18cd1] font-semibold">decentralized marketplace</span> and start earning
                      from your innovations.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#a18cd1] rounded-full"></div>
                      <span>Instant global distribution</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#a18cd1] rounded-full"></div>
                      <span>Automated scaling and load balancing</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-[#a18cd1] rounded-full"></div>
                      <span>License and attribution preferences</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-2">What does your model represent?</h4>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-300 text-sm">Ready to mint as an AI model NFT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div variants={fadeInUp} className="text-center mt-16">
              <Link href="/marketplace">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-black font-bold shadow-lg hover:scale-105 transition-transform px-8 py-3"
                >
                  Prepare a model{' '}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>
        {/* Why Choose Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="py-20 relative"
        >
          {/* Subtle animated background blobs */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute w-72 h-72 bg-white/10 rounded-full blur-3xl top-0 left-1/4 animated-blob" />
            <div className="absolute w-60 h-60 bg-white/5 rounded-full blur-2xl bottom-0 right-1/4 animated-blob" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-center mb-14 tracking-tight">
              Why ModuLedger?
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  title: 'Decentralized & Trustless',
                  description:
                    'No middlemen. All transactions and ownership are secured on-chain, ensuring transparency and true model ownership.',
                  icon: '🛡️',
                  glow: 'from-white to-gray-300',
                },
                {
                  title: 'Built for model creators',
                  description:
                    'Monetize your AI expertise. List, license, and sell your models directly to a global audience of developers and businesses.',
                  icon: '🧑‍💻',
                  glow: 'from-white to-gray-400',
                },
                {
                  title: 'Portable model metadata',
                  description:
                    'Join a vibrant, open-source community. Discover, fork, and improve models together—fueling the next wave of AI innovation.',
                  icon: '🌐',
                  glow: 'from-white to-gray-500',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.07, boxShadow: '0 0 32px 8px #a18cd1' }}
                  className={cn(
                    'relative p-8 rounded-2xl bg-[#18192a]/80 border border-[#23243a] shadow-xl transition-all overflow-hidden group',
                    'before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300',
                    'hover:before:opacity-100',
                  )}
                  style={{
                    boxShadow: `0 4px 32px 0 rgba(161,140,209,0.10)`,
                  }}
                >
                  {/* Subtle white/gray glow on hover, plus a dark overlay for contrast */}
                  <div
                    className={cn(
                      'absolute inset-0 rounded-2xl pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(200,200,200,0.08))',
                      filter: 'blur(16px)',
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none z-10 opacity-0 group-hover:opacity-80 transition-opacity duration-300"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                  />
                  <div className="relative z-20 flex flex-col items-center">
                    <span className="text-5xl mb-4 animate-float">{feature.icon}</span>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-center">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="py-16 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(161,140,209,0.15) 0%, transparent 70%)',
              zIndex: 0,
            }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
              Powering the Future of{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb]">
                AI Model Ownership
              </span>
            </motion.h2>
          </div>
        </motion.section>

        {/* Wave Divider */}
        <div className="relative h-24 overflow-hidden">
          <div className="absolute w-full h-24 opacity-10">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a18cd1" />
                  <stop offset="100%" stopColor="#fbc2eb" />
                </linearGradient>
              </defs>
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                fill="url(#gradient)"
              ></path>
            </svg>
          </div>
        </div>

        {/* Partners Marquee Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="py-12 bg-[#0a0a0a]/80 overflow-hidden"
        >
          <div className="container mx-auto px-4 mb-8">
            <h3 className="text-xl text-center text-gray-400 mb-8 font-medium">A clearer layer for AI ownership</h3>
          </div>

          {/* Infinite Marquee */}
          <div className="relative flex overflow-x-hidden opacity-60">
            <div className="animate-marquee whitespace-nowrap flex items-center">
              {[
                { name: 'Solana', icon: '◎' },
                { name: 'AlchemyAPI', icon: '⚗️' },
                { name: 'Arweave', icon: '🧵' },
                { name: 'OpenSea', icon: '🌊' },
                { name: 'Chainlink', icon: '⛓️' },
                { name: 'Metaplex', icon: '🖼️' },
                { name: 'Phantom', icon: '👻' },
                { name: 'Audius', icon: '🎵' },
                { name: 'Magic Eden', icon: '✨' },
                { name: 'Tensor', icon: '🔢' },
              ].map((partner, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5, scale: 1.1 }}
                  className="flex items-center mx-8 bg-[#18192a]/30 backdrop-blur-sm px-6 py-3 rounded-full border border-white/5"
                  style={{
                    boxShadow: '0 4px 20px rgba(161,140,209,0.08)',
                  }}
                >
                  <span className="text-2xl mr-3">{partner.icon}</span>
                  <span className="text-gray-400 text-xl font-bold">{partner.name}</span>
                </motion.div>
              ))}
            </div>

            <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center">
              {[
                { name: 'Solana', icon: '◎' },
                { name: 'AlchemyAPI', icon: '⚗️' },
                { name: 'Arweave', icon: '🧵' },
                { name: 'OpenSea', icon: '🌊' },
                { name: 'Chainlink', icon: '⛓️' },
                { name: 'Metaplex', icon: '🖼️' },
                { name: 'Phantom', icon: '👻' },
                { name: 'Audius', icon: '🎵' },
                { name: 'Magic Eden', icon: '✨' },
                { name: 'Tensor', icon: '🔢' },
              ].map((partner, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5, scale: 1.1 }}
                  className="flex items-center mx-8 bg-[#18192a]/30 backdrop-blur-sm px-6 py-3 rounded-full border border-white/5"
                  style={{
                    boxShadow: '0 4px 20px rgba(161,140,209,0.08)',
                  }}
                >
                  <span className="text-2xl mr-3">{partner.icon}</span>
                  <span className="text-gray-400 text-xl font-bold">{partner.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="py-20"
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Creating?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of creators and collectors in our AI-powered NFT marketplace. Start creating unique
                digital art today!
              </p>
              <Link href="/marketplace">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb] text-black font-bold shadow-lg hover:scale-105 transition-transform"
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Enhanced Footer - Full Width */}
        <motion.footer
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full bg-gradient-to-b from-[#111] to-black border-t border-white/10 pt-16 pb-8"
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
              {/* Logo & About */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl animate-float drop-shadow-lg">🪐</span>
                  <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent font-mono drop-shadow-lg">
                    ModuLedger
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  ModuLedger helps creators package, publish, and establish verifiable ownership for AI models on Solana.
                </p>
                <div className="flex space-x-4 pt-2">
                  <a
                    href="https://github.com/spiritturtle3/Module_Ledger"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#a18cd1] transition-colors"
                  >
                    <Github size={20} />
                  </a>
                  <a
                    href="https://github.com/spiritturtle3/Module_Ledger"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#a18cd1] transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2914a.077.077 0 01-.0066.1277c-.598.3517-1.2195.6536-1.8732.8913a.076.076 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/spiritturtle3/Module_Ledger"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#a18cd1] transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-white">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">
                      Marketplace
                    </Link>
                  </li>
                  <li>
                    <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">
                      Create model NFT
                    </Link>
                  </li>
                  <li>
                    <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">
                      My collection
                    </Link>
                  </li>
                  <li>
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                      How it works
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-white">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="https://github.com/spiritturtle3/Module_Ledger" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                      Project repository
                    </a>
                  </li>
                  <li>
                    <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">
                      Minting workspace
                    </Link>
                  </li>
                  <li>
                    <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">
                      Model listings
                    </Link>
                  </li>
                  <li>
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                      Platform overview
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Us */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-white">Contact Us</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-1">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>Solana devnet</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>Wallet-native access</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>On-chain model ownership</span>
                  </li>
                  <li className="mt-4">
                    <Button variant="outline" className="border-[#a18cd1] hover:bg-[#a18cd1]/10">
                      Get in Touch
                    </Button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-8 mt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} ModuLedger. Built for verifiable AI model ownership.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="text-gray-500 text-sm hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-500 text-sm hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="text-gray-500 text-sm hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}
