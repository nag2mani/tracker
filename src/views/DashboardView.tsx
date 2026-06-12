import { motion } from "framer-motion";
import { AnalyticsCard } from "../components/dashboard/AnalyticsCard";
import { HeroTotalCard } from "../components/dashboard/HeroTotalCard";
import { NetBalanceCard } from "../components/dashboard/NetBalanceCard";
import { RecentActivity } from "../components/dashboard/RecentActivity";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 26, stiffness: 260 },
  },
};

export function DashboardView({ onSettleUp }: { onSettleUp: () => void }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 lg:grid-cols-6"
    >
      <motion.div variants={item} className="lg:col-span-3">
        <HeroTotalCard />
      </motion.div>
      <motion.div variants={item} className="lg:col-span-3">
        <NetBalanceCard onSettleUp={onSettleUp} />
      </motion.div>
      <motion.div variants={item} className="lg:col-span-2">
        <AnalyticsCard />
      </motion.div>
      <motion.div variants={item} className="lg:col-span-4">
        <RecentActivity />
      </motion.div>
    </motion.div>
  );
}
