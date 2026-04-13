'use client'
import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

interface Category {
  id: string
  label: string
  color: string
}

export default function CategoryFilter({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState('')

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
      <button
        onClick={() => setActive('')}
        className={`chip ${active === '' ? 'active' : ''}`}
      >
        Todo
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => setActive(active === cat.id ? '' : cat.id)}
          className={`chip ${active === cat.id ? 'active' : ''}`}
          style={active === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
        >
          {cat.label}
        </button>
      ))}
      <button className="chip ml-auto flex-shrink-0">
        <SlidersHorizontal size={13} className="mr-1" />
        Filtrar
      </button>
    </div>
  )
}
