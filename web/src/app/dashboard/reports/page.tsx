"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, CalendarCheck, BedDouble, TrendingUp, Download } from 'lucide-react'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const revData = [38200, 42100, 48350, 45600, 52800, 49700, 55200, 51900, 58400, 54100, 61800, 48352]
const bookData = [210, 235, 284, 262, 305, 288, 325, 298, 340, 312, 355, 284]
const occData = [72, 76, 78.5, 74, 82, 79, 85, 81, 87, 83, 89, 78.5]

export default function ReportsPage() {
    const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

    const exportReport = () => {
        const header = 'Month,Revenue,Bookings,Occupancy'
        const rows = months.map((m, i) => `${m},$${revData[i]},${bookData[i]},${occData[i]}%`)
        const csv = [header, ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'hotel-report.csv'; a.click()
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Revenue, bookings, and occupancy analytics</p>
                </div>
                <div className="flex gap-2">
                    {(['monthly', 'quarterly', 'yearly'] as const).map(p => (
                        <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)} className="capitalize">{p}</Button>
                    ))}
                    <Button variant="outline" onClick={exportReport}><Download className="h-4 w-4 mr-2" /> Export</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: `$${(revData.reduce((a, b) => a + b, 0) / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10' },
                    { label: 'Total Bookings', value: bookData.reduce((a, b) => a + b, 0).toLocaleString(), icon: CalendarCheck, color: 'text-blue-600 bg-blue-500/10' },
                    { label: 'Avg Occupancy', value: `${(occData.reduce((a, b) => a + b, 0) / occData.length).toFixed(1)}%`, icon: BedDouble, color: 'text-violet-600 bg-violet-500/10' },
                    { label: 'Avg Rate', value: `$${Math.round(revData.reduce((a, b) => a + b, 0) / bookData.reduce((a, b) => a + b, 0))}`, icon: TrendingUp, color: 'text-amber-600 bg-amber-500/10' },
                ].map(s => (
                    <Card key={s.label}><CardContent className="p-4 flex items-center gap-3"><div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle>Revenue</CardTitle><CardDescription>Monthly revenue breakdown</CardDescription></CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-48">
                        {revData.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">${(val / 1000).toFixed(0)}K</span>
                                <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 hover:opacity-80 transition-all" style={{ height: `${(val / 65000) * 100}%` }} />
                                <span className="text-[10px] text-muted-foreground">{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Bookings</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-40">
                            {bookData.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${(val / 360) * 100}%` }} />
                                    <span className="text-[10px] text-muted-foreground">{months[i]}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Occupancy %</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-40">
                            {occData.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground">{val}%</span>
                                    <div className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400" style={{ height: `${val}%` }} />
                                    <span className="text-[10px] text-muted-foreground">{months[i]}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
