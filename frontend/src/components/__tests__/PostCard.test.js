import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '../PostCard';
import { AuthContext } from '../../context/AuthContext';

// Mock axios
jest.mock('axios');
const mockAxios = require('axios');

const mockPost = {
  _id: '1',
  title: 'Test Post',
  content: 'This is a test post content',
  author: {
    _id: '1',
    username: 'testuser',
    profileImage: null
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  likes: [],
  comments: []
};

const mockAuthContext = {
  user: {
    id: 1,
    username: 'testuser',
    user_type: 'student'
  },
  token: 'mock-token'
};

const renderWithContext = (component) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('PostCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.post.mockResolvedValue({ data: { success: true } });
  });

  it('renders post content correctly', () => {
    renderWithContext(<PostCard post={mockPost} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('displays like button and count', () => {
    renderWithContext(<PostCard post={mockPost} />);

    expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles like button click', async () => {
    renderWithContext(<PostCard post={mockPost} />);

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/posts/1/like'),
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token'
          })
        })
      );
    });
  });

  it('shows comment button', () => {
    renderWithContext(<PostCard post={mockPost} />);

    expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument();
  });

  it('formats creation date correctly', () => {
    renderWithContext(<PostCard post={mockPost} />);

    // Check if date is displayed (format may vary)
    expect(screen.getByText(/2023/)).toBeInTheDocument();
  });

  it('shows post with likes', () => {
    const postWithLikes = {
      ...mockPost,
      likes: ['user1', 'user2']
    };

    renderWithContext(<PostCard post={postWithLikes} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows post with comments', () => {
    const postWithComments = {
      ...mockPost,
      comments: [
        { _id: '1', content: 'Comment 1', author: { username: 'user1' } },
        { _id: '2', content: 'Comment 2', author: { username: 'user2' } }
      ]
    };

    renderWithContext(<PostCard post={postWithComments} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('handles missing author gracefully', () => {
    const postWithoutAuthor = {
      ...mockPost,
      author: null
    };

    renderWithContext(<PostCard post={postWithoutAuthor} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
  });
});