'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface AvatarUploadProps {
  currentAvatar?: string | null
  userName?: string | null
  onUploadSuccess: (avatarUrl: string) => void
}

export function AvatarUpload({ currentAvatar, userName, onUploadSuccess }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentAvatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      onUploadSuccess(data.avatarUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const getInitials = () => {
    return userName
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Avatar Display */}
        {preview ? (
          <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image
              src={preview}
              alt="Avatar"
              width={96}
              height={96}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
            {getInitials()}
          </div>
        )}

        {/* Upload Button Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="text-black hidden"
        />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Click camera icon to change
      </p>
    </div>
  )
}