"use client";
import { topNavItems } from "@/constants/navItems";
import { Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export default function Navbar() {
    const [isOpen, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24)
        window.addEventListener('scroll', onScroll)
    }, [])

    return (
        <header role="banner" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg[#04080f]/90 backdrop-blurxl border-b border-[#1e2d42]' : ''}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <nav aria-label="Main Navigation" className="flex items-center justify-between h-16">

                    {/* Logo Section */}
                    <Link href="/" aria-label="Sparl Home" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#00e5a0] flex items-center justify-center green-glow-sm">
                            <Sparkles size={16} className="text-[#04080f]" />
                        </div>
                        <span className="font-display font-bold text-xl text-[#e8foff] tracking-light">SPARL</span>
                    </Link>

                    {/* DESKTOP */}
                    <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
                        {topNavItems.map((item) => (
                            <li key={item.name}>
                                <Link href={item.href} className="text-sm font-medium text-[#6b7a99] hover:text-[#e8f0ff] transition-colors duration-200">
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Auth / User Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login" className="text-sm font-medium text-[#6b7a99] hover:text-[#e8f0ff] transition colors duration-200">
                            Log In
                        </Link>
                        <Link href="/signup" className="px-4 py-2 rounded-lg bg-[#00e5a0] text-[#04080f] text-sm font-semibold hover:bg-[#00c98d] transition-colors duration-200 green-glow-sm">
                            Sign Up
                        </Link>
                    </div>

                    {/* Mobile Menu */}
                    <Button 
                        aria-label={isOpen ? "Close Menu": "Open Menu"}
                        aria-expanded={isOpen}
                        aria-controls="mobile-nav"
                        className="md:hidden w-8 h-8 text-[#6b7a99] hover:text-[#e8f0ff] transition-colors duration-200 bg-[#00e5a0]"
                        onClick={() => setOpen(!isOpen)}
                    >
                        {isOpen ? (
                            <X size={22} className="text-black" />
                        ) : (
                            <Menu size={22} className="text-black" />
                        )}
                    </Button>
                </nav>
            </div>

            {/* Mobile Menu Content */}
            {isOpen && (
                <div className="md:hidden border-t border-[#1e2d42] bg-[#04080f]/95 backdrop-blur-xl">
                    <ul className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1 list-none m-0 p-0">
                        {topNavItems.map((item) => (
                            <li key={item.name}>
                                <Link href={item.href} className="block py-2.5 text-sm font-medium text-[#6b7a99] hover:text-[#e8f0ff] transition-colors" onClick={() => setOpen(false)}>
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            
            )}
        </header>
    )
}