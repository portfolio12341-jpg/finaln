'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import {
  User, Settings, Award, Layers, MessageSquare,
  Trash2, Plus, Edit, Save, ArrowRight, Eye,
  BookOpen, Image as ImageIcon, CheckCircle, AlertCircle
} from 'lucide-react';
import { DatabaseSchema, Education, Experience, Blog, GalleryItem, Certificate, ContactMessage, Milestone } from '@/lib/db';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'identity' | 'resume' | 'blogs' | 'gallery' | 'arrange'>('overview');
  const [db, setDb] = useState<DatabaseSchema | null>(null);

  // Success/Error notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modal / Editing States
  const [editingEdu, setEditingEdu] = useState<Partial<Education> | null>(null);
  const [editingExp, setEditingExp] = useState<Partial<Experience> | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Partial<Milestone> | null>(null);
  const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newCsSkill, setNewCsSkill] = useState('');
  const [newLawSkill, setNewLawSkill] = useState('');
  const [newProSkill, setNewProSkill] = useState('');
  const [newLang, setNewLang] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  // Gallery Form State
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<'moot' | 'court' | 'college' | 'event' | 'other'>('moot');

  // Certificate Form State
  const [certUrls, setCertUrls] = useState<string[]>([]);
  const [certUrlInput, setCertUrlInput] = useState('');
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');

  // Upload state
  const [uploading, setUploading] = useState<string | null>(null); // tracks which field is uploading

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        setDb(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading database:', err);
        showNotification('error', 'Failed to load content database.');
        setLoading(false);
      });
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const publishChanges = async (updatedDb: DatabaseSchema) => {
    setSaving(true);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDb),
      });
      if (res.ok) {
        setDb(updatedDb);
        showNotification('success', 'Changes published instantly!');
      } else {
        const data = await res.json();
        showNotification('error', data.error || 'Failed to save changes.');
      }
    } catch (err) {
      console.error('Save error:', err);
      showNotification('error', 'Network error. Failed to publish.');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldType: 'profilePhoto' | 'resumePdf' | 'gallery' | 'certificate' | 'blog') => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setUploading(fieldType);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        if (fieldType === 'profilePhoto') {
          const next = {
            ...db,
            personal: { ...db.personal, profilePhoto: data.url }
          };
          publishChanges(next);
        } else if (fieldType === 'resumePdf') {
          const next = {
            ...db,
            personal: { ...db.personal, resumePdf: data.url }
          };
          publishChanges(next);
        } else {
          showNotification('success', `File uploaded successfully: ${data.url}`);
          if (fieldType === 'gallery') {
            setGalleryUrls(prev => [...prev, data.url]);
          } else if (fieldType === 'certificate') {
            setCertUrls(prev => [...prev, data.url]);
          } else if (fieldType === 'blog') {
            if (editingBlog) {
              const currentUrls = editingBlog.urls || [];
              setEditingBlog({
                ...editingBlog,
                urls: [...currentUrls, data.url]
              });
            }
          }
          // Set in modal states if needed, or save to copy clipboard
          if (navigator.clipboard) {
            navigator.clipboard.writeText(data.url);
            showNotification('success', 'File URL copied to clipboard!');
          }
        }
      } else {
        showNotification('error', data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showNotification('error', 'Upload failed due to network error.');
    } finally {
      setUploading(null);
    }
  };

  // Message Operations
  const handleToggleMessageRead = (msgId: string) => {
    if (!db) return;
    const next = {
      ...db,
      messages: db.messages.map(m => m.id === msgId ? { ...m, read: !m.read } : m)
    };
    publishChanges(next);
  };

  const handleDeleteMessage = (msgId: string) => {
    if (!db) return;
    if (!confirm('Are you sure you want to delete this message?')) return;
    const next = {
      ...db,
      messages: db.messages.filter(m => m.id !== msgId)
    };
    publishChanges(next);
  };

  // Identity Form submit
  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    publishChanges(db);
  };

  // Add/Edit Education
  const handleSaveEdu = () => {
    if (!db || !editingEdu) return;
    let nextEduList = [...db.education];
    if (editingEdu.id) {
      nextEduList = nextEduList.map(e => e.id === editingEdu.id ? (editingEdu as Education) : e);
    } else {
      const newId = `edu-${Date.now()}`;
      nextEduList.push({ ...(editingEdu as Education), id: newId });
    }
    publishChanges({ ...db, education: nextEduList });
    setEditingEdu(null);
  };

  // Add/Edit Experience
  const handleSaveExp = () => {
    if (!db || !editingExp) return;
    let nextExpList = [...db.experience];
    if (editingExp.id) {
      nextExpList = nextExpList.map(e => e.id === editingExp.id ? (editingExp as Experience) : e);
    } else {
      const newId = `exp-${Date.now()}`;
      nextExpList.push({ ...(editingExp as Experience), id: newId });
    }
    publishChanges({ ...db, experience: nextExpList });
    setEditingExp(null);
  };

  // Add/Edit Blog
  const handleSaveBlog = () => {
    if (!db || !editingBlog) return;
    let nextBlogList = [...db.blogs];
    if (editingBlog.id) {
      nextBlogList = nextBlogList.map(b => b.id === editingBlog.id ? (editingBlog as Blog) : b);
    } else {
      const newId = `blog-${Date.now()}`;
      const newBlog: Blog = {
        id: newId,
        title: editingBlog.title || 'Untitled',
        category: editingBlog.category || 'General',
        summary: editingBlog.summary || '',
        content: editingBlog.content || '',
        publishDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        readTime: editingBlog.readTime || '3 min read',
        urls: editingBlog.urls || []
      };
      nextBlogList.push(newBlog);
    }
    publishChanges({ ...db, blogs: nextBlogList });
    setEditingBlog(null);
  };

  // Generic Deletion
  const handleDeleteItem = (type: 'education' | 'experience' | 'blogs' | 'gallery' | 'certificates' | 'milestones', id: string) => {
    if (!db) return;
    if (!confirm(`Are you sure you want to delete this ${type} item?`)) return;
    const next = {
      ...db,
      [type]: (db[type] as any[]).filter(item => item.id !== id)
    };
    publishChanges(next);
  };

  // Add/Edit Milestone
  const handleSaveMilestone = () => {
    if (!db || !editingMilestone) return;
    let nextMilestones = [...(db.milestones || [])];
    if (editingMilestone.id) {
      nextMilestones = nextMilestones.map(m => m.id === editingMilestone.id ? (editingMilestone as Milestone) : m);
    } else {
      const newId = `mile-${Date.now()}`;
      nextMilestones.push({ ...(editingMilestone as Milestone), id: newId });
    }
    publishChanges({ ...db, milestones: nextMilestones });
    setEditingMilestone(null);
  };

  // SkillsGroup additions
  const handleAddCsSkill = () => {
    if (!newCsSkill.trim() || !db) return;
    const currentGroup = db.skillsGroup || { cs: [], law: [], pro: [] };
    const currentCs = currentGroup.cs || [];
    if (currentCs.includes(newCsSkill.trim())) return;
    const next = {
      ...db,
      skillsGroup: {
        ...currentGroup,
        cs: [...currentCs, newCsSkill.trim()]
      }
    };
    publishChanges(next);
    setNewCsSkill('');
  };

  const handleRemoveCsSkill = (skill: string) => {
    if (!db) return;
    const currentGroup = db.skillsGroup || { cs: [], law: [], pro: [] };
    const currentCs = currentGroup.cs || [];
    const next = {
      ...db,
      skillsGroup: {
        ...currentGroup,
        cs: currentCs.filter(s => s !== skill)
      }
    };
    publishChanges(next);
  };

  // Law Skills
  const handleAddLawSkill = () => {
    if (!newLawSkill.trim() || !db) return;
    const currentGroup = db.skillsGroup || { cs: [], law: [], pro: [] };
    const currentLaw = currentGroup.law || [];
    if (currentLaw.includes(newLawSkill.trim())) return;
    const next = {
      ...db,
      skillsGroup: {
        ...currentGroup,
        law: [...currentLaw, newLawSkill.trim()]
      }
    };
    publishChanges(next);
    setNewLawSkill('');
  };

  const handleRemoveLawSkill = (skill: string) => {
    if (!db) return;
    const currentGroup = db.skillsGroup || { cs: [], law: [], pro: [] };
    const currentLaw = currentGroup.law || [];
    const next = {
      ...db,
      skillsGroup: {
        ...currentGroup,
        law: currentLaw.filter(s => s !== skill)
      }
    };
    publishChanges(next);
  };

  // Pro Skills
  const handleAddProSkill = () => {
    if (!newProSkill.trim() || !db) return;
    const currentGroup = db.skillsGroup || { cs: [], law: [], pro: [] };
    const currentPro = currentGroup.pro || [];
    if (currentPro.includes(newProSkill.trim())) return;
    const next = {
      ...db,
      skillsGroup: {
        ...currentGroup,
        pro: [...currentPro, newProSkill.trim()]
      }
    };
    publishChanges(next);
    setNewProSkill('');
  };

  const handleRemoveProSkill = (skill: string) => {
    if (!db) return;
    const currentGroup = db.skillsGroup || { cs: [], law: [], pro: [] };
    const currentPro = currentGroup.pro || [];
    const next = {
      ...db,
      skillsGroup: {
        ...currentGroup,
        pro: currentPro.filter(s => s !== skill)
      }
    };
    publishChanges(next);
  };

  // Skills additions
  const handleAddSkill = () => {
    if (!newSkill.trim() || !db) return;
    if (db.skills.includes(newSkill.trim())) return;
    const next = { ...db, skills: [...db.skills, newSkill.trim()] };
    publishChanges(next);
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    if (!db) return;
    const next = { ...db, skills: db.skills.filter(s => s !== skill) };
    publishChanges(next);
  };

  // Gallery uploads
  const handleAddGalleryItem = (urls: string[], title: string, category: GalleryItem['category']) => {
    if (!db) return;
    const newItem: GalleryItem = {
      id: `gal-${Date.now()}`,
      title,
      url: urls[0] || '',
      urls: urls,
      category,
      uploadDate: new Date().toLocaleDateString()
    };
    publishChanges({ ...db, gallery: [...db.gallery, newItem] });
  };

  // Certificate additions
  const handleAddCertificate = (name: string, issuer: string, date: string, urls: string[]) => {
    if (!db) return;
    const newItem: Certificate = {
      id: `cert-${Date.now()}`,
      name,
      issuer,
      date,
      url: urls[0] || '',
      urls: urls
    };
    publishChanges({ ...db, certificates: [...db.certificates, newItem] });
  };

  if (loading || !db) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-[#0b0908]">
        <div className="w-8 h-8 rounded-full border border-gold border-t-transparent animate-spin mb-4" />
        <span className="text-xxs uppercase tracking-widest text-gold">Loading control console...</span>
      </div>
    );
  }

  const unreadMessages = db.messages.filter(m => !m.read).length;

  return (
    <div className="min-h-screen relative pb-16 admin-bg-blur">
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Admin Dashboard input readability overrides */
        .admin-bg-blur {
          background-color: rgba(4, 2, 18, 0.98) !important;
          backdrop-filter: blur(40px) !important;
        }
        .glass-card, .glass-panel {
          background-color: rgba(9, 7, 24, 0.98) !important;
          backdrop-filter: blur(25px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .glass-card input, 
        .glass-card textarea, 
        .glass-card select,
        .p-5 input,
        .p-5 select,
        .p-5 textarea,
        .space-y-4 input,
        .space-y-4 textarea,
        .space-y-4 select {
          background-color: #05040e !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          color: #ffffff !important;
          opacity: 1 !important;
        }
        .glass-card input:focus, 
        .glass-card textarea:focus, 
        .glass-card select:focus,
        .p-5 input:focus,
        .p-5 select:focus,
        .p-5 textarea:focus,
        .space-y-4 input:focus,
        .space-y-4 textarea:focus,
        .space-y-4 select:focus {
          border-color: #d4af37 !important;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.2) !important;
          outline: none !important;
        }
      `}} />
      <Header isAdmin={true} />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-5 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-bounce ${notification.type === 'success'
          ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
          : 'bg-red-950/80 border-red-500/30 text-red-300'
          }`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-xs font-mono font-semibold uppercase tracking-wider">{notification.text}</span>
        </div>
      )}

      {/* Ambient background bloom */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-royal-blue/5 blur-[130px] animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gold/5 blur-[130px] animate-pulse-slow" />
      </div>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-32 space-y-8">
        {/* Dashboard Title Banner */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-deep-blue/40 border border-white/5 p-6 rounded-2xl glass-panel relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wide text-white flex items-center space-x-2">
              <span>Secure Command Center</span>
              <span className="px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 text-xxs font-normal">v1.0.0</span>
            </h1>
            <p className="text-xxs text-gray-500 font-mono mt-1 uppercase tracking-widest">
              Directly publishing updates for Nancy Soni Portfolio
            </p>
          </div>
          {saving && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20 text-xs font-mono">
              <div className="w-3.5 h-3.5 border-2 border-gold border-t-transparent animate-spin rounded-full" />
              <span>Syncing Database...</span>
            </div>
          )}
        </section>

        {/* Console layout */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Panel */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-3 rounded-xl font-mono text-xs font-semibold tracking-wider flex items-center justify-between transition-all border ${activeTab === 'overview'
                ? 'bg-gold/10 text-gold border-gold/20 shadow-lg shadow-gold/5'
                : 'text-gray-400 hover:text-white hover:bg-white/3 border-transparent'
                }`}
            >
              <span className="flex items-center space-x-3">
                <MessageSquare className="w-4 h-4" />
                <span>Overview & Messages</span>
              </span>
              {unreadMessages > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gold text-white text-xxs font-bold animate-pulse">
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('identity')}
              className={`w-full text-left px-4 py-3 rounded-xl font-mono text-xs font-semibold tracking-wider flex items-center space-x-3 transition-all border ${activeTab === 'identity'
                ? 'bg-gold/10 text-gold border-gold/20 shadow-lg shadow-gold/5'
                : 'text-gray-400 hover:text-white hover:bg-white/3 border-transparent'
                }`}
            >
              <User className="w-4 h-4" />
              <span>Identity & SEO</span>
            </button>

            <button
              onClick={() => setActiveTab('resume')}
              className={`w-full text-left px-4 py-3 rounded-xl font-mono text-xs font-semibold tracking-wider flex items-center space-x-3 transition-all border ${activeTab === 'resume'
                ? 'bg-gold/10 text-gold border-gold/20 shadow-lg shadow-gold/5'
                : 'text-gray-400 hover:text-white hover:bg-white/3 border-transparent'
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>Resume & Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('blogs')}
              className={`w-full text-left px-4 py-3 rounded-xl font-mono text-xs font-semibold tracking-wider flex items-center space-x-3 transition-all border ${activeTab === 'blogs'
                ? 'bg-gold/10 text-gold border-gold/20 shadow-lg shadow-gold/5'
                : 'text-gray-400 hover:text-white hover:bg-white/3 border-transparent'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Blog Articles</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`w-full text-left px-4 py-3 rounded-xl font-mono text-xs font-semibold tracking-wider flex items-center space-x-3 transition-all border ${activeTab === 'gallery'
                ? 'bg-gold/10 text-gold border-gold/20 shadow-lg shadow-gold/5'
                : 'text-gray-400 hover:text-white hover:bg-white/3 border-transparent'
                }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Gallery & Certificates</span>
            </button>

            <button
              onClick={() => setActiveTab('arrange')}
              className={`w-full text-left px-4 py-3 rounded-xl font-mono text-xs font-semibold tracking-wider flex items-center space-x-3 transition-all border ${activeTab === 'arrange'
                ? 'bg-gold/10 text-gold border-gold/20 shadow-lg shadow-gold/5'
                : 'text-gray-400 hover:text-white hover:bg-white/3 border-transparent'
                }`}
            >
              <Settings className="w-4 h-4" />
              <span>Arrange Website</span>
            </button>
          </div>

          {/* Configuration Form Card */}
          <div className="lg:col-span-3">

            {/* TAB 1: OVERVIEW & INCOMING MESSAGES */}
            {activeTab === 'overview' && (
              <div className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono border-b border-white/5 pb-3">
                    Overview Statistics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 font-mono">
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-center">
                      <span className="block text-xxs text-gray-500 uppercase tracking-widest">Blogs</span>
                      <span className="text-xl font-bold text-white mt-1 block">{db.blogs.length}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-center">
                      <span className="block text-xxs text-gray-500 uppercase tracking-widest">Gallery Items</span>
                      <span className="text-xl font-bold text-white mt-1 block">{db.gallery.length}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-center">
                      <span className="block text-xxs text-gray-500 uppercase tracking-widest">Certificates</span>
                      <span className="text-xl font-bold text-white mt-1 block">{db.certificates.length}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-center">
                      <span className="block text-xxs text-gray-500 uppercase tracking-widest">Inbox Messages</span>
                      <span className={`text-xl font-bold mt-1 block ${unreadMessages > 0 ? 'text-gold' : 'text-gray-400'}`}>
                        {db.messages.length} ({unreadMessages} unread)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center justify-between">
                    <span>Inbox Messages ({db.messages.length})</span>
                  </h3>

                  {db.messages.length === 0 ? (
                    <div className="p-8 rounded-xl bg-white/2 border border-dashed border-white/10 text-center font-mono text-xs text-gray-500">
                      No incoming messages received yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {db.messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-xl border font-sans text-xs relative ${msg.read ? 'bg-white/2 border-white/5 opacity-70' : 'bg-gold/5 border-gold/20'
                            }`}
                        >
                          {!msg.read && (
                            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gold animate-pulse" />
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xxs font-mono text-gray-500 mb-2">
                            <span className="font-bold text-gray-300">{msg.name}</span>
                            <span>&lt;{msg.email}&gt;</span>
                            <span>•</span>
                            <span>{msg.date}</span>
                          </div>
                          <h4 className="font-bold text-white text-xs mb-1 font-mono">{msg.subject}</h4>
                          <p className="text-gray-300 leading-relaxed font-sans">{msg.message}</p>

                          <div className="flex items-center space-x-3 mt-4 font-mono text-xxs">
                            <button
                              onClick={() => handleToggleMessageRead(msg.id)}
                              className="text-gold hover:text-gold font-semibold cursor-pointer"
                            >
                              {msg.read ? 'Mark Unread' : 'Mark Read'}
                            </button>
                            <span className="text-white/10">|</span>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: IDENTITY & SEO */}
            {activeTab === 'identity' && (
              <form onSubmit={handleIdentitySubmit} className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
                <h3 className="text-sm font-bold text-white font-mono border-b border-white/5 pb-3">
                  Identity Core Memory
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Display Name</label>
                    <input
                      id="displayName"
                      type="text"
                      placeholder="Display Name"
                      value={db.personal.name}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, name: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="jobTitle" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Job Title</label>
                    <input
                      id="jobTitle"
                      type="text"
                      placeholder="Job Title"
                      value={db.personal.title}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, title: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="location" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Location</label>
                    <input
                      id="location"
                      type="text"
                      placeholder="Location"
                      value={db.personal.location}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, location: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="linkedinUrl" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">LinkedIn URL</label>
                    <input
                      id="linkedinUrl"
                      type="text"
                      placeholder="LinkedIn URL"
                      value={db.personal.linkedin}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, linkedin: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="emailAddress" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Email Address</label>
                    <input
                      id="emailAddress"
                      type="email"
                      placeholder="Email Address"
                      value={db.personal.email}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, email: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Contact Number</label>
                    <input
                      id="phoneNumber"
                      type="text"
                      placeholder="Contact Number"
                      value={db.personal.phone}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, phone: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>
                </div>

                {/* Profile Photo upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-3">
                    <label htmlFor="profilePhotoUrl" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Profile Photo URL</label>
                    <input
                      id="profilePhotoUrl"
                      type="text"
                      placeholder="Profile Photo URL"
                      value={db.personal.profilePhoto}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, profilePhoto: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30 mb-2"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'profilePhoto')}
                        className="hidden"
                        id="profile-photo-upload"
                      />
                      <label
                        htmlFor="profile-photo-upload"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xxs font-mono font-semibold cursor-pointer uppercase tracking-wider text-gray-300"
                      >
                        {uploading === 'profilePhoto' ? 'Uploading...' : 'Upload Image'}
                      </label>
                    </div>
                  </div>

                  {/* Resume PDF upload */}
                  <div className="space-y-3">
                    <label htmlFor="resumePdfLink" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Resume PDF Link</label>
                    <input
                      id="resumePdfLink"
                      type="text"
                      placeholder="Resume PDF Link"
                      value={db.personal.resumePdf || ''}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, resumePdf: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30 mb-2"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, 'resumePdf')}
                        className="hidden"
                        id="resume-pdf-upload"
                      />
                      <label
                        htmlFor="resume-pdf-upload"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xxs font-mono font-semibold cursor-pointer uppercase tracking-wider text-gray-300"
                      >
                        {uploading === 'resumePdf' ? 'Uploading...' : 'Upload PDF'}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    <label htmlFor="introStatement" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Introduction Statement</label>
                    <textarea
                      id="introStatement"
                      placeholder="Introduction Statement"
                      rows={3}
                      value={db.personal.intro}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, intro: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="careerObjective" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Career Objective</label>
                    <textarea
                      id="careerObjective"
                      placeholder="Career Objective"
                      rows={3}
                      value={db.personal.objective}
                      onChange={(e) => setDb({ ...db, personal: { ...db.personal, objective: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="signatureQuote" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Signature Quote</label>
                      <input
                        id="signatureQuote"
                        type="text"
                        placeholder="Signature Quote"
                        value={db.personal.quote}
                        onChange={(e) => setDb({ ...db, personal: { ...db.personal, quote: e.target.value } })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="personalMotto" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Personal Motto</label>
                      <input
                        id="personalMotto"
                        type="text"
                        placeholder="Personal Motto"
                        value={db.personal.motto}
                        onChange={(e) => setDb({ ...db, personal: { ...db.personal, motto: e.target.value } })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold text-white font-mono">SEO metadata</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="metaTitle" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Meta Title</label>
                      <input
                        id="metaTitle"
                        type="text"
                        placeholder="Meta Title"
                        value={db.seo.title}
                        onChange={(e) => setDb({ ...db, seo: { ...db.seo, title: e.target.value } })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="metaKeywords" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Meta Keywords</label>
                      <input
                        id="metaKeywords"
                        type="text"
                        placeholder="Meta Keywords"
                        value={db.seo.keywords}
                        onChange={(e) => setDb({ ...db, seo: { ...db.seo, keywords: e.target.value } })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="metaDescription" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Meta Description</label>
                    <textarea
                      id="metaDescription"
                      placeholder="Meta Description"
                      rows={2}
                      value={db.seo.description}
                      onChange={(e) => setDb({ ...db, seo: { ...db.seo, description: e.target.value } })}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-royal-blue hover:bg-gold text-white font-mono text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-4"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Publishing Changes...' : 'Save and Publish Instantly'}</span>
                </button>
              </form>
            )}

            {/* TAB 3: RESUME TIMELINE, EDUCATION & EXPERIENCE */}
            {activeTab === 'resume' && (
              <div className="space-y-8">
                {/* EDUCATION CONFIGURATION */}
                <div className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white font-mono">Education History</h3>
                    <button
                      onClick={() => setEditingEdu({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', status: '', description: '' })}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-xxs font-mono font-semibold cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Education</span>
                    </button>
                  </div>

                  {editingEdu && (
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-4">
                      <h4 className="text-xs font-bold font-mono text-gold">{editingEdu.id ? 'Edit Education' : 'New Education'}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Institution Name"
                          value={editingEdu.institution || ''}
                          onChange={(e) => setEditingEdu({ ...editingEdu, institution: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Degree Name"
                          value={editingEdu.degree || ''}
                          onChange={(e) => setEditingEdu({ ...editingEdu, degree: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Field of Study"
                          value={editingEdu.fieldOfStudy || ''}
                          onChange={(e) => setEditingEdu({ ...editingEdu, fieldOfStudy: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Timeline (e.g., 2021 - 2026)"
                          value={editingEdu.startYear && editingEdu.endYear ? `${editingEdu.startYear} - ${editingEdu.endYear}` : ''}
                          onChange={(e) => {
                            const parts = e.target.value.split('-');
                            setEditingEdu({
                              ...editingEdu,
                              startYear: parts[0]?.trim() || '',
                              endYear: parts[1]?.trim() || ''
                            });
                          }}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Status (e.g. Result Awaited / Completed)"
                          value={editingEdu.status || ''}
                          onChange={(e) => setEditingEdu({ ...editingEdu, status: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none md:col-span-2"
                        />
                        <textarea
                          placeholder="Detailed Description"
                          rows={3}
                          value={editingEdu.description || ''}
                          onChange={(e) => setEditingEdu({ ...editingEdu, description: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none md:col-span-2"
                        />
                      </div>
                      <div className="flex items-center space-x-3 justify-end font-mono text-xxs">
                        <button onClick={() => setEditingEdu(null)} className="px-3 py-1.5 rounded bg-white/5 text-gray-400">Cancel</button>
                        <button onClick={handleSaveEdu} className="px-3 py-1.5 rounded bg-royal-blue text-white font-semibold">Save</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {db.education.map(edu => (
                      <div key={edu.id} className="p-4 rounded-xl bg-white/2 border border-white/5 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-white text-xs">{edu.institution}</h4>
                          <p className="text-xxs text-gold font-mono mt-0.5">{edu.degree} in {edu.fieldOfStudy} ({edu.startYear} - {edu.endYear})</p>
                          <p className="text-xxs text-gray-500 font-mono uppercase tracking-widest mt-1">Status: {edu.status}</p>
                          <p className="text-xs text-gray-400 mt-2 font-sans">{edu.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingEdu(edu)}
                            title="Edit Education"
                            aria-label="Edit Education"
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('education', edu.id)}
                            title="Delete Education"
                            aria-label="Delete Education"
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EXPERIENCE CONFIGURATION */}
                <div className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white font-mono">Experience / Internships</h3>
                    <button
                      onClick={() => setEditingExp({ title: '', organization: '', duration: '', responsibilities: [''] })}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-xxs font-mono font-semibold cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Experience</span>
                    </button>
                  </div>

                  {editingExp && (
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-4">
                      <h4 className="text-xs font-bold font-mono text-gold">{editingExp.id ? 'Edit Experience' : 'New Experience'}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Title (e.g. Judicial Intern)"
                          value={editingExp.title || ''}
                          onChange={(e) => setEditingExp({ ...editingExp, title: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Organization / Company"
                          value={editingExp.organization || ''}
                          onChange={(e) => setEditingExp({ ...editingExp, organization: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g. One Week / 2 Months)"
                          value={editingExp.duration || ''}
                          onChange={(e) => setEditingExp({ ...editingExp, duration: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none md:col-span-2"
                        />
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Responsibilities</label>
                          {editingExp.responsibilities?.map((resp, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <input
                                type="text"
                                placeholder={`Responsibility ${idx + 1}`}
                                value={resp}
                                onChange={(e) => {
                                  const list = [...(editingExp.responsibilities || [])];
                                  list[idx] = e.target.value;
                                  setEditingExp({ ...editingExp, responsibilities: list });
                                }}
                                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  const list = (editingExp.responsibilities || []).filter((_, i) => i !== idx);
                                  setEditingExp({ ...editingExp, responsibilities: list });
                                }}
                                className="p-1 rounded bg-red-500/10 text-red-400"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const list = [...(editingExp.responsibilities || []), ''];
                              setEditingExp({ ...editingExp, responsibilities: list });
                            }}
                            className="text-xxs font-mono text-gold font-semibold"
                          >
                            + Add Responsibility Bullet
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 justify-end font-mono text-xxs">
                        <button onClick={() => setEditingExp(null)} className="px-3 py-1.5 rounded bg-white/5 text-gray-400">Cancel</button>
                        <button onClick={handleSaveExp} className="px-3 py-1.5 rounded bg-royal-blue text-white font-semibold">Save</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {db.experience.map(exp => (
                      <div key={exp.id} className="p-4 rounded-xl bg-white/2 border border-white/5 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-white text-xs">{exp.title}</h4>
                          <p className="text-xxs text-gold font-mono mt-0.5">{exp.organization} ({exp.duration})</p>
                          <ul className="list-disc pl-4 text-xs text-gray-400 mt-2 font-sans space-y-1">
                            {exp.responsibilities.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingExp(exp)}
                            title="Edit Experience"
                            aria-label="Edit Experience"
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('experience', exp.id)}
                            title="Delete Experience"
                            aria-label="Delete Experience"
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CAPABILITIES MATRIX (SKILLS GROUPS) */}
                <div className="glass-card p-6 rounded-2xl border-white/5 space-y-8">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white font-mono">Capabilities Matrix (Categorized Skills)</h3>
                    <p className="text-xxs text-gray-500 font-mono mt-1 uppercase tracking-wider">Configure the skills displayed in the 3-column Capabilities Matrix</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CS Skills */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono border border-gold/20 px-1.5 py-0.5 rounded bg-gold/5 text-gold font-bold">CS</span>
                        <h4 className="text-xs font-bold text-white font-mono">Corporate & Compliance</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[50px] p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        {((db.skillsGroup?.cs) || []).map((skill) => (
                          <span key={skill} className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xxs bg-gold/5 border border-gold/20 text-gold">
                            <span>{skill}</span>
                            <button onClick={() => handleRemoveCsSkill(skill)} className="hover:text-red-400 font-bold font-mono text-[10px]">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          placeholder="Add compliance skill..."
                          value={newCsSkill}
                          onChange={(e) => setNewCsSkill(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                        />
                        <button onClick={handleAddCsSkill} className="px-3 py-1.5 bg-gold text-black rounded-lg text-xxs font-bold uppercase tracking-wider">Add</button>
                      </div>
                    </div>

                    {/* Law Skills */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono border border-royal-blue/30 px-1.5 py-0.5 rounded bg-royal-blue/5 text-royal-blue font-bold">LAW</span>
                        <h4 className="text-xs font-bold text-white font-mono">Advocacy & Research</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[50px] p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        {((db.skillsGroup?.law) || []).map((skill) => (
                          <span key={skill} className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xxs bg-royal-blue/5 border border-royal-blue/20 text-royal-blue">
                            <span>{skill}</span>
                            <button onClick={() => handleRemoveLawSkill(skill)} className="hover:text-red-400 font-bold font-mono text-[10px]">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          placeholder="Add advocacy skill..."
                          value={newLawSkill}
                          onChange={(e) => setNewLawSkill(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                        />
                        <button onClick={handleAddLawSkill} className="px-3 py-1.5 bg-royal-blue text-white rounded-lg text-xxs font-bold uppercase tracking-wider">Add</button>
                      </div>
                    </div>

                    {/* Pro Skills */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono border border-white/20 px-1.5 py-0.5 rounded bg-white/5 text-gray-300 font-bold">PRO</span>
                        <h4 className="text-xs font-bold text-white font-mono">Professional Assets</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[50px] p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        {((db.skillsGroup?.pro) || []).map((skill) => (
                          <span key={skill} className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xxs bg-white/5 border border-white/10 text-gray-300">
                            <span>{skill}</span>
                            <button onClick={() => handleRemoveProSkill(skill)} className="hover:text-red-400 font-bold font-mono text-[10px]">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          placeholder="Add professional asset..."
                          value={newProSkill}
                          onChange={(e) => setNewProSkill(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                        />
                        <button onClick={handleAddProSkill} className="px-3 py-1.5 bg-white/10 text-white hover:bg-white/20 rounded-lg text-xxs font-bold uppercase tracking-wider">Add</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TIMELINE MILESTONES */}
                <div className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">Academic Milestones</h3>
                      <p className="text-xxs text-gray-500 font-mono mt-0.5 uppercase tracking-wider">Configure the milestones shown in the vertical Roman numeral rail</p>
                    </div>
                    <button
                      onClick={() => setEditingMilestone({ year: '', title: '' })}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-xxs font-mono font-semibold cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  {editingMilestone && (
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-4">
                      <h4 className="text-xs font-bold font-mono text-gold">{editingMilestone.id ? 'Edit Milestone' : 'New Milestone'}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Year / Tag (e.g. 2021 Entry, CS Milestone)"
                          value={editingMilestone.year || ''}
                          onChange={(e) => setEditingMilestone({ ...editingMilestone, year: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Milestone Description"
                          value={editingMilestone.title || ''}
                          onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-3 justify-end font-mono text-xxs">
                        <button onClick={() => setEditingMilestone(null)} className="px-3 py-1.5 rounded bg-white/5 text-gray-400">Cancel</button>
                        <button onClick={handleSaveMilestone} className="px-3 py-1.5 rounded bg-royal-blue text-white font-semibold">Save</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {(db.milestones || []).map((mile, index) => (
                      <div key={mile.id || index} className="p-4 rounded-xl bg-white/2 border border-white/5 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-white text-xs">{mile.title}</h4>
                          <p className="text-xxs text-gold font-mono mt-0.5">Tag: {mile.year}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingMilestone(mile)}
                            title="Edit Milestone"
                            aria-label="Edit Milestone"
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('milestones', mile.id)}
                            title="Delete Milestone"
                            aria-label="Delete Milestone"
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SUPREME COURT VISIT EDITOR */}
                <form onSubmit={handleIdentitySubmit} className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white font-mono">Supreme Court Visit (Academic Landmark)</h3>
                    <p className="text-xxs text-gray-500 font-mono mt-0.5 uppercase tracking-wider">Configure the 3-column landmark visit texts and narratives</p>
                  </div>

                  <div className="space-y-4">
                    {/* Column 1: Tour */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-white/5 pb-4">
                      <div className="space-y-2">
                        <label htmlFor="scCol1Title" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Column 1 Title</label>
                        <input
                          id="scCol1Title"
                          type="text"
                          placeholder="Column 1 Title"
                          value={db.supremeCourt?.tourTitle || ''}
                          onChange={(e) => setDb({ ...db, supremeCourt: { ...(db.supremeCourt || { tourTitle: '', tourText: '', opportunityTitle: '', opportunityText: '', horizonsTitle: '', horizonsText: '' }), tourTitle: e.target.value } })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label htmlFor="scCol1Text" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Column 1 Body Text</label>
                        <textarea
                          id="scCol1Text"
                          placeholder="Column 1 Body Text"
                          rows={2}
                          value={db.supremeCourt?.tourText || ''}
                          onChange={(e) => setDb({ ...db, supremeCourt: { ...(db.supremeCourt || { tourTitle: '', tourText: '', opportunityTitle: '', opportunityText: '', horizonsTitle: '', horizonsText: '' }), tourText: e.target.value } })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                        />
                      </div>
                    </div>

                    {/* Column 2: Opportunity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-white/5 pb-4">
                      <div className="space-y-2">
                        <label htmlFor="scCol2Title" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Column 2 Title</label>
                        <input
                          id="scCol2Title"
                          type="text"
                          placeholder="Column 2 Title"
                          value={db.supremeCourt?.opportunityTitle || ''}
                          onChange={(e) => setDb({ ...db, supremeCourt: { ...(db.supremeCourt || { tourTitle: '', tourText: '', opportunityTitle: '', opportunityText: '', horizonsTitle: '', horizonsText: '' }), opportunityTitle: e.target.value } })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label htmlFor="scCol2Text" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Column 2 Body Text</label>
                        <textarea
                          id="scCol2Text"
                          placeholder="Column 2 Body Text"
                          rows={2}
                          value={db.supremeCourt?.opportunityText || ''}
                          onChange={(e) => setDb({ ...db, supremeCourt: { ...(db.supremeCourt || { tourTitle: '', tourText: '', opportunityTitle: '', opportunityText: '', horizonsTitle: '', horizonsText: '' }), opportunityText: e.target.value } })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                        />
                      </div>
                    </div>

                    {/* Column 3: Horizons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="scCol3Title" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Column 3 Title</label>
                        <input
                          id="scCol3Title"
                          type="text"
                          placeholder="Column 3 Title"
                          value={db.supremeCourt?.horizonsTitle || ''}
                          onChange={(e) => setDb({ ...db, supremeCourt: { ...(db.supremeCourt || { tourTitle: '', tourText: '', opportunityTitle: '', opportunityText: '', horizonsTitle: '', horizonsText: '' }), horizonsTitle: e.target.value } })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label htmlFor="scCol3Text" className="text-xxs font-mono text-gray-500 uppercase tracking-widest block font-bold">Column 3 Body Text</label>
                        <textarea
                          id="scCol3Text"
                          placeholder="Column 3 Body Text"
                          rows={2}
                          value={db.supremeCourt?.horizonsText || ''}
                          onChange={(e) => setDb({ ...db, supremeCourt: { ...(db.supremeCourt || { tourTitle: '', tourText: '', opportunityTitle: '', opportunityText: '', horizonsTitle: '', horizonsText: '' }), horizonsText: e.target.value } })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold/30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gold text-black rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Publishing...' : 'Publish SC Section'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: BLOG MANAGER */}
            {activeTab === 'blogs' && (
              <div className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-white font-mono">Blog Posts ({db.blogs.length})</h3>
                  <button
                    onClick={() => setEditingBlog({ title: '', category: 'Company Law', summary: '', content: '', readTime: '5 min read' })}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-xxs font-mono font-semibold cursor-pointer uppercase tracking-wider"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Post</span>
                  </button>
                </div>

                {editingBlog && (
                  <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold font-mono text-gold">{editingBlog.id ? 'Edit Blog Post' : 'New Blog Post'}</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Post Title"
                          aria-label="Post Title"
                          value={editingBlog.title || ''}
                          onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none md:col-span-2"
                        />
                        <select
                          title="Blog Category"
                          aria-label="Blog Category"
                          value={editingBlog.category || 'Company Law'}
                          onChange={(e) => setEditingBlog({ ...editingBlog, category: e.target.value })}
                          className="bg-[#0c0a20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="Company Law">Company Law</option>
                          <option value="Constitution">Constitution</option>
                          <option value="Corporate Governance">Corporate Governance</option>
                          <option value="Insolvency">Insolvency</option>
                          <option value="Contract Law">Contract Law</option>
                          <option value="Legal News">Legal News</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Read Time (e.g. 5 min read)"
                          aria-label="Read Time"
                          value={editingBlog.readTime || '5 min read'}
                          onChange={(e) => setEditingBlog({ ...editingBlog, readTime: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Short Summary / Excerpt"
                        aria-label="Short Summary / Excerpt"
                        value={editingBlog.summary || ''}
                        onChange={(e) => setEditingBlog({ ...editingBlog, summary: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />

                      {/* Multiple photo upload for blogs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label htmlFor="blogPhotosUpload" className="text-[10px] font-mono text-gray-500 block uppercase">Upload Blog Photos/Videos</label>
                          <input
                            id="blogPhotosUpload"
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleFileUpload(e, 'blog')}
                            className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none w-full"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="blogUrlInput" className="text-[10px] font-mono text-gray-500 block uppercase">Add Manual Media URL</label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              id="blogUrlInput"
                              placeholder="/uploads/myimage.jpg"
                              className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('blogUrlInput') as HTMLInputElement | null;
                                if (!input || !input.value.trim()) return;
                                const currentUrls = editingBlog.urls || [];
                                setEditingBlog({
                                  ...editingBlog,
                                  urls: [...currentUrls, input.value.trim()]
                                });
                                input.value = '';
                              }}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs text-white font-mono"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Display current blog urls list */}
                      {editingBlog.urls && editingBlog.urls.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-gray-500 block uppercase">Blog Attachments ({editingBlog.urls.length})</label>
                          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                            {editingBlog.urls.map((url, i) => (
                              <div key={i} className="relative w-16 h-16 rounded border border-white/10 overflow-hidden group">
                                {/\.(mp4|webm|ogg|mov)$/i.test(url) ? (
                                  <video src={url} className="w-full h-full object-cover" />
                                ) : (
                                  <img src={url} alt={`Blog Attachment Preview ${i + 1}`} className="w-full h-full object-cover" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentUrls = editingBlog.urls || [];
                                    setEditingBlog({
                                      ...editingBlog,
                                      urls: currentUrls.filter((_, idx) => idx !== i)
                                    });
                                  }}
                                  className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        placeholder="Blog Content (supports Markdown / plain text)"
                        aria-label="Blog Content"
                        rows={10}
                        value={editingBlog.content || ''}
                        onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div className="flex items-center space-x-3 justify-end font-mono text-xxs">
                      <button onClick={() => setEditingBlog(null)} className="px-3 py-1.5 rounded bg-white/5 text-gray-400">Cancel</button>
                      <button onClick={handleSaveBlog} className="px-3 py-1.5 rounded bg-royal-blue text-white font-semibold">Save Post</button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {db.blogs.length === 0 ? (
                    <div className="p-8 rounded-xl bg-white/2 border border-dashed border-white/10 text-center font-mono text-xs text-gray-500">
                      No blog posts published yet.
                    </div>
                  ) : (
                    db.blogs.map(blog => (
                      <div key={blog.id} className="p-4 rounded-xl bg-white/2 border border-white/5 flex items-start justify-between gap-4">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 text-[9px] uppercase tracking-widest font-mono">
                            {blog.category}
                          </span>
                          <h4 className="font-bold text-white text-sm mt-2">{blog.title}</h4>
                          <p className="text-xxs text-gray-500 font-mono mt-0.5">Published: {blog.publishDate} • {blog.readTime}</p>
                          <p className="text-xs text-gray-400 mt-2 font-sans">{blog.summary}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingBlog(blog)}
                            title="Edit Blog Post"
                            aria-label="Edit Blog Post"
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('blogs', blog.id)}
                            title="Delete Blog Post"
                            aria-label="Delete Blog Post"
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: GALLERY & CERTIFICATES */}
            {activeTab === 'gallery' && (
              <div className="space-y-8">
                {/* GALLERY MANAGER */}
                <div className="glass-card ambient-glow p-6 rounded-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white font-mono">Gallery Portfolio Images</h3>
                  </div>

                  {/* Add Gallery Form */}
                  <div className="p-5 rounded-xl bg-purple-950/5 border border-gold/10 shadow-[0_0_25px_rgba(139,92,246,0.03)] space-y-4">
                    <h4 className="text-xs font-bold font-mono text-gold">Upload New Gallery Photo/Video</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="galleryUpload" className="text-[10px] font-mono text-gray-500 block uppercase">Upload Photo / Video (Can upload multiple)</label>
                        <input
                          id="galleryUpload"
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => handleFileUpload(e, 'gallery')}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="galleryUrlInputManual" className="text-[10px] font-mono text-gray-500 block uppercase">Or Type URL manually</label>
                        <div className="flex space-x-2">
                          <input
                            id="galleryUrlInputManual"
                            type="text"
                            value={galleryUrlInput}
                            onChange={(e) => setGalleryUrlInput(e.target.value)}
                            placeholder="/uploads/myimage.jpg"
                            className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!galleryUrlInput.trim()) return;
                              setGalleryUrls(prev => [...prev, galleryUrlInput.trim()]);
                              setGalleryUrlInput('');
                            }}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs text-white font-mono"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Display currently added urls for this new item */}
                      {galleryUrls.length > 0 && (
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-mono text-gray-500 block uppercase">Selected Media Files ({galleryUrls.length})</label>
                          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                            {galleryUrls.map((url, i) => (
                              <div key={i} className="relative w-16 h-16 rounded border border-white/10 overflow-hidden group">
                                {/\.(mp4|webm|ogg|mov)$/i.test(url) ? (
                                  <video src={url} className="w-full h-full object-cover" />
                                ) : (
                                  <img src={url} alt={`Gallery Attachment Preview ${i + 1}`} className="w-full h-full object-cover" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i))}
                                  className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <input
                        type="text"
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                        placeholder="Media Title / Description"
                        aria-label="Media Title / Description"
                        className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full md:col-span-2"
                      />
                      <select
                        title="Gallery Category"
                        aria-label="Gallery Category"
                        value={galleryCategory}
                        onChange={(e) => setGalleryCategory(e.target.value as any)}
                        className="bg-[#0c0a20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full md:col-span-2"
                      >
                        <option value="moot">Moot Court</option>
                        <option value="court">Court Visit</option>
                        <option value="college">College Event</option>
                        <option value="event">Extracurricular</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        if (galleryUrls.length === 0 || !galleryTitle) {
                          alert('Please upload/add at least one photo/video and enter a Title');
                          return;
                        }
                        handleAddGalleryItem(galleryUrls, galleryTitle, galleryCategory);
                        setGalleryUrls([]);
                        setGalleryTitle('');
                      }}
                      className="px-4 py-2 bg-royal-blue rounded-lg text-xs font-semibold hover:bg-gold cursor-pointer text-white font-mono"
                    >
                      Add Media to Gallery
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {db.gallery.map(item => {
                      const isVid = /\.(mp4|webm|ogg|mov)$/i.test(item.url);
                      return (
                        <div key={item.id} className="relative rounded-xl overflow-hidden border border-white/5 bg-white/2 group">
                          {isVid ? (
                            <video
                              src={item.url}
                              muted
                              playsInline
                              className="w-full h-32 object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-32 object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                          <div className="p-3 bg-deep-blue/90 border-t border-white/5">
                            <h4 className="font-bold text-white text-xxs truncate">{item.title}</h4>
                            <span className="text-[9px] uppercase tracking-wider font-mono text-gold block mt-0.5">{item.category}</span>
                            <button
                              onClick={() => handleDeleteItem('gallery', item.id)}
                              className="mt-2 text-red-400 hover:text-red-300 font-mono text-[9px] flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CERTIFICATES MANAGER */}
                <div className="glass-card ambient-glow p-6 rounded-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white font-mono">Certificates & Awards</h3>
                  </div>

                  {/* Add Certificate Form */}
                  <div className="p-5 rounded-xl bg-purple-950/5 border border-gold/10 shadow-[0_0_25px_rgba(139,92,246,0.03)] space-y-4">
                    <h4 className="text-xs font-bold font-mono text-gold">Add New Certificate</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="certUpload" className="text-[10px] font-mono text-gray-500 block uppercase">Upload Certificate (Image/PDF, Can upload multiple)</label>
                        <input
                          id="certUpload"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, 'certificate')}
                          className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="certUrlInputManual" className="text-[10px] font-mono text-gray-500 block uppercase">Or Type URL manually</label>
                        <div className="flex space-x-2">
                          <input
                            id="certUrlInputManual"
                            type="text"
                            value={certUrlInput}
                            onChange={(e) => setCertUrlInput(e.target.value)}
                            placeholder="/uploads/mycert.pdf"
                            className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!certUrlInput.trim()) return;
                              setCertUrls(prev => [...prev, certUrlInput.trim()]);
                              setCertUrlInput('');
                            }}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs text-white font-mono"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Display currently added urls for this certificate */}
                      {certUrls.length > 0 && (
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-mono text-gray-500 block uppercase">Selected Certificate Files ({certUrls.length})</label>
                          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                            {certUrls.map((url, i) => (
                              <div key={i} className="relative w-16 h-16 rounded border border-white/10 overflow-hidden group">
                                {url.toLowerCase().endsWith('.pdf') ? (
                                  <div className="w-full h-full bg-[#120e0d] flex items-center justify-center text-[10px] font-mono text-gold">PDF</div>
                                ) : (
                                  <img src={url} alt={`Certificate Attachment Preview ${i + 1}`} className="w-full h-full object-cover" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setCertUrls(prev => prev.filter((_, idx) => idx !== i))}
                                  className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <input
                        type="text"
                        value={certName}
                        onChange={(e) => setCertName(e.target.value)}
                        placeholder="Certificate Title / Name"
                        aria-label="Certificate Title / Name"
                        className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full md:col-span-2"
                      />
                      <input
                        type="text"
                        value={certIssuer}
                        onChange={(e) => setCertIssuer(e.target.value)}
                        placeholder="Issuing Organization"
                        aria-label="Issuing Organization"
                        className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full md:col-span-2"
                      />
                      <input
                        type="text"
                        value={certDate}
                        onChange={(e) => setCertDate(e.target.value)}
                        placeholder="Date Earned (e.g. June 2026)"
                        aria-label="Date Earned"
                        className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full md:col-span-2"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (certUrls.length === 0 || !certName || !certIssuer) {
                          alert('Please upload/add at least one Certificate file/URL, and enter a Title and Issuer');
                          return;
                        }
                        handleAddCertificate(certName, certIssuer, certDate, certUrls);
                        setCertUrls([]);
                        setCertName('');
                        setCertIssuer('');
                        setCertDate('');
                      }}
                      className="px-4 py-2 bg-royal-blue rounded-lg text-xs font-semibold hover:bg-gold cursor-pointer text-white font-mono"
                    >
                      Add Certificate
                    </button>
                  </div>

                  <div className="space-y-4">
                    {db.certificates.map(cert => (
                      <div key={cert.id} className="p-4 rounded-xl bg-white/2 border border-white/5 flex items-center justify-between gap-4 font-sans text-xs">
                        <div>
                          <h4 className="font-bold text-white">{cert.name}</h4>
                          <p className="text-xxs text-gold font-mono mt-0.5">Issued by {cert.issuer} • {cert.date}</p>
                          {cert.url && (
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-gray-500 hover:text-white font-mono mt-1 inline-block underline"
                            >
                              View Attachment
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteItem('certificates', cert.id)}
                          title="Delete Certificate"
                          aria-label="Delete Certificate"
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'arrange' && (
              <div className="glass-card p-6 rounded-2xl border-white/5 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono border-b border-white/5 pb-3">
                    Arrange Website Layout
                  </h3>
                  <p className="text-xxs text-gray-500 font-mono mt-2 uppercase tracking-widest leading-relaxed">
                    Reorder sections on the homepage and adjust alignments (text position, element layout side, etc.) of all website sections.
                  </p>
                </div>

                {/* Section Reordering List */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-gold font-mono uppercase tracking-wider">
                    Section Order (Top to Bottom)
                  </h4>
                  
                  {(() => {
                    const sectionOrder = db.sectionOrder || ['home', 'about', 'journey', 'skills', 'supremecourt', 'gallery', 'research', 'certificates', 'contact'];
                    const sectionNames: Record<string, string> = {
                      home: 'Home (Hero & Title)',
                      about: 'About (Introduction & Objective)',
                      journey: 'Journey (Education & Milestones)',
                      skills: 'Capabilities Matrix (Core Skills)',
                      supremecourt: 'Supreme Court Visit',
                      gallery: 'Credentials Gallery (Visual Showcase)',
                      research: 'Research Projects & Blogs',
                      certificates: 'Certificates List',
                      contact: 'Contact Form & Social Links'
                    };

                    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
                      const newOrder = [...sectionOrder];
                      const targetIndex = direction === 'up' ? index - 1 : index + 1;
                      if (targetIndex < 0 || targetIndex >= newOrder.length) return;
                      
                      // Swap items
                      const temp = newOrder[index];
                      newOrder[index] = newOrder[targetIndex];
                      newOrder[targetIndex] = temp;

                      const next = { ...db, sectionOrder: newOrder };
                      publishChanges(next);
                    };

                    const handleSettingChange = (sectionId: string, key: 'textPosition' | 'layoutSide', value: string) => {
                      const currentSettings = db.layoutSettings || {};
                      const sectionSettings = currentSettings[sectionId as keyof typeof currentSettings] || {};
                      
                      const next = {
                        ...db,
                        layoutSettings: {
                          ...currentSettings,
                          [sectionId]: {
                            ...sectionSettings,
                            [key]: value
                          }
                        }
                      };
                      publishChanges(next);
                    };

                    return (
                      <div className="space-y-4 font-sans text-xs">
                        {sectionOrder.map((sectionId, idx) => {
                          const name = sectionNames[sectionId] || sectionId;
                          const settings = (db.layoutSettings?.[sectionId as keyof typeof db.layoutSettings] || {}) as any;
                          const textPosition = settings.textPosition || (sectionId === 'home' || sectionId === 'skills' || sectionId === 'certificates' || sectionId === 'contact' ? 'center' : 'left');
                          const layoutSide = settings.layoutSide || 'left';
                          
                          // Check if section supports split layout sides
                          const hasLayoutSide = ['about', 'journey', 'research'].includes(sectionId);

                          return (
                            <div key={sectionId} className="p-4 rounded-xl bg-white/2 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-mono bg-gold/15 text-gold border border-gold/20 px-2 py-0.5 rounded">
                                    Section {idx + 1}
                                  </span>
                                  <h4 className="font-bold text-white text-sm">{name}</h4>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-1">
                                  {/* Text Position Config */}
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xxs text-gray-500 font-mono uppercase">Text Position:</span>
                                    <select
                                      title="Text Position"
                                      value={textPosition}
                                      onChange={(e) => handleSettingChange(sectionId, 'textPosition', e.target.value)}
                                      className="bg-[#05040e] border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                                    >
                                      <option value="left">Left</option>
                                      <option value="center">Center</option>
                                      <option value="right">Right</option>
                                    </select>
                                  </div>

                                  {/* Split Layout side swapping */}
                                  {hasLayoutSide && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xxs text-gray-500 font-mono uppercase">
                                        {sectionId === 'about' ? 'Photo Position:' : sectionId === 'journey' ? 'Education List:' : 'Research Projects:'}
                                      </span>
                                      <select
                                        title="Layout Position"
                                        value={layoutSide}
                                        onChange={(e) => handleSettingChange(sectionId, 'layoutSide', e.target.value)}
                                        className="bg-[#05040e] border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                                      >
                                        <option value="left">Left Side</option>
                                        <option value="right">Right Side</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Ordering Buttons */}
                              <div className="flex items-center space-x-2 self-end md:self-auto font-mono">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(idx, 'up')}
                                  disabled={idx === 0}
                                  className={`p-1.5 px-3 rounded-lg text-xxs font-bold border transition-colors ${
                                    idx === 0 
                                      ? 'border-white/5 text-gray-600 cursor-not-allowed bg-transparent' 
                                      : 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer'
                                  }`}
                                >
                                  ▲ Move Up
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(idx, 'down')}
                                  disabled={idx === sectionOrder.length - 1}
                                  className={`p-1.5 px-3 rounded-lg text-xxs font-bold border transition-colors ${
                                    idx === sectionOrder.length - 1 
                                      ? 'border-white/5 text-gray-600 cursor-not-allowed bg-transparent' 
                                      : 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer'
                                  }`}
                                >
                                  ▼ Move Down
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}
