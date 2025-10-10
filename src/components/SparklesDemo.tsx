import { SparklesCore } from "@/components/ui/sparkles";
import { useTheme } from "../context/ThemeContext";

export function SparklesDemo() {
  const { theme } = useTheme();
  
  return (
    <div className={`h-[40rem] w-full flex flex-col items-center justify-center overflow-hidden rounded-md ${
      theme === 'dark' ? 'bg-black' : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      <h1 className={`md:text-7xl text-3xl lg:text-9xl font-bold text-center relative z-20 ${
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      }`}>
        UDS Simulator
      </h1>
      <div className="w-[40rem] h-40 relative">
        {/* Gradients */}
        <div className={`absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm`} />
        <div className={`absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4`} />
        <div className={`absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm`} />
        <div className={`absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4`} />

        {/* Core component */}
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor={theme === 'dark' ? '#FFFFFF' : '#3B82F6'}
        />

        {/* Radial Gradient to prevent sharp edges */}
        <div className={`absolute inset-0 w-full h-full ${
          theme === 'dark' 
            ? 'bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]'
            : 'bg-gradient-to-br from-slate-50 to-blue-50 [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]'
        }`}></div>
      </div>
    </div>
  );
}

// Alternative: Sparkles with custom background
export function SparklesBackground() {
  const { theme } = useTheme();
  
  return (
    <div className={`h-[20rem] relative w-full flex flex-col items-center justify-center overflow-hidden rounded-md ${
      theme === 'dark' ? 'bg-slate-950' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor={theme === 'dark' ? '#FFFFFF' : '#3B82F6'}
        />
      </div>
      <h1 className={`md:text-7xl text-3xl lg:text-6xl font-bold text-center relative z-20 ${
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      }`}>
        Build with Aceternity
      </h1>
    </div>
  );
}

// Compact version for use in cards or smaller areas
export function SparklesCompact() {
  const { theme } = useTheme();
  
  return (
    <div className={`h-[15rem] relative w-full flex items-center justify-center overflow-hidden rounded-lg ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-blue-100 to-indigo-200'
    }`}>
      <SparklesCore
        background="transparent"
        minSize={0.4}
        maxSize={1}
        particleDensity={800}
        className="w-full h-full"
        particleColor={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
        speed={2}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className={`text-2xl font-semibold z-20 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Sparkles Effect
        </p>
      </div>
    </div>
  );
}
