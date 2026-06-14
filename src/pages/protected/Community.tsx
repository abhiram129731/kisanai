import React, { useState, useMemo, useEffect } from 'react';
import { useFarms } from '../../context/FarmContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Send, 
  ShieldAlert, 
  Users, 
  BookOpen, 
  Trophy, 
  Compass, 
  MessageCircle,
  CheckCircle,
  Plus,
  Image,
  X,
  Trash2
} from 'lucide-react';

export const Community: React.FC = () => {
  const { posts, likePost, addComment, addCommunityPost, deleteCommunityPost, experts, farms } = useFarms();
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

  const [activeTab, setActiveTab] = useState<'feed' | 'questions' | 'experts' | 'groups' | 'nearby' | 'success'>('feed');

  const [liveUsers, setLiveUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchLiveUsers = async () => {
      const list: any[] = [];
      try {
        const data = await api.auth.getFarmers();
        data.forEach((u: any) => {
          list.push({
            uid: u.uid,
            displayName: u.displayName || 'Farmer',
            photoURL: u.photoURL || '',
            role: u.role || 'farmer'
          });
        });
        setLiveUsers(list);
        return;
      } catch (err) {
        console.warn("[Community API] Failed to fetch farmers network from MongoDB API, checking fallback profiles:", err);
      }
      
      // Supplement from local storage registered users
      try {
        const savedMock = localStorage.getItem('kisan_registered_users');
        if (savedMock) {
          const registered = JSON.parse(savedMock);
          Object.keys(registered).forEach(email => {
            const u = registered[email].profile;
            if (u && !list.some(item => item.email?.toLowerCase() === email.toLowerCase())) {
              list.push({
                uid: u.uid || email,
                displayName: u.displayName || 'Farmer',
                email: u.email || email,
                photoURL: u.photoURL || '',
                role: u.role || 'farmer'
              });
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
      
      setLiveUsers(list);
    };
    
    fetchLiveUsers();
  }, []);

  const farmersNetwork = useMemo(() => {
    return liveUsers.filter(u => u.uid !== userId);
  }, [liveUsers, userId]);

  const liveExperts = useMemo(() => {
    return liveUsers.filter(u => u.role === 'admin');
  }, [liveUsers]);

  const [joinedGroups, setJoinedGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem(`kisan_joined_groups_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const toggleGroupJoin = (groupName: string) => {
    setJoinedGroups(prev => {
      const updated = prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName];
      localStorage.setItem(`kisan_joined_groups_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Connection list state
  const [connections, setConnections] = useState<string[]>(() => {
    const saved = localStorage.getItem(`kisan_connections_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [followedExperts, setFollowedExperts] = useState<string[]>(() => {
    const saved = localStorage.getItem(`kisan_followed_experts_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    localStorage.setItem(`kisan_connections_${userId}`, JSON.stringify(connections));
  }, [connections, userId]);

  React.useEffect(() => {
    localStorage.setItem(`kisan_followed_experts_${userId}`, JSON.stringify(followedExperts));
  }, [followedExperts, userId]);

  // Post form state
  const [newPostContent, setNewPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<'feed' | 'questions'>('feed');
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Comment input map
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Active Chat drawer simulation
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [chatInputText, setChatInputText] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, { sender: string; text: string; time: string }[]>>(() => {
    const saved = localStorage.getItem(`kisan_chats_${userId}`);
    return saved ? JSON.parse(saved) : {};
  });

  React.useEffect(() => {
    localStorage.setItem(`kisan_chats_${userId}`, JSON.stringify(chatMessages));
  }, [chatMessages, userId]);

  const nearbyFarmers: any[] = [];
  const groups: any[] = [];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const authorName = user?.displayName || user?.email?.split('@')[0] || 'Farmer';
    const authorRoleLabel = `Farmer${farms.length > 0 ? ` • ${farms[0].name}` : ''}`;
    const authorAvatarUrl = user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'Farmer'}`;

    addCommunityPost({
      author: authorName,
      authorId: userId,
      authorRole: authorRoleLabel,
      authorAvatar: authorAvatarUrl,
      content: newPostContent,
      category: postCategory,
      imageUrl: postImagePreview || undefined
    });

    setNewPostContent('');
    setPostImagePreview(null);
  };

  const handleSendComment = (postId: string) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;

    addComment(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !chatInputText.trim()) return;

    const newMsg = {
      sender: 'user',
      text: chatInputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => ({
      ...prev,
      [activeChatUser]: [...(prev[activeChatUser] || []), newMsg]
    }));

    setChatInputText('');
    
    // Simulate Expert response after 2 seconds
    setTimeout(() => {
      const expertMsg = {
        sender: activeChatUser,
        text: 'Thank you for your update. I recommend applying neem oil spray (5ml/liter) next week.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => ({
        ...prev,
        [activeChatUser]: [...(prev[activeChatUser] || []), expertMsg]
      }));
    }, 2000);
  };

  // Filtered posts based on active tab
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (activeTab === 'feed') return true;
      if (activeTab === 'questions') return p.category === 'questions';
      if (activeTab === 'success') return p.category === 'success';
      return true;
    });
  }, [posts, activeTab]);

  return (
    <div className="community-page-layout">
      {/* Title */}
      <div className="community-header-card glass-card flex-between">
        <div className="flex-center" style={{ gap: '0.75rem' }}>
          <Users size={28} className="icon-primary" />
          <div>
            <h2>{t('comm.title')}</h2>
            <p className="text-muted">Discuss crop treatment, verify soil profiles, and trade tips in Telugu/Hindi</p>
          </div>
        </div>

        {/* Reputation widget */}
        <div className="rep-badge-card flex-center">
          <Trophy size={18} className="trophy-gold" />
          <div className="rep-details">
            <span className="rep-score">150 {t('comm.repScore')}</span>
            <span className="rep-level">Active Contributor Badge</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="community-tabs-row flex-between">
        <div className="tabs-nav-list flex-center">
          <button className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>{t('comm.feed')}</button>
          <button className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>Q&A Forum</button>
          <button className={`tab-btn ${activeTab === 'experts' ? 'active' : ''}`} onClick={() => setActiveTab('experts')}>{t('comm.experts')}</button>
          <button className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>{t('comm.groups')}</button>
          <button className={`tab-btn ${activeTab === 'nearby' ? 'active' : ''}`} onClick={() => setActiveTab('nearby')}>{t('comm.nearby')}</button>
          <button className={`tab-btn ${activeTab === 'success' ? 'active' : ''}`} onClick={() => setActiveTab('success')}>Success Stories</button>
        </div>
      </nav>

      {/* Main Grid split */}
      <main className="community-main-grid">
        {/* Left Side: feed/tab-contents */}
        <section className="community-content-pane flex-column" style={{ gap: '1.5rem' }}>
          {/* Create Post container */}
          {(activeTab === 'feed' || activeTab === 'questions') && (
            <div className="create-post-card glass-card">
              <form onSubmit={handleCreatePost} className="flex-column" style={{ gap: '1rem' }}>
                <textarea 
                  className="form-input create-post-textarea" 
                  rows={2}
                  placeholder={t('comm.createPost')}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                
                {postImagePreview && (
                  <div className="post-preview-thumbnail relative" style={{ alignSelf: 'flex-start', maxWidth: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={postImagePreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                    <button 
                      type="button" 
                      onClick={() => setPostImagePreview(null)}
                      style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div className="post-action-row flex-between">
                  <div className="post-type-selector flex-center" style={{ gap: '0.75rem' }}>
                    <select 
                      className="form-input" 
                      value={postCategory} 
                      onChange={(e) => setPostCategory(e.target.value as any)}
                      style={{ padding: '0.25rem 0.5rem', width: '120px', fontSize: '0.8rem' }}
                    >
                      <option value="feed">General Feed</option>
                      <option value="questions">Question/Q&A</option>
                    </select>

                    <label className="flex-center" style={{ cursor: 'pointer', color: 'var(--text-secondary)', gap: '0.25rem', fontSize: '0.8rem' }}>
                      <Image size={16} className="icon-primary" />
                      <span>Attach Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm flex-center">
                    Publish <Send size={12} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab contents router */}
          <AnimatePresence mode="wait">
            {/* 1. Feed / Q&A / Success list */}
            {(activeTab === 'feed' || activeTab === 'questions' || activeTab === 'success') && (
              <motion.div 
                key="posts-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="posts-list flex-column"
                style={{ gap: '1.5rem' }}
              >
                {filteredPosts.map(post => (
                  <div key={post.id} className="post-item-card glass-card">
                    <div className="post-author-row flex-between">
                      <div className="author-info flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start' }}>
                        <img src={post.authorAvatar} alt={post.author} className="author-avatar" />
                        <div>
                          <h4 className="author-name">{post.author}</h4>
                          <span className="author-role">{post.authorRole}</span>
                        </div>
                      </div>
                      <div className="flex-center" style={{ gap: '0.75rem' }}>
                        <span className="post-time text-muted">{new Date(post.date).toLocaleDateString()}</span>
                        {(post.authorId === userId || post.author === 'Abhiram Pulkam' || post.author === (user?.displayName || user?.email?.split('@')[0] || 'Farmer')) && (
                          <button 
                            className="delete-post-btn flex-center"
                            onClick={() => deleteCommunityPost(post.id)}
                            title="Delete Post"
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              color: 'var(--text-muted)', 
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: 'var(--radius-sm)',
                              transition: 'all var(--transition-fast)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="post-body-text">{post.content}</p>

                    {post.imageUrl && (
                      <div className="post-image-attachment">
                        <img src={post.imageUrl} alt="Attached community file" className="post-attached-img" />
                      </div>
                    )}

                    <div className="post-reaction-metrics flex-between">
                      <button className="reaction-btn flex-center" onClick={() => likePost(post.id)}>
                        <ThumbsUp size={14} /> <span>{post.likes || 0} Likes</span>
                      </button>
                      <span className="comments-count text-muted">{(post.comments || []).length} Comments</span>
                    </div>

                    {/* Comments section */}
                    <div className="post-comments-wrapper">
                      {(post.comments || []).map(c => (
                        <div key={c.id} className="comment-item flex-between">
                          <div>
                            <span className="comment-author">{c.author}:</span>
                            <span className="comment-text">{c.content}</span>
                          </div>
                          <span className="comment-time text-muted">{new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}

                      {/* Add comment box */}
                      <div className="add-comment-dock flex-between">
                        <input 
                          type="text" 
                          className="form-input comment-input" 
                          placeholder="Type comment..." 
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                        />
                        <button className="btn btn-primary comment-send-btn flex-center" onClick={() => handleSendComment(post.id)}>
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* 2. Expert Network */}
            {activeTab === 'experts' && (
              <motion.div 
                key="experts-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="experts-grid"
              >
                {liveExperts.length === 0 ? (
                  <div className="empty-submissions glass-card text-center flex-column flex-center" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '3rem' }}>🎓</div>
                    <h4>No verified experts found</h4>
                    <p className="text-muted">Admins and agricultural experts will be listed here.</p>
                  </div>
                ) : (
                  liveExperts.map(exp => (
                    <div key={exp.uid} className="expert-item-card glass-card flex-between">
                      <div className="expert-main-info flex-center" style={{ gap: '1rem', justifyContent: 'flex-start' }}>
                        <div className="expert-avatar-status relative">
                          <img src={exp.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${exp.displayName}`} alt={exp.displayName} className="expert-avatar-img" />
                          <span className="status-dot online"></span>
                        </div>
                        <div>
                          <h4 className="expert-name-title">{exp.displayName} <span className="expert-badge-verified">✓ Expert</span></h4>
                          <p className="expert-specialty">System Administrator</p>
                          <p className="expert-location text-muted">{exp.email}</p>
                        </div>
                      </div>

                      <div className="expert-actions flex-center" style={{ gap: '0.75rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setActiveChatUser(exp.displayName)}>
                          {t('comm.message')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* 3. Groups Directory */}
            {activeTab === 'groups' && (
              <motion.div 
                key="groups-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="groups-grid"
              >
                {groups.length === 0 ? (
                  <div className="empty-submissions glass-card text-center flex-column flex-center" style={{ width: '100%', gridColumn: 'span 2', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem' }}>👥</div>
                    <h4>No farming groups available</h4>
                    <p className="text-muted">Community groups will be enabled in a future release.</p>
                  </div>
                ) : (
                  groups.map((group, idx) => (
                    <div key={idx} className="group-item-card glass-card flex-column" style={{ gap: '1rem' }}>
                      <div className="group-header flex-between">
                        <h4 className="group-name-header">{group.name}</h4>
                        <span className="members-badge">
                          {group.members + (joinedGroups.includes(group.name) ? 1 : 0)} farmers
                        </span>
                      </div>
                      <p className="group-desc text-muted">{group.desc}</p>
                      <button 
                        className={`btn btn-sm ${joinedGroups.includes(group.name) ? 'btn-secondary' : 'btn-outline'}`}
                        style={{ alignSelf: 'flex-start' }} 
                        onClick={() => toggleGroupJoin(group.name)}
                      >
                        {joinedGroups.includes(group.name) ? 'Leave Group' : 'Join Group'}
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* 4. Nearby Farmers list */}
            {activeTab === 'nearby' && (
              <motion.div 
                key="nearby-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="nearby-grid"
              >
                {farmersNetwork.length === 0 ? (
                  <div className="empty-submissions glass-card text-center flex-column flex-center" style={{ padding: '2rem' }}>
                    <div style={{ fontSize: '3rem' }}>👥</div>
                    <h4>No other farmers found</h4>
                    <p className="text-muted">Registered farmers in the network will appear here.</p>
                  </div>
                ) : (
                  farmersNetwork.map((farmer, idx) => (
                    <div key={idx} className="nearby-farmer-card glass-card flex-between">
                      <div className="farmer-info flex-center" style={{ gap: '1rem', justifyContent: 'flex-start' }}>
                        <img src={farmer.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${farmer.displayName}`} alt={farmer.displayName} className="farmer-avatar-img" />
                        <div>
                          <h4 className="farmer-name-lbl">{farmer.displayName}</h4>
                          <p className="farmer-distance">{farmer.email || 'Verified Farmer'}</p>
                          <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>{farmer.role || 'Farmer'}</span>
                        </div>
                      </div>

                      <div className="farmer-actions flex-center" style={{ gap: '0.75rem' }}>
                        <button 
                          className={`btn btn-sm ${connections.includes(farmer.displayName) ? 'btn-secondary' : 'btn-outline'}`}
                          onClick={() => {
                            if (connections.includes(farmer.displayName)) {
                              setConnections(prev => prev.filter(n => n !== farmer.displayName));
                            } else {
                              setConnections(prev => [...prev, farmer.displayName]);
                            }
                          }}
                        >
                          {connections.includes(farmer.displayName) ? 'Connected' : 'Connect'}
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => setActiveChatUser(farmer.displayName)}>
                          Message
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Side: Quick info panel */}
        <section className="community-sidebar-pane glass-card">
          <h3>Verified Experts Directory</h3>
          <p className="text-muted" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>Consult verified agricultural administrators and advisors.</p>
          
          <div className="expert-list-summary">
            {liveExperts.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>No verified experts online.</p>
            ) : (
              liveExperts.map(exp => (
                <div 
                  key={exp.uid} 
                  className="mini-expert-row flex-between"
                  onClick={() => setActiveChatUser(exp.displayName)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
                    <img src={exp.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${exp.displayName}`} alt={exp.displayName} className="mini-expert-avatar" />
                    <div>
                      <h4>{exp.displayName}</h4>
                      <span className="specialty-lbl">System Admin</span>
                    </div>
                  </div>
                  <span className="mini-status-dot online"></span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Simulated Active Chat Drawer Popover */}
      <AnimatePresence>
        {activeChatUser && (
          <motion.div 
            className="chat-drawer-container glass-card"
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
          >
            <div className="chat-drawer-header flex-between">
              <div>
                <h4>Message: {activeChatUser}</h4>
                <span className="status-indicator">Online</span>
              </div>
              <button className="btn btn-secondary chat-close-btn" onClick={() => setActiveChatUser(null)}>×</button>
            </div>

            <div className="chat-drawer-messages">
              {(chatMessages[activeChatUser] || []).map((msg, idx) => (
                <div key={idx} className={`drawer-msg ${msg.sender === 'user' ? 'user' : 'other'}`}>
                  <p className="msg-text">{msg.text}</p>
                  <span className="msg-time">{msg.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="chat-drawer-dock flex-between">
              <input 
                type="text" 
                className="form-input drawer-input" 
                placeholder="Type message..." 
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary drawer-send-btn flex-center">
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .community-page-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        .community-header-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .community-header-card h2 {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .icon-primary { color: var(--color-primary); }

        .rep-badge-card {
          background-color: var(--color-light-green);
          border: 1px solid rgba(22, 163, 74, 0.2);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          gap: 0.75rem;
        }

        html[data-theme='dark'] .rep-badge-card {
          background-color: rgba(22, 163, 74, 0.1);
        }

        .trophy-gold {
          color: var(--color-warning);
        }

        .rep-details {
          display: flex;
          flex-direction: column;
        }

        .rep-score {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--color-primary-hover);
        }

        .rep-level {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        /* Tabs row */
        .community-tabs-row {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.25rem;
        }

        .tabs-nav-list {
          gap: 1.5rem;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        /* Main layout split */
        .community-main-grid {
          display: grid;
          grid-template-columns: 1.4fr 0.6fr;
          gap: 2rem;
        }

        .community-content-pane {
          width: 100%;
        }

        .create-post-card {
          background-color: var(--bg-primary);
          padding: 1.25rem;
        }

        .create-post-textarea {
          resize: none;
        }

        /* Post Items */
        .post-item-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .author-name {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .author-role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .post-time {
          font-size: 0.75rem;
        }

        .post-body-text {
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--text-secondary);
        }

        .post-image-attachment {
          border-radius: var(--radius-md);
          overflow: hidden;
          max-height: 250px;
          border: 1px solid var(--border-color);
        }

        .post-attached-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-reaction-metrics {
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          padding: 0.6rem 0;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .reaction-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 600;
          gap: 0.5rem;
          font-family: var(--font-body);
        }

        .reaction-btn:hover {
          color: var(--color-primary);
        }

        /* Comments List */
        .post-comments-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }

        .comment-item {
          font-size: 0.85rem;
          background-color: var(--bg-secondary);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
        }

        .comment-author {
          font-weight: 700;
          color: var(--color-primary-hover);
          margin-right: 0.5rem;
        }

        .comment-text {
          color: var(--text-secondary);
        }

        .comment-time {
          font-size: 0.7rem;
        }

        .add-comment-dock {
          margin-top: 0.5rem;
          gap: 0.75rem;
        }

        .comment-input {
          flex-grow: 1;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
        }

        .comment-send-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          padding: 0;
        }

        /* Experts panel lists */
        .experts-grid, .nearby-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .expert-item-card, .nearby-farmer-card {
          background-color: var(--bg-primary);
          padding: 1.25rem;
        }

        .expert-avatar-img, .farmer-avatar-img {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: var(--radius-full);
          border: 2px solid var(--bg-primary);
        }

        .status-dot.online { background-color: var(--color-success); }
        .status-dot.offline { background-color: var(--text-muted); }

        .expert-name-title {
          font-size: 1.05rem;
          font-weight: 800;
        }

        .expert-badge-verified {
          font-size: 0.7rem;
          color: var(--color-primary);
          background-color: var(--color-light-green);
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-sm);
          font-weight: 700;
        }

        .expert-specialty {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .expert-location {
          font-size: 0.75rem;
        }

        /* Nearby farmers specific classes */
        .farmer-name-lbl {
          font-size: 1.05rem;
          font-weight: 700;
        }

        .farmer-distance {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* Groups grid */
        .groups-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .group-item-card {
          background-color: var(--bg-primary);
          padding: 1.5rem;
        }

        .group-name-header {
          font-size: 1.05rem;
          font-weight: 800;
        }

        .members-badge {
          font-size: 0.75rem;
          color: var(--color-primary);
          background-color: var(--color-light-green);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          font-weight: 700;
        }

        .group-desc {
          font-size: 0.85rem;
          line-height: 1.4;
        }

        /* Sidebar experts list */
        .community-sidebar-pane {
          background-color: var(--bg-primary);
          padding: 1.5rem;
          height: fit-content;
        }

        .community-sidebar-pane h3 {
          font-size: 1.1rem;
          font-weight: 800;
        }

        .expert-list-summary {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.25rem;
        }

        .mini-expert-row {
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .mini-expert-row:last-child {
          border-bottom: none;
        }

        .mini-expert-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .mini-expert-row h4 {
          font-size: 0.85rem;
          font-weight: 700;
        }

        .specialty-lbl {
          font-size: 0.7rem;
          color: var(--color-primary);
          font-weight: 600;
        }

        .mini-status-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
        }
        .mini-status-dot.online { background-color: var(--color-success); }
        .mini-status-dot.offline { background-color: var(--text-muted); }

        /* Chat Popover drawer styles */
        .chat-drawer-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          height: 400px;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          z-index: 250;
          padding: 0;
          overflow: hidden;
        }

        .chat-drawer-header {
          padding: 0.75rem 1rem;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .chat-drawer-header h4 {
          font-size: 0.9rem;
          font-weight: 800;
        }

        .status-indicator {
          font-size: 0.7rem;
          color: var(--color-success);
          font-weight: 600;
        }

        .chat-close-btn {
          font-size: 1.5rem;
          padding: 0 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .chat-drawer-messages {
          flex-grow: 1;
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .drawer-msg {
          max-width: 80%;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          line-height: 1.4;
          display: flex;
          flex-direction: column;
        }

        .drawer-msg.user {
          align-self: flex-end;
          background-color: var(--color-primary);
          color: #FFFFFF;
          border-top-right-radius: 0;
        }

        .drawer-msg.other {
          align-self: flex-start;
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          border-top-left-radius: 0;
        }

        .msg-time {
          font-size: 0.65rem;
          align-self: flex-end;
          margin-top: 0.15rem;
          opacity: 0.7;
        }

        .chat-drawer-dock {
          border-top: 1px solid var(--border-color);
          padding: 0.75rem 1rem;
          background-color: var(--bg-primary);
          gap: 0.5rem;
        }

        .drawer-input {
          flex-grow: 1;
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
        }

        .drawer-send-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          padding: 0;
        }

        @media (max-width: 1024px) {
          .community-main-grid {
            grid-template-columns: 1fr;
          }
          .community-sidebar-pane {
            display: none;
          }
          .groups-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
