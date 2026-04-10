import { motion } from 'framer-motion';

export default function Stat({ icon: Icon, label, value, color = 'text-accent', delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-surface border border-rule rounded-sm px-4 md:px-5 py-4 md:py-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.5} />
        <span className="text-[9px] md:text-[10px] font-mono text-ink-faint tracking-widest uppercase">{label}</span>
      </div>
      <p className="text-[24px] md:text-[28px] lg:text-[32px] font-serif text-ink truncate" title={value}>{value}</p>
    </motion.div>
  );
}
