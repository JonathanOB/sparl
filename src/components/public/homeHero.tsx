import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const HomeHero = () => {
  return (
    <section id='Hero' aria-labelledby='hero-heading' className='relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden'>

        {/* Back Grid */}
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
    
        {/* Radial Glow */}
        <div aria-hidden="true" className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full opacity-20 bg-[radial-gradient(ellipse,_#00e5a0_0%,_transparent_65%)]'/>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 grid lg:grid-cols-[1fr_440px] gap-16 items-center">
            
            {/* Left Side */}
            <div className="">
                <div className="inline-flex items-center gap-2 px-3 py-1 5 rounded-full border border-[#1e2d42] bg-[#0b1220]">
                    <span className="w-1 5 h-1 5 rounded-full animate-pulse bg-[#00e5a0]" />
                    <span className="font-mono-data text-xs font-medium tracking-wide text-[#00e5a0]">
                        Monitoring Households Across Ireland
                    </span>
                </div>

                <h1 id="hero-heading" className='font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-[#e8f0ff] leading-[0.9] tracking-tight mb-6'>
                    <span>Every Subscription</span> <br />
                    <span className="text-[#00e5a0]">Every Saving.</span> <br />
                    <span>One Dashboard.</span>
                </h1>
                <div className="">
                    
                    <div className="grid grid-cols-3 pb-2">
                        <div className="flex items-center gap-2 px-3">
                            <Check className='text-[#00e5a0]' size={18}/>
                            <span>Broadband / Internet</span>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <Check className='text-[#00e5a0]' size={18}/>
                            <span>TV</span>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <Check className='text-[#00e5a0]' size={18}/>
                            <span>Mobile Phones</span>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <Check className='text-[#00e5a0]' size={18}/>
                            <span>Energy</span>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <Check className='text-[#00e5a0]' size={18}/>
                            <span>Mortgages</span>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                            <Check className='text-[#00e5a0]' size={18}/>
                            <span>Banking</span>
                        </div>
                    </div>
                    <p className="text-lg leading-relaxed max-w-xl mb-10 text-muted/50">
                        Sparl tracks your subscriptions - then alerts you the moment you can save money by switching provider. Designed and built for the Irish market.
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <Link href={'/sign-up'} className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00e5a0] text-[#04080f] font-semibold text-base hover:bg-[#00c98d] transition-all duration-200 green-glow'>
                            Start Saving For Free
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    </section>
  )
}

export default HomeHero