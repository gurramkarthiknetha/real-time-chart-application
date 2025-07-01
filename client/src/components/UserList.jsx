import styled from 'styled-components';

const UserListContainer = styled.div`
  padding: 15px;
`;

const UserListTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  color: #4a5568;
  font-size: 1.1rem;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
`;

const UserCount = styled.span`
  background-color: #e2e8f0;
  color: #4a5568;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8rem;
  margin-left: 8px;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 5px;
  border-radius: 8px;
  background-color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(59, 130, 246, 0.1)' : 'transparent'};
  
  &:hover {
    background-color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(59, 130, 246, 0.15)' : '#f1f5f9'};
  }
`;

const UserStatus = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #48bb78;
  margin-right: 10px;
`;

const Username = styled.div`
  font-size: 0.95rem;
  color: #1a202c;
  
  ${({ isCurrentUser }) => isCurrentUser && `
    font-weight: bold;
  `}
`;

const YouLabel = styled.span`
  font-size: 0.75rem;
  background-color: #3b82f6;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
`;

const UserList = ({ users, currentUser }) => {
  return (
    <UserListContainer>
      <UserListTitle>
        Online Users
        <UserCount>{users.length}</UserCount>
      </UserListTitle>
      
      {users.map((user) => (
        <UserItem 
          key={user.id} 
          isCurrentUser={user.id === currentUser}
        >
          <UserStatus />
          <Username isCurrentUser={user.id === currentUser}>
            {user.username}
            {user.id === currentUser && <YouLabel>You</YouLabel>}
          </Username>
        </UserItem>
      ))}
      
      {users.length === 0 && (
        <div style={{ color: '#718096', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
          No users online
        </div>
      )}
    </UserListContainer>
  );
};

export default UserList;
