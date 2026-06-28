import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL } from '../context/AuthContext';
import { Search, UserPlus, UserMinus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Explore = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `${API_URL}/users?search=${encodeURIComponent(searchQuery)}`
        : `${API_URL}/users`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      // Optimistic update
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isFollowing: !isFollowing,
            followersCount: isFollowing ? u.followersCount - 1 : u.followersCount + 1
          };
        }
        return u;
      }));

      const response = await fetch(`${API_URL}/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to toggle follow status');
      const data = await response.json();

      // Sync with response
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isFollowing: data.following,
            followersCount: data.followersCount
          };
        }
        return u;
      }));
    } catch (err) {
      console.error(err);
      fetchUsers();
    }
  };

  return (
    <div className="explore-container">
      {/* Search Header */}
      <div className="explore-header-row">
        <div className="explore-title-block">
          <h2>Discover People</h2>
          <p>Find new creators, developers, designers, and friends to build your feed.</p>
        </div>
        
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon-field" />
          <input
            type="text"
            className="form-input search-input-field"
            placeholder="Search by name or @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {loading && users.length === 0 ? (
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card empty-feed-card" style={{ textAlign: 'center' }}>
          <p>No creators match your search "{searchQuery}"</p>
        </div>
      ) : (
        <div className="explore-grid">
          {users.map((u) => (
            <div className="glass-card user-explore-card" key={u.id}>
              <div className="user-explore-card-banner"></div>
              
              <div className="user-explore-card-content">
                <Link to={`/profile/${u.username}`} className="user-explore-avatar-wrapper">
                  <img
                    src={u.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                    alt={u.name}
                    className="user-explore-avatar"
                  />
                </Link>
                
                <Link to={`/profile/${u.username}`} className="user-explore-names">
                  <h4 className="user-explore-name">{u.name}</h4>
                  <span className="user-explore-username">@{u.username}</span>
                </Link>

                <p className="user-explore-bio">{u.bio || "Hello, let's connect!"}</p>
                
                <div className="user-explore-followers-count">
                  <strong>{u.followersCount}</strong> {u.followersCount === 1 ? 'follower' : 'followers'}
                </div>

                <button
                  className={`btn-primary btn-explore-follow ${u.isFollowing ? 'following' : ''}`}
                  onClick={() => handleFollowToggle(u.id, u.isFollowing)}
                >
                  {u.isFollowing ? (
                    <>
                      <UserMinus size={14} style={{ marginRight: 6 }} />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} style={{ marginRight: 6 }} />
                      Follow
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
