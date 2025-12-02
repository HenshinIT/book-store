"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

export default function HomeSearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounce search
  useEffect(() => {
    if (!isFocused) return

    const timeout = setTimeout(() => {
      fetchBooks()
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, minPrice, maxPrice, isFocused])

  async function fetchBooks() {
    const params = new URLSearchParams()

    if (query.trim()) params.append("q", query)
    if (minPrice) params.append("minPrice", minPrice)
    if (maxPrice) params.append("maxPrice", maxPrice)

    setLoading(true)
    const res = await fetch(`/api/search-books?${params.toString()}`)
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  // 4 nút lọc nhanh
  function quickFilter(min: number | null, max: number | null) {
    setMinPrice(min ? String(min) : "")
    setMaxPrice(max ? String(max) : "")
    setIsFocused(true)
  }

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto relative mb-14">

      {/* Search Input */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder="Tìm kiếm sách theo tên, tác giả hoặc danh mục..."
        className="
          w-full px-6 py-4 rounded-2xl shadow-xl border border-gray-200 text-lg
          text-gray-900 font-semibold placeholder:text-gray-400
          focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 
          outline-none transition-all
        "
      />

      {/* PRICE RANGE FILTER */}
      {isFocused && (
        <>
          <div className="flex gap-3 mt-4">
            <input
              type="number"
              placeholder="Giá từ..."
              value={minPrice}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 
              focus:ring-2 focus:ring-indigo-400 outline-none text-gray-700"
            />

            <input
              type="number"
              placeholder="Đến..."
              value={maxPrice}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 
              focus:ring-2 focus:ring-indigo-400 outline-none text-gray-700"
            />
          </div>

          {/* QUICK FILTER BUTTONS – bản siêu đẹp */}
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: "< 50.000đ", min: null, max: 50000 },
              { label: "50k – 100k", min: 50000, max: 100000 },
              { label: "100k – 200k", min: 100000, max: 200000 },
              { label: "> 200k", min: 200000, max: null },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => quickFilter(btn.min, btn.max)}
                onFocus={() => setIsFocused(true)}
                className="
                  px-4 py-2 text-sm 
                  font-semibold 
                  bg-indigo-100 text-indigo-700 
                  hover:bg-indigo-200 
                  rounded-full shadow-sm 
                  transition-all
                "
              >
                {btn.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Loading Spinner */}
      {loading && isFocused && (
        <div className="absolute right-4 top-4 animate-spin text-indigo-600">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}

      {/* RESULTS */}
      {isFocused && results.length > 0 && (
        <div className="absolute w-full bg-white mt-3 rounded-2xl shadow-2xl border border-gray-100 
        z-50 max-h-96 overflow-y-auto p-3">

          {results.map((book: any) => (
            <Link
              href={`/books/${book.id}`}
              key={book.id}
              onClick={() => setIsFocused(false)}
              className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              <img
                src={book.thumbnail?.url || "/placeholder-book.svg"}
                className="w-14 h-20 object-cover rounded-md shadow"
              />

              <div className="flex-1">
                <p className="font-semibold text-gray-900">{book.title}</p>
                <p className="text-sm text-gray-600">{book.author?.name}</p>
                <p className="text-sm text-gray-500">
                  Danh mục: {book.category?.name}
                </p>
                <p className="text-indigo-600 font-bold mt-1">
                  {book.price.toLocaleString("vi-VN")}₫
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
