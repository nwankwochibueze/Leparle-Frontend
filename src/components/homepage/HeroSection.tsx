import { motion } from "framer-motion";
import type { HeroBlock } from "../../types/homepage";

interface HeroSectionProps {
  hero: HeroBlock;
}

const HeroSection: React.FC<HeroSectionProps> = ({ hero }) => {
  const imageUrl = hero.heroImage?.[0]?.src;

  return (
    <section className="relative w-full h-screen overflow-hidden -mt-[45px] left-0 right-0">
      {/* Background image with focal-point centering */}
      {imageUrl && (
        <div
          className="
            absolute inset-0 bg-cover bg-no-repeat
            bg-[position:50%_70%] md:bg-[position:50%_50%]
            scale-105 transition-transform duration-[7000ms] ease-out hover:scale-100
          "
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      {/* Transparent overlay for navbar blend */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/30" />

      {/* Content - Full width container */}
      <div className="absolute inset-0 z-10 flex items-center justify-center md:items-end md:justify-center text-center pt-[110px]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="px-6 pb-12 md:pb-12 max-w-xl"
        >
          <h1 className="text-white text-4xl md:text-6xl font-semibold leading-tight">
            {hero.headline}
          </h1>
          <p className="text-white/85 mt-4 text-base md:text-lg">
            {hero.subtext}
          </p>
          <button className="mt-8 inline-block border border-white text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-white hover:text-black transition">
            Shop Collection
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
