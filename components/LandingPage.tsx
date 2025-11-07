'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LandingPage() {
  const [showNotification, setShowNotification] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-indigo-600 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-3xl font-bold">C</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Banner Image */}
      <div className="relative h-56 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
        </div>
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="text-center text-white">
            <div className="text-5xl mb-3">🎯</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome to Clue</h1>
            <p className="text-lg text-indigo-100">Earn rewards through referrals and daily check-ins</p>
          </div>
        </div>
      </div>

      {/* Notification Bar */}
      {showNotification && (
        <div className="bg-indigo-100 border-b border-indigo-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-indigo-700 text-sm">🔔 Welcome! Start earning rewards today</span>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ✕
          </button>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Wallet Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Wallet</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/register"
              className="bg-gradient-to-br from-pink-400 via-pink-500 to-orange-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white text-center"
            >
              <div className="text-5xl mb-3">💳</div>
              <div className="font-bold text-lg">RECHARGE</div>
              <div className="text-sm mt-1 opacity-90">Add funds</div>
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white text-center"
            >
              <div className="text-5xl mb-3">📤</div>
              <div className="font-bold text-lg">WITHDRAW</div>
              <div className="text-sm mt-1 opacity-90">Cash out</div>
            </Link>
          </div>
        </section>

        {/* Service Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Service</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/register"
              className="bg-white border-2 border-indigo-300 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-center"
            >
              <div className="text-5xl mb-3">✅</div>
              <div className="font-bold text-gray-800 text-lg">Daily Check-in</div>
              <div className="text-sm text-indigo-600 mt-1 font-medium">Earn 100+ RWF daily</div>
            </Link>
            <Link
              href="/register"
              className="bg-white border-2 border-indigo-300 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-center"
            >
              <div className="text-5xl mb-3">👥</div>
              <div className="font-bold text-gray-800 text-lg">Referrals</div>
              <div className="text-sm text-indigo-600 mt-1 font-medium">Earn bonus rewards</div>
            </Link>
          </div>
        </section>

        {/* Interactive Cards */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/register"
              className="bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-white relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 text-2xl">🎁</div>
              <div className="font-bold text-lg mt-4">Redeem Bonus Code</div>
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-br from-blue-400 to-orange-400 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-white relative overflow-hidden"
            >
              <div className="absolute bottom-2 right-2 text-3xl">🎉</div>
              <div className="font-bold text-lg">Team Activities</div>
            </Link>
          </div>
        </section>

        {/* Company/Platform Profile */}
        <section className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">About Clue</h2>
          <div className="aspect-video bg-gradient-to-br from-indigo-200 to-indigo-400 rounded-xl mb-4 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">🌱</div>
              <div className="text-xl font-semibold">Growing Together</div>
            </div>
          </div>
          <div className="space-y-3 text-gray-700">
            <p className="font-semibold text-lg">Clue - Your Referral Rewards Platform</p>
            <p>
              Clue is a modern rewards platform designed to help you earn through referrals and daily engagement. 
              We believe in rewarding our community members for their participation and for bringing others into our ecosystem.
            </p>
            <p>
              With Clue, you can earn daily rewards just by checking in, and boost your earnings by referring friends. 
              The more people you refer, the more you earn!
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-8 text-center text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-indigo-100 mb-6 text-lg">
            Join thousands of members earning rewards every day
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-md"
            >
              Sign Up Free
            </Link>
            <Link
              href="/login"
              className="bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-400 transition-colors shadow-md"
            >
              Sign In
            </Link>
          </div>
        </section>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-100 shadow-2xl z-50">
        <nav className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-1 py-3">
            <Link
              href="/"
              className="flex flex-col items-center justify-center py-2 text-indigo-600 rounded-lg"
            >
              <div className="text-3xl mb-1">🏠</div>
              <span className="text-xs font-semibold">Home</span>
            </Link>
            <Link
              href="/register"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">💼</div>
              <span className="text-xs font-semibold">Invest</span>
            </Link>
            <Link
              href="/register"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">👥</div>
              <span className="text-xs font-semibold">Team</span>
            </Link>
            <Link
              href="/login"
              className="flex flex-col items-center justify-center py-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
            >
              <div className="text-3xl mb-1">👤</div>
              <span className="text-xs font-semibold">Me</span>
            </Link>
          </div>
        </nav>
      </footer>

      {/* Spacer for fixed footer */}
      <div className="h-20"></div>
    </div>
  )
}

