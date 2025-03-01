"use client"

import React, { useState, useEffect, useRef } from 'react';
import { IconButton } from '@mui/material';
import { Mic, MicOff } from 'lucide-react';
import { Alert } from '@/components/ui/alert';

const SpeechTranslation = ({ 
  socket, 
  roomId, 
  stream, 
  targetLang
}) => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      setHasPermission(true);
      setError('');
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError('Please allow microphone access to use speech translation.');
      setHasPermission(false);
      return false;
    }
  };

  const initializeRecognition = () => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = 
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      console.log('Speech recognition started');
    };

    recognition.onresult = async (event) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptText = result[0].transcript;

      if (result.isFinal && socket?.connected) {
        console.log('Sending translation:', transcriptText);
        socket.emit("translation", {
          message: transcriptText,
          roomId: roomId,
          targetLang: targetLang
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please check your browser settings.');
        setHasPermission(false);
      } else if (event.error === 'audio-capture') {
        setError('No microphone detected. Please check your device settings.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          try {
            recognition.start();
            console.log('Restarting speech recognition');
          } catch (e) {
            console.error('Could not restart recognition:', e);
          }
        } else {
          setIsListening(false);
          retryCount.current = 0;
        }
      }
    };

    return recognition;
  };

  const toggleRecognition = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } else {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;

      retryCount.current = 0;
      recognitionRef.current = initializeRecognition();
      
      if (recognitionRef.current) {
        try {
          await recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting recognition:', error);
          setError('Failed to start speech recognition. Please try again.');
        }
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!stream || !socket) return;
      
      // Check permission on component mount
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;

      recognitionRef.current = initializeRecognition();
    };

    init();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    };
  }, [stream, socket]);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
      {error && (
        <Alert variant="destructive" className="mb-2 max-w-xs">
          {error}
        </Alert>
      )}
      <IconButton
        onClick={toggleRecognition}
        className={`p-3 rounded-full ${
          isListening 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        {isListening ? (
          <Mic className="h-6 w-6 text-white" />
        ) : (
          <MicOff className="h-6 w-6 text-white" />
        )}
      </IconButton>
    </div>
  );
};

export default SpeechTranslation;