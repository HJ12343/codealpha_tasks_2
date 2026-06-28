import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext, API_URL } from '../context/AuthContext';
import { Heart, MessageSquare, Trash2, Edit3, Calendar, Check, X, Send } from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, token, updateUserProfileState } = useContext(AuthContext);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Edit Profile Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // Comments state for posts on profile
  const [openComments, setOpenComments] = useState({});
  const [newCommentText, setNewCommentText] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users/profile/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error('User not found');
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);
      setIsFollowing(data.isFollowing);
      setFollowersCount(data.followersCount);

      // Initialize edit fields
      setEditName(data.name);
      setEditBio(data.bio || '');
      setEditAvatarUrl(data.avatarUrl || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;

    try {
      // Optimistic update
      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);

      const response = await fetch(`${API_URL}/users/${profile.id}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to update follow status');
      const data = await response.json();
      
      setIsFollowing(data.following);
      setFollowersCount(data.followersCount);
    } catch (err) {
      console.error(err);
      // Revert if error
      setIsFollowing(profile.isFollowing);
      setFollowersCount(profile.followersCount);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          avatarUrl: editAvatarUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      const updatedUser = await response.json();

      // Update state in profile page
      setProfile(prev => ({
        ...prev,
        name: updatedUser.name,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl,
      }));

      // Update state in globally shared AuthContext
      updateUserProfileState({
        name: updatedUser.name,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl,
      });

      setShowEditModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete post');
      setProfile(prev => ({
        ...prev,
        posts: prev.posts.filter(p => p.id !== postId)
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      setProfile(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              hasLiked: !post.hasLiked,
              likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1
            };
          }
          return post;
        })
      }));

      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to toggle like');
      const data = await response.json();

      setProfile(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              hasLiked: data.liked,
              likesCount: data.likesCount
            };
          }
          return post;
        })
      }));
    } catch (err) {
      console.error(err);
      fetchProfile();
    }
  };

  const toggleComments = (postId) => {
    setOpenComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentChange = (postId, text) => {
    setNewCommentText(prev => ({
      ...prev,
      [postId]: text
    }));
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = newCommentText[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (!response.ok) throw new Error('Failed to add comment');
      const createdComment = await response.json();

      setProfile(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              commentsCount: post.commentsCount + 1,
              comments: [...(post.comments || []), createdComment]
            };
          }
          return post;
        })
      }));

      handleCommentChange(postId, '');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      setProfile(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              commentsCount: post.commentsCount - 1,
              comments: post.comments.filter(c => c.id !== commentId)
            };
          }
          return post;
        })
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="glass-card error-card">
        <h3>User Not Found</h3>
        <p>{error || "The profile you are looking for doesn't exist."}</p>
        <Link to="/" className="btn-primary" style={{ marginTop: 15, display: 'inline-block' }}>
          Back to Feed
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  return (
    <div className="profile-container">
      {/* Profile Header Card */}
      <div className="glass-card profile-header-card">
        <div className="profile-banner-color"></div>
        <div className="profile-header-details">
          <div className="profile-avatar-row">
            <img
              src={profile.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
              alt={profile.name}
              className="profile-large-avatar"
            />
            
            <div className="profile-action-btn-row">
              {isOwnProfile ? (
                <button className="btn-primary btn-profile-edit" onClick={() => setShowEditModal(true)}>
                  <Edit3 size={14} style={{ marginRight: 6 }} />
                  Edit Profile
                </button>
              ) : (
                <button
                  className={`btn-primary btn-profile-follow ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <div className="profile-info-section">
            <h2 className="profile-display-name">{profile.name}</h2>
            <p className="profile-username-tag">@{profile.username}</p>
            <p className="profile-bio-text">{profile.bio || 'No bio yet.'}</p>
            
            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Calendar size={14} style={{ marginRight: 4 }} />
                Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </span>
            </div>

            <div className="profile-stats-row">
              <div className="stat-box">
                <span className="stat-num">{profile.posts?.length || 0}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{followersCount}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{profile.followingCount || 0}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts list */}
      <div className="profile-posts-section">
        <h3 className="section-title">{profile.name}'s Posts</h3>
        
        {profile.posts?.length === 0 ? (
          <div className="glass-card empty-feed-card" style={{ textAlign: 'center' }}>
            <p>No posts published yet.</p>
          </div>
        ) : (
          <div className="posts-container">
            {profile.posts.map((post) => (
              <div className="glass-card post-card" key={post.id}>
                {/* Post Header */}
                <div className="post-header">
                  <div className="post-header-author">
                    <img
                      src={post.user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                      alt={post.user.name}
                      className="user-avatar-small"
                    />
                    <div className="author-meta">
                      <span className="author-name">{post.user.name}</span>
                      <span className="author-username">@{post.user.username}</span>
                    </div>
                  </div>
                  <div className="post-header-right">
                    <span className="post-time">{formatTime(post.createdAt)}</span>
                    {currentUser && currentUser.id === post.userId && (
                      <button
                        className="btn-icon delete-post-btn"
                        onClick={() => handleDeletePost(post.id)}
                        title="Delete Post"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="post-body">
                  <p className="post-text">{post.content}</p>
                  {post.imageUrl && (
                    <div className="post-image-wrapper">
                      <img src={post.imageUrl} alt="Post content" loading="lazy" />
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="post-actions">
                  <button
                    className={`post-action-btn like-btn ${post.hasLiked ? 'liked' : ''}`}
                    onClick={() => handleLikePost(post.id)}
                  >
                    <Heart size={18} fill={post.hasLiked ? "currentColor" : "none"} className="heart-icon" />
                    <span>{post.likesCount}</span>
                  </button>

                  <button
                    className={`post-action-btn comment-btn ${openComments[post.id] ? 'active' : ''}`}
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageSquare size={18} />
                    <span>{post.commentsCount}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {openComments[post.id] && (
                  <div className="comments-section">
                    <div className="comments-list">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <div className="comment-item" key={comment.id}>
                            <Link to={`/profile/${comment.user.username}`}>
                              <img
                                src={comment.user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                                alt={comment.user.name}
                                className="user-avatar-tiny"
                              />
                            </Link>
                            <div className="comment-content-box">
                              <div className="comment-bubble">
                                <div className="comment-author-row">
                                  <Link to={`/profile/${comment.user.username}`} className="comment-author-name">
                                    {comment.user.name}
                                  </Link>
                                  <span className="comment-time">{formatTime(comment.createdAt)}</span>
                                </div>
                                <p className="comment-text">{comment.content}</p>
                              </div>
                              
                              {/* Can delete if own comment or own post */}
                              {currentUser && (currentUser.id === comment.userId || currentUser.id === post.userId) && (
                                <button
                                  className="btn-text-delete"
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-comments-text">No comments yet. Be the first to comment!</p>
                      )}
                    </div>

                    {/* Add Comment Box */}
                    <form className="add-comment-form" onSubmit={(e) => handleAddComment(e, post.id)}>
                      <img
                        src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                        alt="Your avatar"
                        className="user-avatar-tiny"
                      />
                      <input
                        type="text"
                        className="form-input comment-input"
                        placeholder="Write a comment..."
                        value={newCommentText[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        required
                      />
                      <button type="submit" className="btn-comment-submit" disabled={!newCommentText[post.id]?.trim()}>
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-card animate-zoom">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    disabled={updating}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Tell us about yourself..."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={160}
                    disabled={updating}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Avatar Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    disabled={updating}
                  />
                </div>

                {editAvatarUrl && (
                  <div className="modal-avatar-preview">
                    <span>Preview:</span>
                    <img src={editAvatarUrl} alt="Avatar Preview" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)} disabled={updating}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updating || !editName.trim()}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
