import Navbar from "@/components/nav/navbar";
import HomeHero from "@/components/public/homeHero";

export default function Home() {
  return (
    <div className="h-[200vh]">
      <Navbar />
      <HomeHero />
    </div>
  );
}
