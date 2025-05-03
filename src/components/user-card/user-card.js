import { useState, useEffect } from 'react';
import './user-card.css';

// Icons (using emoji for simplicity, can be replaced with your preferred icon library)
const RepoIcon = () => <span>📁</span>;
const StarIcon = () => <span>⭐</span>;
const ForkIcon = () => <span>🍴</span>;
const LocationIcon = () => <span>📍</span>;
const CompanyIcon = () => <span>🏢</span>;
const LinkIcon = () => <span>🔗</span>;
const CalendarIcon = () => <span>📅</span>;

export default function UserCard({ user }) {
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch detailed user data and repositories on component mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        
        // Fetch detailed user information
        const userResponse = await fetch(`https://api.github.com/users/${user.login}`);
        if (!userResponse.ok) {
          throw new Error(`GitHub API error: ${userResponse.status}`);
        }
        const userData = await userResponse.json();
        
        // Fetch user's repositories
        const reposResponse = await fetch(`https://api.github.com/users/${user.login}/repos?sort=updated&per_page=6`);
        if (!reposResponse.ok) {
          throw new Error(`GitHub API error: ${reposResponse.status}`);
        }
        const reposData = await reposResponse.json();
        
        setUserData(userData);
        setRepos(reposData);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [user.login]);
  
  // Function to format date nicely
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get language color for repository
  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Python: '#3572A5',
      Java: '#b07219',
      Ruby: '#701516',
      PHP: '#4F5D95',
      'C#': '#178600',
      'C++': '#f34b7d'
      // Add more languages as needed
    };
    
    return colors[language] || '#bbbbbb';
  };
  
  // If the component is still loading, show a skeleton loader
  if (loading) {
    return (
      <div className="profile-card">
        <div className="profile-header" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
          <div className="skeleton skeleton-avatar"></div>
          <div className="skeleton skeleton-text large"></div>
          <div className="skeleton skeleton-text medium"></div>
          
          <div className="profile-stats">
            {[...Array(3)].map((_, i) => (
              <div className="stat-item" key={i}>
                <div className="skeleton skeleton-stat"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="profile-details">
          <div className="skeleton-details">
            {[...Array(4)].map((_, i) => (
              <div className="skeleton skeleton-detail" key={i}></div>
            ))}
          </div>
          
          <div className="repos-section">
            <div className="repos-header">
              <div className="skeleton" style={{ height: '24px', width: '150px' }}></div>
            </div>
            
            <div className="skeleton-repos">
              {[...Array(3)].map((_, i) => (
                <div className="skeleton skeleton-repo" key={i}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If there was an error, show error message
  if (error) {
    return (
      <div className="profile-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
        <p>Error loading user data: {error}</p>
        <button 
          className="profile-button" 
          style={{ marginTop: '1rem', maxWidth: '200px', margin: '1rem auto' }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="profile-card">
      {/* User Profile Header */}
      <div className="profile-header">
        <img 
          src={userData?.avatar_url || user.avatar_url} 
          alt={`${user.login}'s avatar`}
          className="profile-avatar"
        />
        <h2 className="profile-name">{userData?.name || user.login}</h2>
        <div className="profile-username">@{user.login}</div>
        
        {userData?.bio && (
          <p className="profile-bio">{userData.bio}</p>
        )}
        
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{userData?.public_repos || 0}</span>
            <span className="stat-label">Repositories</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userData?.followers || 0}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userData?.following || 0}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
      </div>
      
      {/* User Profile Details */}
      <div className="profile-details">
        <div className="detail-list">
          {userData?.location && (
            <div className="detail-item">
              <span className="detail-icon"><LocationIcon /></span>
              <span className="detail-text">{userData.location}</span>
            </div>
          )}
          
          {userData?.company && (
            <div className="detail-item">
              <span className="detail-icon"><CompanyIcon /></span>
              <span className="detail-text">{userData.company}</span>
            </div>
          )}
          
          {userData?.blog && (
            <div className="detail-item">
              <span className="detail-icon"><LinkIcon /></span>
              <a 
                href={userData.blog.startsWith('http') ? userData.blog : `https://${userData.blog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-text"
              >
                {userData.blog}
              </a>
            </div>
          )}
          
          {userData?.created_at && (
            <div className="detail-item">
              <span className="detail-icon"><CalendarIcon /></span>
              <span className="detail-text">
                Joined {formatDate(userData.created_at)}
              </span>
            </div>
          )}
        </div>
        
        <div className="profile-buttons">
          <a 
            href={userData?.html_url || user.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="profile-button"
          >
            View GitHub Profile
          </a>
          
          {userData?.html_url && (
            <a 
              href={`${userData.html_url}?tab=repositories`}
              target="_blank" 
              rel="noopener noreferrer"
              className="profile-button secondary"
            >
              All Repositories
            </a>
          )}
        </div>
        
        {/* Repositories Section */}
        <div className="repos-section">
          <div className="repos-header">
            <h3 className="repos-title">Recent Repositories</h3>
          </div>
          
          {repos.length > 0 ? (
            <div className="repos-list">
              {repos.map(repo => (
                <a 
                  key={repo.id} 
                  href={repo.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="repo-card"
                >
                  <div className="repo-name">
                    <span className="repo-icon"><RepoIcon /></span>
                    {repo.name}
                  </div>
                  
                  {repo.description && (
                    <p className="repo-description">
                      {repo.description.length > 120 
                        ? `${repo.description.substring(0, 120)}...` 
                        : repo.description}
                    </p>
                  )}
                  
                  <div className="repo-meta">
                    {repo.language && (
                      <div className="repo-meta-item">
                        <span 
                          className="language-dot" 
                          style={{ backgroundColor: getLanguageColor(repo.language) }}
                        ></span>
                        {repo.language}
                      </div>
                    )}
                    
                    <div className="repo-meta-item">
                      <StarIcon />
                      {repo.stargazers_count}
                    </div>
                    
                    <div className="repo-meta-item">
                      <ForkIcon />
                      {repo.forks_count}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: 'var(--text-tertiary)',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--divider)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
              <p>No public repositories found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}