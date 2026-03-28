"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/research/header'

interface Lead {
  email: string
  firstName: string
  lastName: string
  company: string
  companySize: string
  title: string
  country: string
  reportId: string
  reportTitle: string
  timestamp: string
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchLeads = async (key: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/research/submit-lead?key=${key}`)
      
      if (!response.ok) {
        throw new Error('Unauthorized or failed to fetch leads')
      }
      
      const data = await response.json()
      setLeads(data.leads || [])
      setIsAuthenticated(true)
      
      // Store key in sessionStorage for convenience
      sessionStorage.setItem('admin_key', key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if key is stored in session
    const storedKey = sessionStorage.getItem('admin_key')
    if (storedKey) {
      setAdminKey(storedKey)
      fetchLeads(storedKey)
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLeads(adminKey)
  }

  const downloadCSV = () => {
    const headers = ['Timestamp', 'First Name', 'Last Name', 'Email', 'Company', 'Company Size', 'Title', 'Country', 'Report ID', 'Report Title']
    const rows = leads.map(lead => [
      new Date(lead.timestamp).toLocaleString(),
      lead.firstName,
      lead.lastName,
      lead.email,
      lead.company,
      lead.companySize,
      lead.title,
      lead.country,
      lead.reportId,
      lead.reportTitle
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-muted/30 border border-border rounded-lg p-8">
            <h1 className="text-3xl font-degular font-bold text-foreground mb-6">
              Admin Access
            </h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-degular font-semibold text-foreground mb-2">
                  Admin Key
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  className="w-full px-4 py-3 border border-input rounded bg-background text-foreground placeholder:text-black/40-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-degular font-medium rounded hover:bg-primary/90 transition-colors"
              >
                Access Leads
              </button>
            </form>
            <p className="font-['Geist',sans-serif] text-sm text-black/40-foreground mt-4">
              Default key: zavis_admin_2025
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-degular font-bold text-foreground mb-2">
              Lead Management
            </h1>
            <p className="text-black/40-foreground">
              Total Leads: <span className="text-primary font-semibold">{leads.length}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={downloadCSV}
              disabled={leads.length === 0}
              className="px-6 py-3 bg-primary text-white font-degular font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download CSV
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin_key')
                setIsAuthenticated(false)
              }}
              className="px-6 py-3 border border-border text-foreground font-degular font-medium rounded hover:bg-muted transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-black/40-foreground">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-black/40-foreground text-lg">No leads collected yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-degular font-semibold text-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-degular font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-degular font-semibold text-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-degular font-semibold text-foreground">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-degular font-semibold text-foreground">Size</th>
                  <th className="px-4 py-3 text-left text-sm font-degular font-semibold text-foreground">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-degular font-semibold text-foreground">Country</th>
                  <th className="px-4 py-3 text-left text-sm font-degular font-semibold text-foreground">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead, index) => (
                  <tr key={index} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {new Date(lead.timestamp).toLocaleDateString()}
                      <br />
                      <span className="font-['Geist',sans-serif] text-xs text-black/40-foreground">
                        {new Date(lead.timestamp).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{lead.company}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{lead.companySize}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{lead.title}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{lead.country}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <a 
                        href={`/research/${lead.reportId}`}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {lead.reportTitle}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
