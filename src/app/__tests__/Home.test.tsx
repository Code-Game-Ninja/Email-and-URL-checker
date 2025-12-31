import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../page';
import '@testing-library/jest-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<Home />);
    expect(screen.getByText('Cybersecurity Risk AI')).toBeInTheDocument();
  });

  it('renders input area and analyze button', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText('Paste a suspicious URL or message text here...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze Risk' })).toBeInTheDocument();
  });

  it('handles input change', () => {
    render(<Home />);
    const input = screen.getByPlaceholderText('Paste a suspicious URL or message text here...');
    fireEvent.change(input, { target: { value: 'http://example.com' } });
    expect(input).toHaveValue('http://example.com');
  });

  it('submits analysis request and displays result', async () => {
    const mockResponse = {
      data: {
        overall_risk: 'SAFE',
        url_analysis: {
          summary: 'Safe URL',
          confidence: 'High',
        },
        fraud_text_analysis: {
          fraud_probability: 0.1,
          category: 'safe',
          signals_detected: [],
          extracted_emails: [],
        },
        user_warning_message: 'This content appears safe.',
        disclaimer: 'Disclaimer text',
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    render(<Home />);
    const input = screen.getByPlaceholderText('Paste a suspicious URL or message text here...');
    fireEvent.change(input, { target: { value: 'http://example.com' } });

    const button = screen.getByRole('button', { name: 'Analyze Risk' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('This content appears safe.')).toBeInTheDocument();
      expect(screen.getByText('SAFE')).toBeInTheDocument();
    });
  });

  it('displays error toast on failure', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    // We need to import toast to check if it was called,
    // but we mocked it in the module scope.
    // However, since we mock 'sonner' entirely, we can spy on it via require or just trust the mock implementation if we exported it?
    // Actually we can import it in the test file too since it's mocked.
    const { toast } = require('sonner');

    render(<Home />);
    const input = screen.getByPlaceholderText('Paste a suspicious URL or message text here...');
    fireEvent.change(input, { target: { value: 'bad' } });

    const button = screen.getByRole('button', { name: 'Analyze Risk' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An error occurred while analyzing. Please try again.', expect.anything());
    });
  });
});
