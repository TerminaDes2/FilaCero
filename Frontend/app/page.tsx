import Navbar from "../src/components/navbar";
import { Hero } from "../src/components/landing/Hero";
import { Features } from "../src/components/landing/Features";
import { Process } from "../src/components/landing/Process";
import { Benefits } from "../src/components/landing/Benefits";
import { Pricing } from "../src/components/landing/Pricing";
import { Testimonials } from "../src/components/landing/Testimonials";
import { CTA } from "../src/components/landing/CTA";
import { FAQ } from "../src/components/landing/FAQ";
import { Footer } from "../src/components/landing/Footer";

export const metadata = {
    title: "FilaCero - Plataforma para Cafeterías Escolares",
    description: "Gestiona productos, inventario y ventas con una plataforma moderna y rápida. Reduce filas y toma decisiones con datos.",
    openGraph: {
        title: "FilaCero - Gestión de Cafeterías Escolares",
        description: "Control de productos, ventas e inventario en un solo lugar.",
        url: "https://tusitio.com",
        siteName: "FilaCero",
        images: [
            { url: "/LogoFilaCero.svg", width: 512, height: 512, alt: "FilaCero" }
        ],
        locale: "es_ES",
        type: "website"
    }
};

export default function Landing() {
    return (
        <div className="relative min-h-screen flex flex-col bg-[var(--fc-surface-base)] text-[var(--fc-text-primary)] transition-colors">
            <Navbar />
            <main className="flex-1" role="main">
                <Hero />
                <Features />
                <Process />
                <Benefits />
                <Testimonials />
                <Pricing />
                <FAQ />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}
