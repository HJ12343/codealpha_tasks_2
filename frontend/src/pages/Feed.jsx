import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL } from '../context/AuthContext';
import { Heart, MessageSquare, Trash2, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Feed = () => {
  const { user, token } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Track open comment sections by postId
  const [openComments, setOpenComments] = useState({});
  const [newCommentText, setNewCommentText] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, imageUrl }),
      });

      if (!response.ok) throw new Error('Failed to create post');
      const newPost = await response.json();
      
      setPosts([newPost, ...posts]);
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete post');
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      // Optimistic Update
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            hasLiked: !post.hasLiked,
            likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1
          };
        }
        return post;
      }));

      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to toggle like');
      const data = await response.json();

      // Sync with server response
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            hasLiked: data.liked,
            likesCount: data.likesCount
          };
        }
        return post;
      }));
    } catch (err) {
      console.error(err);
      // Revert in case of failure
      fetchPosts();
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

      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...(post.comments || []), createdComment]
          };
        }
        return post;
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

      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount - 1,
            comments: post.comments.filter(c => c.id !== commentId)
          };
        }
        return post;
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

  if (loading && posts.length === 0) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="feed-layout">
      <div className="feed-main-col">
        {/* Create Post Widget */}
        <div className="glass-card compose-card">
          <form onSubmit={handleCreatePost}>
            <div className="compose-row">
              <img
                src={user?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                alt="Your Avatar"
                className="user-avatar-small"
              />
              <textarea
                className="compose-textarea"
                placeholder="What's on your mind? Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
                required
              />
            </div>
            
            {showImageInput && (
              <div className="compose-image-input-wrapper">
                <input
                  type="url"
                  className="form-input compose-image-input"
                  placeholder="Paste image URL here (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div className="compose-image-preview">
                    <img src={imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>
            )}

            <div className="compose-footer">
              <button
                type="button"
                className={`btn-icon-label ${showImageInput ? 'active' : ''}`}
                onClick={() => setShowImageInput(!showImageInput)}
              >
                <ImageIcon size={18} />
                <span>Image Link</span>
              </button>
              
              <button
                type="submit"
                className="btn-primary btn-compose-submit"
                disabled={submitting || !content.trim()}
              >
                {submitting ? 'Posting...' : 'Share Post'}
                <Send size={14} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </form>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {posts.length === 0 ? (
          <div className="glass-card empty-feed-card">
            <h3>Your Feed is Empty</h3>
            <p>Write your first post or go to the explore page to follow other users and see their updates!</p>
            <Link to="/explore" className="btn-primary" style={{ marginTop: 15, display: 'inline-block' }}>
              Discover People
            </Link>
          </div>
        ) : (
          <div className="posts-container">
            {posts.map((post) => (
              <div className="glass-card post-card" key={post.id}>
                {/* Post Header */}
                <div className="post-header">
                  <Link to={`/profile/${post.user.username}`} className="post-header-author">
                    <img
                      src={post.user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                      alt={post.user.name}
                      className="user-avatar-small"
                    />
                    <div className="author-meta">
                      <span className="author-name">{post.user.name}</span>
                      <span className="author-username">@{post.user.username}</span>
                    </div>
                  </Link>
                  <div className="post-header-right">
                    <span className="post-time">{formatTime(post.createdAt)}</span>
                    {user && user.id === post.userId && (
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
                              {user && (user.id === comment.userId || user.id === post.userId) && (
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
                        src={user?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
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
      
      {/* Sidebar Suggestions Column */}
      <div className="feed-sidebar-col">
        <div className="glass-card welcome-card">
          <div className="welcome-profile-header">
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
              alt={user?.name}
              className="user-avatar-large"
            />
            <div className="welcome-profile-meta">
              <h4>{user?.name}</h4>
              <Link to={`/profile/${user?.username}`} className="welcome-profile-link">
                @{user?.username}
              </Link>
            </div>
          </div>
          <div className="welcome-card-footer">
            <p className="welcome-bio">{user?.bio || 'No bio yet.'}</p>
            <div className="btn-group-sidebar">
              <Link to={`/profile/${user?.username}`} className="btn-secondary sidebar-btn-view">
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
