import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { FaUser, FaComments, FaUsers, FaPlus, FaUserFriends } from 'react-icons/fa';

const SidebarContainer = styled.div`
  width: 300px;
  height: calc(100% - 60px); /* Subtract header height */
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  margin-top: 60px; /* Account for fixed header */

  @media (max-width: 768px) {
    width: ${props => props.isOpen ? '300px' : '0'};
    position: absolute;
    z-index: 10;
    transition: width 0.3s ease;
    overflow: hidden;
  }
`;

const SidebarHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;

  align-items: center;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserInfo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
  padding: 0.25rem 0;

  &:hover {
    opacity: 0.8;
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.bg || '#3b82f6'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Username = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-top: 0;
`;

const Tab = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  color: ${props => props.active ? '#3b82f6' : '#64748b'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: #f1f5f9;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ActionButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  z-index: 30;
  animation: pulse 2s infinite;

  @media (max-width: 768px) {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }

  &:hover {
    background-color: #2563eb;
    transform: scale(1.05);
    animation: none;
  }
`;

const AppHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 15;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const AppLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
  margin-left: ${props => props.isMobile ? '3rem' : '0'};

  svg {
    font-size: 1.75rem;
  }
`;

const MobileToggle = styled.button`
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 20;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  border: none;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Sidebar = ({
  children,
  activeTab = 'rooms',
  onTabChange,
  onCreateRoom
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Add event listener for window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get initials for avatar placeholder
  const getInitials = () => {
    if (!user?.username) return '';
    return user.username.charAt(0).toUpperCase();
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Fixed App Header with Logo - Always visible */}
      <AppHeader>
        <AppLogo isMobile={isMobile}>
          <FaUserFriends />
          <span>chart application</span>
        </AppLogo>
      </AppHeader>

      {/* Mobile Toggle Button */}
      <MobileToggle onClick={toggleSidebar}>
        <FaUsers />
      </MobileToggle>

      {/* Sidebar */}
      <SidebarContainer isOpen={isOpen}>
        <MainContent>
          <SidebarHeader>
            <UserInfo to="/profile">
              <Avatar bg={!user?.avatar ? `hsl(${user?.username?.charCodeAt(0) * 10}, 70%, 50%)` : undefined}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  getInitials()
                )}
              </Avatar>
              <Username>{user?.username}</Username>
            </UserInfo>
          </SidebarHeader>

          <TabsContainer>
            <Tab
              active={activeTab === 'rooms'}
              onClick={() => onTabChange('rooms')}
            >
              <FaUsers size={14} />
              Rooms
            </Tab>
            <Tab
              active={activeTab === 'conversations'}
              onClick={() => onTabChange('conversations')}
            >
              <FaComments size={14} />
              Messages
            </Tab>
          </TabsContainer>

          <SidebarContent onClick={() => setIsOpen(false)}>
            {children}
          </SidebarContent>
        </MainContent>
      </SidebarContainer>

      {/* Fixed Action Button - Always visible when on Rooms tab */}
      {activeTab === 'rooms' && (
        <ActionButton onClick={onCreateRoom} title="Create new room">
          <FaPlus />
        </ActionButton>
      )}
    </>
  );
};

export default Sidebar;
