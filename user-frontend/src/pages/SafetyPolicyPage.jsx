import React from "react";
import SEO from "../components/SEO";
import { AlertTriangle, Home, Info, Droplets } from "lucide-react";

const SafetyPolicyPage = () => {
  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="Safety Guidelines" description="Important safety instructions for handling our products." />
      
      <div className="py-10 md:py-16" style={{ background: "rgba(239,68,68,0.05)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
        <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading font-black text-3xl md:text-5xl text-white mb-4">
            Product Safety Guidelines
          </h1>
          <p className="text-red-700 font-medium">Celebrate safely. Please read carefully before handling any products.</p>
        </div>
      </div>

      <div className="w-full md:max-w-[70%] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg">Storage</h3>
            </div>
            <ul className="list-disc pl-5 text-gray-400 space-y-2 text-sm leading-relaxed">
              <li>Store products in a cool, dry place away from any sparks, open flames, or direct severe sunlight.</li>
              <li>Keep them out of reach of young children and pets.</li>
              <li>Never keep products loose in your pockets.</li>
            </ul>
          </div>

          <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-heading font-bold text-lg">Preparation</h3>
            </div>
            <ul className="list-disc pl-5 text-gray-400 space-y-2 text-sm leading-relaxed">
              <li>Always keep a bucket of water, sand, or a fire extinguisher nearby before using products.</li>
              <li>Wear cotton, well-fitted clothes. Avoid synthetic/loose garments.</li>
              <li>Always wear footwear when stepping out to use products.</li>
            </ul>
          </div>

        </div>

        <h2 className="font-heading font-bold text-2xl text-white mb-6 flex items-center gap-2">
          <Info className="w-6 h-6 text-primary" /> Best Practices While Lighting
        </h2>
        
        <div className="space-y-4 text-gray-300 leading-relaxed p-6 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
          <p><strong>1. Adult Supervision:</strong> Children should only handle our products under strict adult supervision.</p>
          <p><strong>2. Open Spaces:</strong> Only use products in open grounds. Never attempt to use products indoors, inside a vehicle, or near dry grass/leaves.</p>
          <p><strong>3. Distance:</strong> Maintain at least an arm's length distance when lighting the fuse. Move away instantly once the fuse catches fire.</p>
          <p><strong>4. Never Relight:</strong> If a product fails to go off (a dud), do not approach it immediately. Wait 15-20 minutes, then pour water over it. Never attempt to relight a dud.</p>
          <p><strong>5. Proper Supports:</strong> For outdoor products, use a sturdy, thick-walled bottle or a proper launching tube placed on flat ground facing away from buildings and trees.</p>
          <p><strong>6. One at a time:</strong> Light only one product at a time. Do not attempt to string them together unless they belong to a pre-strung "wala" package.</p>
          <p><strong>7. Disposal:</strong> Dispose of used products by sweeping them up and soaking them in a bucket of water before discarding them in the trash.</p>
        </div>

      </div>
    </div>
  );
};

export default SafetyPolicyPage;
