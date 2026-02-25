import React from "react";

const AuthBanner = ({
  title,
  subtitle,
  align = "left",
  tagline = "V Crackers",
  tags = [],
  bgImage,
}) => {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ minHeight: "100%" }}
    >
      {/* Photo layer */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${bgImage}')` }}
        />
      )}

      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(140deg, #8b0000 0%, #ff6600ff 50%, #ffcc33 100%)",
        }}
      />
      {/* Abstract circles */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-black/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

      {/* Sparkle dots */}
      {[
        { top: "15%", left: "12%", size: 6 },
        { top: "35%", right: "10%", size: 4 },
        { bottom: "25%", left: "20%", size: 5 },
        { bottom: "15%", right: "25%", size: 3 },
        { top: "60%", left: "8%", size: 4 },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/40"
          style={{
            width: dot.size,
            height: dot.size,
            top: dot.top,
            left: dot.left,
            right: dot.right,
            bottom: dot.bottom,
          }}
        />
      ))}

      {/* Content — all centered */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8 py-10 text-white gap-5">
        {/* Logo */}
        <img
          src="/v-crackers-logo.png"
          alt="V Crackers"
          className="h-32 w-auto object-contain brightness-0 invert opacity-90"
        />

        {/* Divider */}
        <div className="w-10 h-1 rounded-full bg-white/60" />

        {/* Main copy */}
        <div className="flex flex-col items-center">
          {tagline && (
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-3">
              {tagline}
            </p>
          )}
          <h2 className="font-heading font-black text-3xl xl:text-4xl leading-tight mb-3">
            {title}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-[220px]">
            {subtitle}
          </p>

          {tags.length > 0 && (
            <div className="flex gap-3 mt-5 flex-wrap justify-center">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-xs font-semibold text-white/60 bg-white/10 rounded-full px-3 py-1"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthBanner;
