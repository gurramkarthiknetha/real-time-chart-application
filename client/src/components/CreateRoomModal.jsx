import { useState } from 'react';
import styled from 'styled-components';
import { FaTimes, FaLock, FaGlobe } from 'react-icons/fa';
import { useChat } from '../hooks/useChat';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 500px;
  height: 600px; /* Fixed height to prevent fluctuation */
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative; /* For absolute positioning of children if needed */
  box-sizing: border-box; /* Include padding in height calculation */
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #1e293b;
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
  flex: 1; /* Take up remaining space */
  display: flex;
  flex-direction: column;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1; /* Take up all available space */
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const PrivacyOptions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const PrivacyOption = styled.div`
  flex: 1;
  border: 1px solid ${props => props.selected ? '#3b82f6' : '#e2e8f0'};
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  background-color: ${props => props.selected ? 'rgba(59, 130, 246, 0.1)' : 'white'};
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.selected ? '#3b82f6' : '#cbd5e1'};
    background-color: ${props => props.selected ? 'rgba(59, 130, 246, 0.1)' : '#f8fafc'};
  }
`;

const PrivacyIcon = styled.div`
  font-size: 1.5rem;
  color: ${props => props.selected ? '#3b82f6' : '#64748b'};
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PrivacyTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.selected ? '#3b82f6' : '#1e293b'};
  margin-bottom: 0.25rem;
  text-align: center;
`;

const PrivacyDescription = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem;
  border-top: 1px solid #e2e8f0;
  height: 80px; /* Fixed height to prevent fluctuation */
  min-height: 80px; /* Ensure minimum height */
  max-height: 80px; /* Ensure maximum height */
  align-items: center; /* Center buttons vertically */
  position: relative; /* For absolute positioning of children if needed */
  box-sizing: border-box; /* Include padding in height calculation */
  /* Prevent footer from changing size */
  flex-shrink: 0;
  flex-grow: 0;
`;

const Button = styled.button`
  padding: 0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  width: 140px; /* Fixed width to prevent fluctuation */
  height: 44px; /* Fixed height to prevent fluctuation */
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box; /* Include padding in width/height calculation */
  position: relative; /* For absolute positioning of children if needed */
  white-space: nowrap; /* Prevent text wrapping */
  overflow: hidden; /* Hide overflow text */
  text-overflow: ellipsis; /* Show ellipsis for overflow text */
  /* Prevent button from changing size */
  flex-shrink: 0;
  flex-grow: 0;

  ${props => props.primary ? `
    background-color: #3b82f6;
    color: white;
    border: none;

    &:hover {
      background-color: #2563eb;
    }

    &:disabled {
      background-color: #93c5fd;
      cursor: not-allowed;
    }
  ` : `
    background-color: white;
    color: #64748b;
    border: 1px solid #e2e8f0;

    &:hover {
      background-color: #f8fafc;
      color: #1e293b;
    }
  `}
`;

// Create a loading spinner component
const LoadingSpinner = styled.div`
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  position: absolute;
  left: 30px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2; /* Ensure spinner is above text */
  pointer-events: none; /* Prevent spinner from intercepting clicks */

  @keyframes spin {
    to { transform: translateY(-50%) rotate(360deg); }
  }
`;

// Create a fixed-width text container for button text
const ButtonText = styled.span`
  display: inline-block;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
  /* Ensure text doesn't change size */
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  /* Prevent text from wrapping */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
  const { createRoom, loading } = useChat();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const togglePrivacy = (isPrivate) => {
    setFormData({ ...formData, isPrivate });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Room name must be at least 2 characters';
    } else if (formData.name.length > 30) {
      errors.name = 'Room name cannot exceed 30 characters';
    }

    if (formData.description && formData.description.length > 200) {
      errors.description = 'Description cannot exceed 200 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const room = await createRoom(formData);
      if (room) {
        onRoomCreated(room);
        onClose(); // Close the modal after successful creation
      }
    } catch (error) {
      console.error('Error creating room:', error);
      // Error is already handled in the createRoom function
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Create a New Room</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="name">Room Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter room name"
              />
              {formErrors.name && <ErrorMessage>{formErrors.name}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter room description"
              />
              {formErrors.description && <ErrorMessage>{formErrors.description}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Privacy</Label>
              <PrivacyOptions>
                <PrivacyOption
                  selected={!formData.isPrivate}
                  onClick={() => togglePrivacy(false)}
                >
                  <PrivacyIcon selected={!formData.isPrivate}>
                    <FaGlobe />
                  </PrivacyIcon>
                  <PrivacyTitle selected={!formData.isPrivate}>Public</PrivacyTitle>
                  <PrivacyDescription>
                    Anyone can join this room
                  </PrivacyDescription>
                </PrivacyOption>

                <PrivacyOption
                  selected={formData.isPrivate}
                  onClick={() => togglePrivacy(true)}
                >
                  <PrivacyIcon selected={formData.isPrivate}>
                    <FaLock />
                  </PrivacyIcon>
                  <PrivacyTitle selected={formData.isPrivate}>Private</PrivacyTitle>
                  <PrivacyDescription>
                    Only invited users can join
                  </PrivacyDescription>
                </PrivacyOption>
              </PrivacyOptions>
            </FormGroup>
          </Form>
        </ModalBody>

        <ModalFooter>
          <Button
            onClick={onClose}
            type="button"
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            primary
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading && <LoadingSpinner />}
            <ButtonText>{loading ? 'Creating' : 'Create Room'}</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateRoomModal;
