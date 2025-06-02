import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const AddItemForm = ({ onAddItem }) => {
  const [newItem, setNewItem] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    onAddItem(newItem);
    setNewItem('');
  };

  return (
    <div className="backdrop-blur-lg bg-white/5 rounded-xl p-6 shadow-lg border border-white/10 transition-all duration-300">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item..."
          className="flex-1 bg-gray-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
        />
        <button
          type="submit"
          className="shrink-0 bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-4 py-3 rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default AddItemForm;