import React from 'react';
import { Filter } from 'lucide-react';
import clsx from 'clsx';

const FilterBar = ({ showBoughtItems, setShowBoughtItems, allTags, selectedFilterTags, toggleFilterTag }) => {
  return (
    <div className="backdrop-blur-lg bg-white/5 rounded-xl p-6 shadow-lg border border-white/10 transition-all duration-300">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-300" />
          <button
            onClick={() => setShowBoughtItems(!showBoughtItems)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
              showBoughtItems
                ? "bg-gradient-to-r from-emerald-400/20 to-blue-400/20 text-emerald-300 border border-emerald-400/30"
                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
            )}
          >
            {showBoughtItems ? 'Show All' : 'To Buy'}
          </button>
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleFilterTag(tag)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  selectedFilterTags.includes(tag)
                    ? "bg-gradient-to-r from-blue-400/20 to-purple-400/20 text-blue-300 border border-blue-400/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;