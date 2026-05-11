import React from "react";
import { motion } from "framer-motion";
import { Car, Search } from "lucide-react";

// Apple-style empty state: subtle floating icon, soft glowing rings, fade-up text.
export default function EmptyState({
  title = "Nenhum veículo encontrado",
  subtitle = "Tente ajustar os filtros ou a busca.",
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-20 flex flex-col items-center justify-center text-center px-6"
    >
      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
        {/* Outer pulsing ring */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/5"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Mid pulsing ring */}
        <motion.div
          aria-hidden
          className="absolute inset-3 rounded-full bg-primary/5"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0.2, 0.8] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />

        {/* Floating icon disc */}
        <motion.div
          className="relative w-20 h-20 rounded-full bg-secondary flex items-center justify-center shadow-sm border border-border/50"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Car className="w-8 h-8 text-muted-foreground" strokeWidth={1.75} />

          {/* Tiny search badge */}
          <motion.div
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center shadow-sm"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 220, damping: 14 }}
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.25} />
          </motion.div>
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="font-display font-bold text-xl md:text-2xl tracking-tight"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-muted-foreground text-sm mt-1.5 max-w-xs"
      >
        {subtitle}
      </motion.p>
    </motion.div>
  );
}