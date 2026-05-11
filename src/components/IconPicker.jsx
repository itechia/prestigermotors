import React from "react";
import {
  ShieldCheck, RotateCcw, FileCheck, Check, Star, Clock, Truck, Heart, CreditCard
} from "lucide-react";

// Small set of icons that admins can pick from for marketing blocks.
const ICONS = {
  shield: ShieldCheck,
  rotate: RotateCcw,
  file: FileCheck,
  check: Check,
  star: Star,
  clock: Clock,
  truck: Truck,
  heart: Heart,
  "credit-card": CreditCard,
};

export function IconFromName({ name, className = "w-5 h-5", strokeWidth = 2 }) {
  const Icon = ICONS[name] || ShieldCheck;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export default ICONS;