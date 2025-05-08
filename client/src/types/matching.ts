// User definition matching our database schema on the backend
export interface User {
  id: number;
  username: string;
  fullname: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  teachSkills: string[];
  learnSkills: string[];
  createdAt: string;
}

// Partial user information for use in UI components
export type PartialUser = Pick<User, 'id' | 'fullname' | 'displayName' | 'avatar' | 'teachSkills' | 'learnSkills'>;

// Suggested matches returned from the matching API
export interface SuggestedMatch {
  user: PartialUser;
  matchingTeachSkills: string[];
  matchingLearnSkills: string[];
  matchScore: number;
}

// Pairing request with both users involved (requesting user and recipient)
export interface PairingRequestWithUsers {
  id: number;
  requesterId: number;
  recipientId: number;
  teachSkills: string[];
  learnSkills: string[];
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt: string;
  requester: PartialUser;
  recipient: PartialUser;
}

// Learning session with participants
export interface LearningSession {
  id: number;
  requestId: number;
  scheduledDate: string;
  duration: number;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  participants: SessionParticipant[];
  teachSkills?: string[];  // Skills being taught in this session
  learnSkills?: string[];  // Skills being learned in this session
}

// Session participant
export interface SessionParticipant {
  id: number;
  sessionId: number;
  userId: number;
  attended: boolean;
  feedback?: string;
  rating?: number;
  user: PartialUser;
}