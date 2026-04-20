"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression'
import { supabase } from "@/lib/supabaseclient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2 } from "lucide-react"
import ProtectedRoute from "@/components/auth/protected-route"

export default function CreateItemPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const uploadImage = async (file: File) => {
        // Compression options
        const options = {
            maxWidthOrHeight: 800, // Doubled from 400 for better details view quality
            useWebWorker: true,
            fileType: 'image/webp' as const,
            initialQuality: 0.85
        }

        try {
            // Compress and convert to WebP
            const compressedFile = await imageCompression(file, options)
            const fileName = `${crypto.randomUUID()}.webp`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('items')
                .upload(filePath, compressedFile, {
                    contentType: 'image/webp'
                })

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from('items').getPublicUrl(filePath)
            return data.publicUrl
        } catch (error) {
            console.error('Error compressing image:', error)
            throw error
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!name) throw new Error("Name is required")

            let imageUrl = ""
            if (file) {
                imageUrl = await uploadImage(file)
            }

            const { data: { user } } = await supabase.auth.getUser()

            const { error: insertError } = await supabase
                .from('items')
                .insert({
                    name,
                    description,
                    image_url: imageUrl || null, // Ensure null if empty string
                    status: 'inStock',
                    created_by: user?.id
                })

            if (insertError) throw insertError

            router.push('/dashboard')
            router.refresh()
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background p-4 pt-12 mt-12">
                <div className="max-w-md mx-auto bg-card rounded-xl shadow-sm border p-6">
                    <div className="mb-6">
                        <h1 className="text-xl font-bold">Create New Item</h1>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. MacBook Pro M1"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Describe the item..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">Image</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    id="image"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                {file ? (
                                    <div className="text-center">
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">Click to change</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="text-sm">Click to upload image</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Item"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    )
}
