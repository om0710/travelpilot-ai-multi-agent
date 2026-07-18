import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';
import type { Hotel } from '../types';

interface HotelCardProps {
  hotels: Hotel[];
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotels }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {hotels.map((hotel) => (
        <motion.div
          key={hotel.id}
          whileHover={{ y: -3 }}
          className="bg-white/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/40 dark:border-slate-800/30 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-500/20 dark:hover:border-brand-500/20 transition-all duration-300 flex flex-col"
        >
          {/* Hotel Image & Rating badge */}
          <div className="h-44 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={hotel.image}
              alt={hotel.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
            {/* Rating badge */}
            <div className="absolute top-4 right-4 py-1.5 px-2.5 bg-white/95 dark:bg-slate-900/95 rounded-full flex items-center space-x-1 shadow-sm border border-slate-100/50 dark:border-slate-800/30">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {hotel.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Hotel Info */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Name & Location */}
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {hotel.name}
              </h4>
              <div className="flex items-center space-x-1 text-slate-400 mt-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{hotel.location}</span>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {hotel.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] py-1 px-2.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg text-slate-500 dark:text-slate-400 font-semibold"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {/* Price & Booking CTA */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-4 mt-5">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Price per night
                </p>
                <p className="text-lg font-extrabold text-slate-850 dark:text-slate-105 text-brand-600 dark:text-brand-400 mt-0.5">
                  {hotel.price}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4.5 py-2.5 bg-gradient-to-r from-brand-600 to-sky-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-600/10 hover:shadow-brand-600/20 transition-all outline-none"
              >
                Book Room
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
