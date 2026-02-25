"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Send, Edit2, Trash2, Hotel, Loader2 } from 'lucide-react'

interface ReviewData {
    id: string; hotel: string; date: string; rating: number
    comment: string; response: string | null
}

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    className={`h-5 w-5 cursor-pointer transition-colors ${i <= rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`}
                    onClick={() => onChange?.(i)}
                />
            ))}
        </div>
    )
}

export default function GuestReviewsPage() {
    const [reviews, setReviews] = useState<ReviewData[]>([])
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [newRating, setNewRating] = useState(5)
    const [newComment, setNewComment] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editComment, setEditComment] = useState('')

    useEffect(() => { fetchReviews() }, [])

    const fetchReviews = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/reviews')
            if (!res.ok) { setLoading(false); return }
            const { reviews: data } = await res.json()
            if (data) {
                setReviews(data.map((r: Record<string, unknown>) => ({
                    id: r.id as string,
                    hotel: (r.hotels as { name?: string })?.name || 'Hotel',
                    date: (r.created_at as string)?.split('T')[0] || '',
                    rating: r.rating as number,
                    comment: r.comment as string || '',
                    response: r.response as string || null,
                })))
            }
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (!newComment) { alert('Please write a review.'); return }
        setSubmitting(true)
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: newRating, comment: newComment }),
            })
            if (res.ok) {
                await fetchReviews()
                setNewRating(5); setNewComment(''); setShowNew(false)
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to submit review')
            }
        } catch (err) { console.error(err); alert('Failed to submit review') }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this review?')) return
        try {
            const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' })
            if (res.ok) setReviews(reviews.filter(r => r.id !== id))
        } catch (err) { console.error(err) }
    }

    const handleSaveEdit = async (id: string) => {
        try {
            const res = await fetch('/api/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, comment: editComment }),
            })
            if (res.ok) {
                setReviews(reviews.map(r => r.id === id ? { ...r, comment: editComment } : r))
                setEditingId(null)
            }
        } catch (err) { console.error(err) }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64 animate-fade-in"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading reviews...</span></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Reviews</h1>
                    <p className="text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                </div>
                <Button onClick={() => setShowNew(!showNew)}>
                    <Send className="h-4 w-4 mr-2" /> Write Review
                </Button>
            </div>

            {showNew && (
                <Card className="border-primary/20">
                    <CardHeader><CardTitle>Write a Review</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium block mb-1.5">Rating</label>
                            <StarRating rating={newRating} onChange={setNewRating} />
                        </div>
                        <textarea
                            className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Share your experience..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                Submit Review
                            </Button>
                            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {reviews.length === 0 ? (
                <Card><CardContent className="p-12 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No reviews yet</h3>
                    <p className="text-muted-foreground mb-4">Share your experience after your stay!</p>
                    <Button onClick={() => setShowNew(true)}><Send className="h-4 w-4 mr-2" />Write a Review</Button>
                </CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <Card key={review.id}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Hotel className="h-4 w-4 text-primary" />
                                            {review.hotel}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <StarRating rating={review.rating} />
                                            <span className="text-sm text-muted-foreground">{review.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(review.id); setEditComment(review.comment) }}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(review.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {editingId === review.id ? (
                                    <div className="mt-3 space-y-2">
                                        <textarea
                                            className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            value={editComment}
                                            onChange={(e) => setEditComment(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleSaveEdit(review.id)}>Save</Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm">{review.comment}</p>
                                )}
                                {review.response && (
                                    <div className="mt-3 p-3 rounded-lg bg-muted text-sm">
                                        <p className="font-medium text-xs mb-1">Hotel Response:</p>
                                        {review.response}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
