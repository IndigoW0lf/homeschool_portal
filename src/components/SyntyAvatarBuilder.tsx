'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { SyntyAvatarPreview } from '@/components/SyntyAvatarPreview';
import { ItemDesignRow } from '@/types/design-studio';

interface SyntyAvatarBuilderProps {
  kidId: string;
  kidName: string;
  initialTextureUrl?: string; // Currently equipped texture
  savedDesigns: ItemDesignRow[]; // Saved "template-synty" designs
}

export function SyntyAvatarBuilder({ 
  kidId, 
  kidName, 
  initialTextureUrl, 
  savedDesigns 
}: SyntyAvatarBuilderProps) {
  const router = useRouter();
  const [selectedTextureUrl, setSelectedTextureUrl] = useState<string | undefined>(initialTextureUrl);
  const [selectedDesignId, setSelectedDesignId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectDesign = (design: ItemDesignRow) => {
    if (design.texture_url) {
      setSelectedTextureUrl(design.texture_url);
      setSelectedDesignId(design.id);
    }
  };

  const handleSave = async () => {
    if (!selectedDesignId) {
      toast.error("Please select a design first!");
      return;
    }

    setIsSaving(true);
    try {
      // Save the selected design ID to the kid's profile
      // We'll treat this as the "outfit" in avatar_state
      const response = await fetch(`/api/kids/${kidId}/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          avatarState: {
            // We preserve existing state structure but update outfit
            outfit: `custom:${selectedDesignId}`,
            // We could also store the texture URL directly if needed, but ID is better
            last_updated: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      toast.success('Avatar updated! 🌟');
      router.refresh();
    } catch (error) {
      console.error('Failed to save avatar:', error);
      toast.error('Failed to save avatar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Avatar Builder
          </h1>
          <Link
            href={`/kids/${kidId}/studio`}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
          >
            🎨 Design New Outfit
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: 3D Preview */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-gray-100 dark:border-gray-700 shadow-inner">
              <SyntyAvatarPreview 
                kidId={kidId} 
                textureUrl={selectedTextureUrl}
                // Determine skin color if we want to support it later
                skinColor="#f2d3b1"
              />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
              {kidName}'s Avatar
            </p>
          </div>

          {/* Right Column: Wardrobe */}
          <div className="flex flex-col h-full">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span>👕</span> Your Wardrobe
            </h2>
            
            {savedDesigns.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't designed any outfits yet!
                </p>
                <Link
                  href={`/kids/${kidId}/studio`}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Go to Design Studio
                </Link>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* Default/None Option */}
                  <button
                    onClick={() => {
                      setSelectedTextureUrl(undefined);
                      setSelectedDesignId(undefined);
                    }}
                    className={`aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      selectedTextureUrl === undefined
                        ? 'border-[var(--ember-500)] bg-[var(--paper-100)]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                      👤
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Basic</span>
                  </button>

                  {/* Saved Designs */}
                  {savedDesigns.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => handleSelectDesign(design)}
                      className={`aspect-square rounded-lg border-2 p-2 relative group transition-all ${
                        selectedTextureUrl === design.texture_url
                          ? 'border-[var(--ember-500)] bg-[var(--paper-100)]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {design.texture_url ? (
                        <img 
                          src={design.texture_url} 
                          alt={design.name}
                          className="w-full h-full object-contain rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                          ?
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-center backdrop-blur-sm rounded-b-md">
                        <p className="text-xs text-white truncate px-1">
                          {design.name || 'Untitled'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <Link
                href={`/kids/${kidId}`}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving || selectedTextureUrl === initialTextureUrl}
                className="flex-1 py-3 px-4 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Avatar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
