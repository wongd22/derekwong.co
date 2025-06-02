import React from 'react';
import { Edit2, Trash2, Check } from 'lucide-react';
import clsx from 'clsx';

const ShoppingList = ({ items, onItemClick, onDeleteItem, onToggleBought }) => {
  return (
    <div className="backdrop-blur-lg bg-white/5 rounded-xl p-6 shadow-lg border border-white/10 transition-all duration-300">
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center p-8 text-gray-400 italic">
            No items found. Add some items to your shopping list!
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={clsx(
                "flex items-center justify-between p-4 backdrop-blur-sm bg-gradient-to-r rounded-xl transition-all duration-300 border border-white/5 shadow-md",
                item.isBought 
                  ? "from-gray-800/40 to-gray-800/40 opacity-60" 
                  : "from-gray-800/60 to-gray-700/60 hover:from-gray-700/60 hover:to-gray-600/60"
              )}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggleBought(item)}
                  className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                    item.isBought 
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-md" 
                      : "border-2 border-white/20 hover:border-white/40"
                  )}
                >
                  {item.isBought && <Check className="w-4 h-4 text-white" />}
                </button>
                <div className="flex items-center gap-3">
                  {item.imageUrl && (
                    <div className="relative h-12 w-12 rounded-md overflow-hidden shrink-0">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-lg font-medium",
                        item.isBought 
                          ? "line-through text-gray-400" 
                          : "text-white"
                      )}>
                        {item.name}
                      </span>
                    </div>
                    {item.location && (
                      <p className="text-sm text-gray-400 mt-1">{item.location}</p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-white/5 text-gray-300 rounded-md text-xs border border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onItemClick(item)}
                  className="p-2 text-gray-400 hover:text-blue-300 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ShoppingList;