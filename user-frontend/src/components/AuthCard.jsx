import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const cardVariants = {
  initial: (dir) => ({
    opacity: 0,
    x: dir * 60,
    scale: 0.98,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir * -60,
    scale: 0.98,
    transition: { duration: 1.2, ease: "easeIn" },
  }),
};

const AuthCard = ({ pageKey, direction, formSide, formPanel, bannerPanel }) => {
  const isLeft = formSide === "left";

  return (
    /* Page wrapper — full remaining height, centered */
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-10">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={pageKey}
          custom={direction}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row bg-white"
        >
          {/* Form side */}
          <div
            className={`w-full md:w-1/2 flex flex-col justify-center px-8 md:px-14 py-12 ${
              !isLeft ? "md:order-2" : ""
            }`}
          >
            {formPanel}
          </div>

          {/* Banner side */}
          <div
            className={`hidden md:flex w-1/2 ${!isLeft ? "md:order-1" : ""}`}
          >
            {bannerPanel}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AuthCard;
