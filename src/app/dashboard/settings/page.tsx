'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail,
  Shield,
  Loader2,
  Camera
} from 'lucide-react'
import Image from 'next/image'

export default function SettingsPage() {
  const { data: session } = useSession()
  // Removed integrations and webhooks tabs - only keeping profile

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account profile</p>
        </div>

        {/* Profile Content */}
        <ProfileTab user={session?.user} />
      </div>
    </div>
  )
}

type SessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  avatar?: string | null
  role?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

interface ProfileResponse {
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    role: string
    createdAt: string
    updatedAt: string
  }
}

// Profile Tab Component
function ProfileTab({ user }: { user: SessionUser | null | undefined }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const toIsoString = (value?: string | Date) => {
    if (!value) {
      return new Date().toISOString()
    }
    return value instanceof Date ? value.toISOString() : value
  }

  const hasSessionUser = Boolean(user?.id)

  const { data: profileData, isFetching: isProfileFetching } = useQuery<ProfileResponse>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Failed to fetch user')
      return response.json()
    },
    enabled: hasSessionUser,
    staleTime: 5_000,
    placeholderData: hasSessionUser && user?.id
      ? {
          user: {
            id: user.id,
            name: user.name ?? null,
            email: user.email ?? '',
            avatar: user.avatar ?? null,
            role: user.role ?? 'VIEWER',
            createdAt: toIsoString(user.createdAt),
            updatedAt: toIsoString(user.updatedAt),
          },
        }
      : undefined,
  })

  const profile = profileData?.user

  const [name, setName] = useState(profile?.name ?? user?.name ?? '')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(profile?.avatar ?? user?.avatar ?? null)

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setPreview(profile.avatar ?? null)
    }
  }, [profile])

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update profile')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      alert('Profile updated successfully!')
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const previousPreview = preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setPreview(data.url)
      queryClient.invalidateQueries({ queryKey: ['session'] })
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    } catch (error) {
      console.error('Upload error:', error)
      setPreview(previousPreview ?? null)
      alert('Failed to upload avatar')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getInitials = () => {
    return name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  }

  if (!hasSessionUser) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600">No user session available.</p>
      </div>
    )
  }

  const createdAtSource = profile?.createdAt ?? user?.createdAt ?? null
  const createdAt = createdAtSource
    ? typeof createdAtSource === 'string'
      ? createdAtSource
      : createdAtSource.toISOString()
    : null
  const userId = profile?.id ?? user?.id ?? '—'
  const role = (profile?.role ?? user?.role ?? 'VIEWER').toString().toUpperCase()
  const formattedRole = role.charAt(0) + role.slice(1).toLowerCase()

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {preview ? (
              <Image
                src={preview}
                alt="Avatar"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {getInitials()}
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow-lg">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="text-black  hidden"
                disabled={uploading}
                ref={fileInputRef}
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Profile picture</p>
            <p className="text-sm text-gray-500 mb-2">
              JPG, PNG or GIF. Max size 5MB.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload new photo'}
            </button>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-black  w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={profile?.email || user?.email || ''}
                disabled
                className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-900 font-medium">
                {formattedRole}
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Active
              </span>
            </div>
          </div>

          <button
            onClick={() => updateProfile.mutate({ name })}
            disabled={
              updateProfile.isPending ||
              isProfileFetching ||
              !name.trim() ||
              name.trim() === (profile?.name ?? '')
            }
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Account Created */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Account created</span>
            <span className="text-gray-900 font-medium">
              {createdAt
                ? new Date(createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">User ID</span>
            <span className="text-gray-900 font-mono text-xs break-all">{userId}</span>
          </div>
          {isProfileFetching && (
            <div className="text-xs text-gray-500">
              <Loader2 className="h-3 w-3 inline-block mr-1 animate-spin" />
              Syncing latest profile…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


