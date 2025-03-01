"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import axiosInstance from '../apicalls/axiosInstance';

// Styled components
const ChatContainer = styled(Paper)(({ theme, isopen }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  width: isopen === 'true' ? '100%' : '48px', 
  maxWidth: isopen === 'true' ? '400px' : '48px',
  minWidth: '50px',
  overflow: 'hidden',
  zIndex: 1000,
  transition: 'all 0.3s ease',
  boxShadow: theme.shadows[4],
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 1.5),
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: '48px',
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  height: '400px',
  overflowY: 'auto',
  padding: theme.spacing(1),
  background: theme.palette.background.default,
}));

const MessageBubble = styled(Box)(({ theme, isuser }) => ({
  maxWidth: '85%',
  padding: theme.spacing(0.75, 1.5),
  borderRadius: theme.spacing(1.5),
  marginBottom: theme.spacing(0.5),
  wordBreak: 'break-word',
  background: isuser === 'true' ? theme.palette.primary.main : theme.palette.grey[200],
  color: isuser === 'true' ? theme.palette.primary.contrastText : theme.palette.text.primary,
  alignSelf: isuser === 'true' ? 'flex-end' : 'flex-start',
  fontSize: '0.9rem',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: "Hi! 👋 I'm  your health assistant. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { type: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/chat', {
        message: inputValue
      });

      if (response.data && response.data.response) {
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: response.data.response 
        }]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Sorry, I encountered an error. Please try again.');
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <ChatContainer 
      elevation={3} 
      isopen={isOpen.toString()} 
      sx={{ 
        width: isOpen ? '100%' : '48px', 
        maxWidth: isOpen ? (isMobile ? '95%' : '400px') : '48px' 
      }}
    >
      <ChatHeader onClick={() => setIsOpen(!isOpen)}>
        <Box display="flex" alignItems="center">
          <ChatIcon fontSize="small" sx={{ marginRight: 1 }} />
          {isOpen && (
            <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', marginLeft: 1 }}>
              Health Assistant <span style={{ opacity: 0.8 }}></span>
            </Typography>
          )}
        </Box>
        <IconButton 
          size="small" 
          sx={{ color: 'inherit', padding: 0.5 }}
        >
          {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </ChatHeader>

      <Collapse in={isOpen}>
        <MessageContainer>
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
            {messages.map((message, index) => (
              <ListItem
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  padding: 0.5,
                  width: '100%',
                }}
              >
                <MessageBubble isuser={message.type === 'user' ? 'true' : 'false'}>
                  <Typography variant="body2">{message.content}</Typography>
                </MessageBubble>
              </ListItem>
            ))}
            {isLoading && (
              <ListItem sx={{ justifyContent: 'flex-start', padding: 0.5 }}>
                <div className="flex flex-row gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-700 animate-bounce"></div>
                  <div className="w-3 h-3 rounded-full bg-blue-700 animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-3 h-3 rounded-full bg-blue-700 animate-bounce [animation-delay:-.5s]"></div>
                </div>
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </MessageContainer>

        <InputContainer component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            size="small"
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                paddingRight: 0 
              } 
            }}
          />
          <IconButton 
            color="primary" 
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="small"
            sx={{ alignSelf: 'center' }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </InputContainer>
      </Collapse>
    </ChatContainer>
  );
};

export default Chatbot;