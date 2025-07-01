import styled from 'styled-components';
import { FaLock, FaHashtag } from 'react-icons/fa';

const RoomListContainer = styled.div`
  padding: 1rem;
`;

const RoomListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
`;

const RoomCount = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
`;

const RoomListItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RoomItem = styled.div`
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${props => props.active ? '#e0f2fe' : 'transparent'};
  border: 1px solid ${props => props.active ? '#bae6fd' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? '#e0f2fe' : '#f1f5f9'};
  }
`;

const RoomItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const RoomIcon = styled.div`
  color: ${props => props.isPrivate ? '#f59e0b' : '#3b82f6'};
  display: flex;
  align-items: center;
`;

const RoomName = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RoomDescription = styled.p`
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
`;

const EmptyStateIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
`;

const EmptyStateText = styled.p`
  font-size: 0.875rem;
  margin: 0;
`;

const RoomList = ({ rooms = [], currentRoom, onRoomSelect }) => {
  // Handle room click
  const handleRoomClick = (roomId) => {
    onRoomSelect(roomId);
  };
  
  return (
    <RoomListContainer>
      <RoomListHeader>
        <Title>Available Rooms</Title>
        <RoomCount>{rooms.length}</RoomCount>
      </RoomListHeader>
      
      {rooms.length > 0 ? (
        <RoomListItems>
          {rooms.map(room => (
            <RoomItem 
              key={room._id} 
              active={currentRoom && currentRoom._id === room._id}
              onClick={() => handleRoomClick(room._id)}
            >
              <RoomItemHeader>
                <RoomIcon isPrivate={room.isPrivate}>
                  {room.isPrivate ? <FaLock size={12} /> : <FaHashtag size={12} />}
                </RoomIcon>
                <RoomName>{room.name}</RoomName>
              </RoomItemHeader>
              {room.description && (
                <RoomDescription>{room.description}</RoomDescription>
              )}
            </RoomItem>
          ))}
        </RoomListItems>
      ) : (
        <EmptyState>
          <EmptyStateIcon>
            <FaHashtag />
          </EmptyStateIcon>
          <EmptyStateText>No rooms available</EmptyStateText>
          <EmptyStateText>Create a new room to get started</EmptyStateText>
        </EmptyState>
      )}
    </RoomListContainer>
  );
};

export default RoomList;
