import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const ProfileContext = createContext();

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState({
        id: null,
        username: '',
        name: '',
        email: '',
        profile_image: null,
        bio: '',
        is_active: true,
        created_at: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await authAPI.getProfile();
            setProfile({
                id: data.id,
                username: data.username,
                name: data.username, // Use username as name for display
                email: data.email,
                profile_image: data.profile_image,
                bio: data.bio || '',
                is_active: data.is_active,
                created_at: data.created_at
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError(error.message || 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (profileData) => {
        try {
            setError('');
            setSuccess('');
            const updatedData = await authAPI.updateProfile(profileData);
            setSuccess('Profile updated successfully!');
            // Refetch profile to get updated data
            fetchProfile();
            return updatedData;
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message || 'Failed to update profile');
            setSuccess('');
            throw error;
        }
    };

    // Fetch profile on component mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const value = {
        profile,
        loading,
        error,
        success,
        fetchProfile,
        updateProfile
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export default ProfileContext;
