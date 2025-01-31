import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import {
  Briefcase,
  Award,
  MapPin,
  DollarSign,
  Edit2,
  Save,
  Star,
  Calendar,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  provider_profiles?: {
    skills: string[] | null;
    experience: string | null;
    hourly_rate: number | null;
    is_verified: boolean;
    rating: number;
    total_reviews: number;
  };
}

export function ProviderProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    skills: [] as string[],
    experience: '',
    hourly_rate: 0,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          provider_profiles(*)
        `)
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        skills: data.provider_profiles?.skills || [],
        experience: data.provider_profiles?.experience || '',
        hourly_rate: data.provider_profiles?.hourly_rate || 0,
      });
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('provider_profiles')
        .upsert({
          id: user.id,
          skills: formData.skills,
          experience: formData.experience,
          hourly_rate: formData.hourly_rate,
        });

      if (error) throw error;

      await loadProfile();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-dark-border flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Perfil Profissional
        </h2>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              <span>Editar</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Basic Info */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <Briefcase className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {profile.full_name}
            </h3>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  {profile.provider_profiles?.rating.toFixed(1)} ({profile.provider_profiles?.total_reviews} avaliações)
                </span>
              </div>
              {profile.provider_profiles?.is_verified && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                  Verificado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Mail className="w-4 h-4" />
            <span>{profile.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <DollarSign className="w-4 h-4" />
            {isEditing ? (
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: Number(e.target.value) }))}
                className="px-3 py-1 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg"
                min="0"
                step="0.01"
              />
            ) : (
              <span>R$ {profile.provider_profiles?.hourly_rate?.toFixed(2)}/hora</span>
            )}
          </div>
        </div>

        {/* Skills */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Habilidades
          </h4>
          {isEditing ? (
            <input
              type="text"
              value={formData.skills.join(', ')}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg"
              placeholder="Digite as habilidades separadas por vírgula"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.provider_profiles?.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Experience */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Experiência
          </h4>
          {isEditing ? (
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg"
              rows={4}
              placeholder="Descreva sua experiência profissional"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              {profile.provider_profiles?.experience || 'Nenhuma experiência cadastrada'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}