import React from 'react';
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, trend, trendUp, color = "red" }) {
  const colorClasses = {
    red: {
      bg: "from-red-500 to-red-600",
      light: "bg-red-50",
      text: "text-red-600"
    },
    blue: {
      bg: "from-blue-500 to-blue-600",
      light: "bg-blue-50",
      text: "text-blue-600"
    },
    green: {
      bg: "from-green-500 to-green-600",
      light: "bg-green-50",
      text: "text-green-600"
    },
    orange: {
      bg: "from-orange-500 to-orange-600",
      light: "bg-orange-50",
      text: "text-orange-600"
    },
    purple: {
      bg: "from-purple-500 to-purple-600",
      light: "bg-purple-50",
      text: "text-purple-600"
    }
  };

  const selectedColor = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-10">
          <div className={`w-full h-full rounded-full bg-gradient-to-br ${selectedColor.bg}`}></div>
        </div>
        
        <div className="relative p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${selectedColor.light} shadow-sm`}>
              <Icon className={`w-6 h-6 ${selectedColor.text}`} />
            </div>
          </div>
          
          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? '↑' : '↓'} {trend}
              </span>
              <span className="text-xs text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}